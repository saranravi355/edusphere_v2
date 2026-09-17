'use server';

import { after } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/components/ui/form';
import { isAcceptedAnswerSheet, isLegacyDoc, guessMimeType } from '@/lib/grading/extractText';
import { matchStudentByFilename, matchStudentFromOcrText, type RosterStudent } from '@/lib/grading/bulkMatch';
import { uploadAnswerSheet } from '@/lib/grading/storage';
import type { CourseworkType, IBProgramme } from '@/lib/grading/types';
import { ctx, runGrading } from './actions';

const COURSEWORK_TYPES: CourseworkType[] = ['internal-assessment', 'extended-essay', 'tok', 'external-assessment', 'exam'];
const PROGRAMMES: IBProgramme[] = ['DP', 'MYP'];

/**
 * Bulk-upload many scanned answer sheets for one assessment at once, without picking a student
 * per file up front. Each file is matched to a student on the class roster automatically -
 * first by filename (matchStudentByFilename), then, once OCR'd, by any name or roll number the
 * student wrote on the sheet itself (matchStudentFromOcrText). A file that still can't be
 * matched is created with studentId null and shows up in the queue for a teacher to assign by
 * hand (assignStudent, below) - it is still OCR'd and graded regardless, since grading needs
 * the subject/level/programme common to the whole batch, not the student's identity, and
 * publishResult (actions.ts) already refuses to publish an unassigned sheet.
 *
 * Every file is uploaded and given a row synchronously, so the response - and the queue the
 * teacher sees - comes back immediately without waiting on OCR/grading for the whole batch.
 * The actual OCR+grading work runs in `after()`, sequentially per file (sequential, not
 * parallel, so the batch doesn't hammer the AI provider pool's per-minute rate limits all at
 * once - see lib/ai/pool.ts). A very large batch can still exceed the serverless function's own
 * max duration before every file finishes; anything left stuck in OCR_PROCESSING/EVALUATING
 * when that happens can be re-run individually with the existing per-row "Retry" action.
 */
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

  const programme: IBProgramme = PROGRAMMES.includes(rawProgramme as IBProgramme) ? (rawProgramme as IBProgramme) : 'DP';
  const courseworkType: CourseworkType = COURSEWORK_TYPES.includes(rawCourseworkType as CourseworkType)
    ? (rawCourseworkType as CourseworkType)
    : 'exam';

  const roster: RosterStudent[] = await prisma.student.findMany({
    where: { classroomId, isActive: true },
    select: { id: true, name: true, registrationNo: true },
  });

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const prepared: { submissionId: string; buffer: Buffer; fileName: string; mimeType: string }[] = [];
  let matchedAtUpload = 0;

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || guessMimeType(file.name);

    let fileUrl: string;
    try {
      fileUrl = await uploadAnswerSheet(buffer, file.name, mimeType);
    } catch {
      // One bad upload shouldn't abort the whole batch - the rest still proceed.
      continue;
    }

    const matched = matchStudentByFilename(file.name, roster);
    if (matched) matchedAtUpload++;

    const submission = await prisma.aIGradingSubmission.create({
      data: {
        studentId: matched?.id ?? null,
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
    for (const item of prepared) {
      await runGrading(item.submissionId, item.buffer, item.fileName, item.mimeType, { subjectName, level, courseworkType, programme }, async ocrText => {
        const current = await prisma.aIGradingSubmission.findUnique({ where: { id: item.submissionId }, select: { studentId: true } });
        if (current?.studentId) return; // already matched by filename
        const matched = matchStudentFromOcrText(ocrText, roster);
        if (matched) {
          await prisma.aIGradingSubmission.update({ where: { id: item.submissionId }, data: { studentId: matched.id } });
        }
      });
    }
    revalidatePath('/teacher/grading/ai-grader');
  });

  revalidatePath('/teacher/grading/ai-grader');
  const unmatched = prepared.length - matchedAtUpload;
  return {
    success:
      `${prepared.length} file${prepared.length === 1 ? '' : 's'} uploaded — grading in progress. ` +
      `${matchedAtUpload} matched to a student by filename` +
      (unmatched > 0 ? `, ${unmatched} still need a student assigned once grading finishes (or sooner, by hand).` : '.'),
  };
}

/** Assigns (or reassigns) which student a bulk-uploaded sheet belongs to, once a teacher has
 *  confirmed or corrected it by hand - required before a sheet can be published, since a grade
 *  needs a real student to attach to (see the studentId check in publishResult, actions.ts). */
export async function assignStudent(submissionId: string, studentId: string): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing.' };

  const submission = await prisma.aIGradingSubmission.findUnique({ where: { id: submissionId }, select: { classroomId: true } });
  if (!submission || !c.teacher.classes.some(k => k.id === submission.classroomId)) return { error: 'Not one of your classes.' };

  const student = await prisma.student.findFirst({
    where: { id: studentId, classroomId: submission.classroomId, isActive: true },
    select: { id: true },
  });
  if (!student) return { error: 'Choose a student from this class.' };

  await prisma.aIGradingSubmission.update({ where: { id: submissionId }, data: { studentId: student.id } });
  revalidatePath('/teacher/grading/ai-grader');
  return { success: 'Student assigned.' };
}
