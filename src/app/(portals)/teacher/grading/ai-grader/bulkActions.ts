'use server';

import { after } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/components/ui/form';
import { isAcceptedAnswerSheet, isLegacyDoc, guessMimeType } from '@/lib/grading/extractText';
import { matchStudentByFilename, type RosterStudent } from '@/lib/grading/bulkMatch';
import { uploadAnswerSheet } from '@/lib/grading/storage';
import type { CourseworkType, IBProgramme } from '@/lib/grading/types';
import { ctx, runGrading } from './actions';

const COURSEWORK_TYPES: CourseworkType[] = ['internal-assessment', 'extended-essay', 'tok', 'external-assessment', 'exam'];
const PROGRAMMES: IBProgramme[] = ['DP', 'MYP'];

/**
 * Bulk-upload many scanned answer sheets for one assessment at once, without picking a student
 * per file in the form - every file is matched to a student purely by its filename
 * (matchStudentByFilename), which means the teacher is expected to save each file named with
 * that student's registration number or full name before uploading. This is deliberately the
 * ONLY matching path: no OCR-based fallback, no manual per-row assignment step. Every file must
 * match exactly one roster student BEFORE anything is uploaded - if any don't, the whole batch
 * is rejected up front with the list of filenames that failed to match, so the teacher fixes
 * the filenames and re-uploads, rather than the queue filling up with partially-identified rows.
 *
 * Every file is uploaded and given a row synchronously, so the response - and the queue the
 * teacher sees - comes back immediately without waiting on OCR/grading for the whole batch. The
 * actual OCR+grading work runs in `after()`, up to BATCH_CONCURRENCY files at a time rather than
 * one at a time - OCR is mostly waiting on a remote PaddleOCR job, not local work, so running
 * several concurrently is what actually cuts a batch's wall-clock time down, and the AI grading
 * pool (lib/ai/pool.ts) already handles a rate-limit response on any one request by failing
 * over/cooling down that account rather than taking the whole batch down with it. A very large
 * batch can still exceed the serverless function's own max duration before every file finishes;
 * anything left stuck is caught by the queue's own stuck-detection (AIGraderClient.tsx) and can
 * be re-run individually with "Retry".
 */
const BATCH_CONCURRENCY = 3;

async function runInPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runner));
}
export async function bulkUploadAndGrade(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing. Ask an administrator to check your profile.' };

  const classroomId = String(formData.get('classroomId') ?? '');
  const subjectName = String(formData.get('subjectName') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const term = String(formData.get('term') ?? '').trim();
  const level = String(formData.get('level') ?? '');
  const rawProgramme = String(formData.get('programme') ?? '');
  const rawCourseworkType = String(formData.get('courseworkType') ?? '');
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

  if (!c.teacher.classes.some(k => k.id === classroomId)) return { error: 'That is not one of your classes.' };
  if (!title) return { error: 'Name the assessment — it is how the result is identified later.' };
  if (!term) return { error: 'Choose a term.' };
  if (!subjectName) return { error: 'Choose a subject.' };
  if (files.length === 0) return { error: 'Choose at least one answer sheet to upload.' };

  for (const file of files) {
    if (isLegacyDoc(file.name, file.type)) {
      return { error: `"${file.name}" is an old-style .doc file — re-save it as .docx and re-upload the batch.` };
    }
    if (!isAcceptedAnswerSheet(file.name, file.type)) {
      return { error: `"${file.name}" is an unsupported file type — upload PDF, DOCX, TXT, JPG, PNG or WEBP.` };
    }
  }

  const roster: RosterStudent[] = await prisma.student.findMany({
    where: { classroomId, isActive: true },
    select: { id: true, name: true, registrationNo: true },
  });

  // Match every file BEFORE uploading anything - all or nothing, so a typo in one filename
  // doesn't leave the queue half-populated with sheets that then need sorting out by hand.
  const matches = files.map(file => ({ file, match: matchStudentByFilename(file.name, roster) }));
  const unmatched = matches.filter(m => !m.match);
  if (unmatched.length > 0) {
    return {
      error:
        `Could not match ${unmatched.length} file${unmatched.length === 1 ? '' : 's'} to a student by filename: ` +
        unmatched.map(m => `"${m.file.name}"`).join(', ') +
        `. Rename ${unmatched.length === 1 ? 'it' : 'them'} with the student's registration number or full name and try again.`,
    };
  }

  const programme: IBProgramme = PROGRAMMES.includes(rawProgramme as IBProgramme) ? (rawProgramme as IBProgramme) : 'DP';
  const courseworkType: CourseworkType = COURSEWORK_TYPES.includes(rawCourseworkType as CourseworkType)
    ? (rawCourseworkType as CourseworkType)
    : 'exam';

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const prepared: { submissionId: string; buffer: Buffer; fileName: string; mimeType: string }[] = [];

  for (const { file, match } of matches) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || guessMimeType(file.name);

    let fileUrl: string;
    try {
      fileUrl = await uploadAnswerSheet(buffer, file.name, mimeType);
    } catch {
      // One bad upload shouldn't abort the whole batch - the rest still proceed.
      continue;
    }

    const submission = await prisma.aIGradingSubmission.create({
      data: {
        studentId: match!.id,
        originalFileName: file.name,
        batchId,
        classroomId,
        teacherId: c.teacher.id,
        subjectName,
        title,
        term,
        programme,
        courseworkType,
        fileUrl,
        result: { questions: [], generalFeedback: [], totalScore: 0, maxTotal: 0, detectedSubject: subjectName, annotations: [], scoreRationale: '' },
        totalScore: 0,
        maxTotal: 0,
        status: 'OCR_PROCESSING',
      },
    });

    prepared.push({ submissionId: submission.id, buffer, fileName: file.name, mimeType });
  }

  if (prepared.length === 0) return { error: 'Could not store any of the selected files.' };

  after(async () => {
    await runInPool(prepared, BATCH_CONCURRENCY, item =>
      runGrading(item.submissionId, item.buffer, item.fileName, item.mimeType, { subjectName, level, courseworkType, programme })
    );
    revalidatePath('/teacher/grading/ai-grader');
  });

  revalidatePath('/teacher/grading/ai-grader');
  return { success: `${prepared.length} file${prepared.length === 1 ? '' : 's'} uploaded, all matched to a student — grading in progress.` };
}
