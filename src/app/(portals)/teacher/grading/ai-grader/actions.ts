'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { guard, TEACHER_ROLES } from '@/lib/authz';
import type { ActionState } from '@/components/ui/form';
import { runOcr } from '@/lib/grading/ocr';
import { gradeAnswerSheet, buildMarkedOcrText } from '@/lib/grading/grade';
import { uploadAnswerSheet } from '@/lib/grading/storage';
import type { CourseworkType, IBProgramme } from '@/lib/grading/types';

async function ctx() {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, subjects: true, classes: { select: { id: true, name: true } } },
  });
  if (!teacher) return null;
  return { auth, teacher };
}

const COURSEWORK_TYPES: CourseworkType[] = ['internal-assessment', 'extended-essay', 'tok', 'external-assessment', 'exam'];
const PROGRAMMES: IBProgramme[] = ['DP', 'MYP'];

/**
 * Upload one scanned answer sheet and grade it: store the PDF in Blob, run
 * PaddleOCR, grade with the Groq -> OpenAI failover pool, and write the full
 * result to AIGradingSubmission. Nothing touches AssessmentResult yet - that
 * only happens on publish (below), once a teacher has reviewed the AI's work.
 */
export async function uploadAndGrade(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing. Ask an administrator to check your profile.' };

  const classroomId = String(formData.get('classroomId') ?? '');
  const studentId = String(formData.get('studentId') ?? '');
  const subjectName = String(formData.get('subjectName') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const term = String(formData.get('term') ?? '').trim();
  const level = String(formData.get('level') ?? '');
  const rawProgramme = String(formData.get('programme') ?? '');
  const rawCourseworkType = String(formData.get('courseworkType') ?? '');
  const file = formData.get('file');

  if (!c.teacher.classes.some(k => k.id === classroomId)) return { error: 'That is not one of your classes.' };
  if (!title) return { error: 'Name the assessment — it is how the result is identified later.' };
  if (!term) return { error: 'Choose a term.' };
  if (!subjectName) return { error: 'Choose a subject.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a scanned answer sheet PDF.' };
  if (file.type !== 'application/pdf') return { error: 'Only PDF files are supported.' };

  const student = await prisma.student.findFirst({
    where: { id: studentId, classroomId, isActive: true },
    select: { id: true },
  });
  if (!student) return { error: 'Choose a student from this class.' };

  const programme: IBProgramme = PROGRAMMES.includes(rawProgramme as IBProgramme) ? (rawProgramme as IBProgramme) : 'DP';
  const courseworkType: CourseworkType = COURSEWORK_TYPES.includes(rawCourseworkType as CourseworkType)
    ? (rawCourseworkType as CourseworkType)
    : 'exam';

  const buffer = Buffer.from(await file.arrayBuffer());

  let fileUrl: string;
  try {
    fileUrl = await uploadAnswerSheet(buffer, file.name);
  } catch (err) {
    return { error: `Could not store the file: ${(err as Error).message}` };
  }

  const submission = await prisma.aIGradingSubmission.create({
    data: {
      studentId: student.id,
      classroomId,
      teacherId: c.teacher.id,
      subjectName,
      title,
      term,
      programme,
      courseworkType,
      fileUrl,
      result: { questions: [], generalFeedback: [], totalScore: 0, maxTotal: 0, detectedSubject: subjectName, annotations: [] },
      totalScore: 0,
      maxTotal: 0,
      status: 'OCR_PROCESSING',
    },
  });

  await runGrading(submission.id, buffer, { subjectName, level, courseworkType, programme });

  revalidatePath('/teacher/grading/ai-grader');
  return { success: `${file.name} uploaded — grading in progress.` };
}

/** Shared by uploadAndGrade and retryGrading. Never throws — every failure is written to the
 *  submission row itself (status FAILED + errorMessage) so it shows up in the queue rather
 *  than vanishing into a server log. */
async function runGrading(
  submissionId: string,
  pdfBuffer: Buffer,
  params: { subjectName: string; level: string; courseworkType: CourseworkType; programme: IBProgramme }
): Promise<void> {
  try {
    const ocr = await runOcr(pdfBuffer);
    await prisma.aIGradingSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'EVALUATING',
        ocrText: ocr.text,
        ocrPages: ocr.pages as unknown as Prisma.InputJsonValue,
        ocrConfidence: ocr.ocrConfidence
      },
    });

    const markedText = buildMarkedOcrText(ocr.pages);
    const result = await gradeAnswerSheet({
      ocrText: markedText,
      subject: params.subjectName,
      level: params.level,
      courseworkType: params.courseworkType,
      programme: params.programme,
    });

    const lowConfidence = typeof ocr.ocrConfidence === 'number' && ocr.ocrConfidence < 0.75;
    const status = result.error || lowConfidence ? 'NEEDS_REVIEW' : 'EVALUATED';

    await prisma.aIGradingSubmission.update({
      where: { id: submissionId },
      data: { status, result: result as object, totalScore: result.totalScore, maxTotal: result.maxTotal },
    });
  } catch (err) {
    await prisma.aIGradingSubmission.update({
      where: { id: submissionId },
      data: { status: 'FAILED', errorMessage: (err as Error).message },
    });
  }
}

/** Re-runs OCR + grading on a submission that failed, reusing the already-uploaded file -
 *  no re-upload needed. */
export async function retryGrading(submissionId: string): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing.' };

  const submission = await prisma.aIGradingSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || !c.teacher.classes.some(k => k.id === submission.classroomId)) {
    return { error: 'That submission is not in one of your classes.' };
  }

  let resp: Response;
  try {
    resp = await fetch(submission.fileUrl);
  } catch (err) {
    return { error: `Could not re-fetch the stored file: ${(err as Error).message}` };
  }
  if (!resp.ok) return { error: `Could not re-fetch the stored file (status ${resp.status}).` };
  const buffer = Buffer.from(await resp.arrayBuffer());

  await prisma.aIGradingSubmission.update({ where: { id: submissionId }, data: { status: 'OCR_PROCESSING', errorMessage: null } });
  await runGrading(submissionId, buffer, {
    subjectName: submission.subjectName,
    level: '',
    courseworkType: submission.courseworkType as CourseworkType,
    programme: submission.programme as IBProgramme,
  });

  revalidatePath('/teacher/grading/ai-grader');
  return { success: 'Re-grading complete.' };
}

/** Removes a submission from the queue entirely. Safe to do at any status - the Prisma
 *  relation to AssessmentResult is SetNull, so a published grade already sitting in the
 *  gradebook is untouched; only the AI grader's own row (file reference, OCR text, etc.)
 *  goes away. */
export async function deleteSubmission(submissionId: string): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing.' };

  const submission = await prisma.aIGradingSubmission.findUnique({ where: { id: submissionId }, select: { classroomId: true } });
  if (!submission || !c.teacher.classes.some(k => k.id === submission.classroomId)) return { error: 'Not one of your classes.' };

  await prisma.aIGradingSubmission.delete({ where: { id: submissionId } });
  revalidatePath('/teacher/grading/ai-grader');
  return { success: 'Deleted.' };
}

export async function setTeacherOverrideScore(submissionId: string, score: number | null): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing.' };
  const submission = await prisma.aIGradingSubmission.findUnique({ where: { id: submissionId }, select: { classroomId: true } });
  if (!submission || !c.teacher.classes.some(k => k.id === submission.classroomId)) return { error: 'Not one of your classes.' };

  await prisma.aIGradingSubmission.update({
    where: { id: submissionId },
    data: { teacherOverrideScore: score, teacherOverrideQuestionScores: score === null ? undefined : Prisma.JsonNull },
  });
  revalidatePath('/teacher/grading/ai-grader');
  return { success: score === null ? 'Override cleared.' : 'Score overridden.' };
}

export async function setTeacherOverrideQuestionScore(
  submissionId: string,
  questionNumber: number,
  score: number | null
): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing.' };
  const submission = await prisma.aIGradingSubmission.findUnique({
    where: { id: submissionId },
    select: { classroomId: true, teacherOverrideQuestionScores: true },
  });
  if (!submission || !c.teacher.classes.some(k => k.id === submission.classroomId)) return { error: 'Not one of your classes.' };

  const current = (submission.teacherOverrideQuestionScores as Record<string, number> | null) ?? {};
  const next = { ...current };
  if (score === null) delete next[questionNumber];
  else next[questionNumber] = score;

  await prisma.aIGradingSubmission.update({
    where: { id: submissionId },
    data: {
      teacherOverrideQuestionScores: Object.keys(next).length ? next : Prisma.JsonNull,
      teacherOverrideScore: Object.keys(next).length ? null : undefined,
    },
  });
  revalidatePath('/teacher/grading/ai-grader');
  return { success: 'Saved.' };
}

export async function setTeacherFeedback(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing.' };
  const submissionId = String(formData.get('submissionId') ?? '');
  const feedback = String(formData.get('teacherFeedback') ?? '');

  const submission = await prisma.aIGradingSubmission.findUnique({ where: { id: submissionId }, select: { classroomId: true } });
  if (!submission || !c.teacher.classes.some(k => k.id === submission.classroomId)) return { error: 'Not one of your classes.' };

  await prisma.aIGradingSubmission.update({ where: { id: submissionId }, data: { teacherFeedback: feedback } });
  revalidatePath('/teacher/grading/ai-grader');
  return { success: 'Feedback saved.' };
}

/**
 * Publish a reviewed AI grading submission to the family-facing gradebook.
 *
 * The final IB 1-7 grade is entered by the teacher here, not auto-computed
 * from a percentage — real IB grade boundaries are set per subject/session
 * and are not a fixed formula, and AssessmentResult.grade has no field for
 * "raw score" to fall back on, only a required 1-7 Int. This is the same
 * thing a teacher already does in the manual gradebook; the AI grader gets
 * them to an informed number faster, it does not invent the number itself.
 */
export async function publishResult(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: 'Your staff record is missing.' };

  const submissionId = String(formData.get('submissionId') ?? '');
  const gradeRaw = String(formData.get('grade') ?? '').trim();
  const type = String(formData.get('type') ?? 'SUMMATIVE');
  const comment = String(formData.get('comment') ?? '').trim();

  const submission = await prisma.aIGradingSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || !c.teacher.classes.some(k => k.id === submission.classroomId)) return { error: 'Not one of your classes.' };
  if (!['EVALUATED', 'NEEDS_REVIEW'].includes(submission.status)) return { error: 'This submission is not ready to publish.' };

  const grade = Number(gradeRaw);
  if (!Number.isInteger(grade) || grade < 1 || grade > 7) return { error: `IB grades run 1 to 7 — "${gradeRaw}" is not one.` };
  if (!['FORMATIVE', 'SUMMATIVE', 'MOCK', 'IA_DRAFT', 'ORAL'].includes(type)) return { error: 'Choose an assessment type.' };

  const student = await prisma.student.findUnique({
    where: { id: submission.studentId },
    select: { id: true, name: true, userId: true, parent: { select: { userId: true } } },
  });
  if (!student) return { error: 'That student could not be found.' };

  const existing = await prisma.assessmentResult.findFirst({
    where: { studentId: student.id, title: submission.title, term: submission.term },
    select: { id: true },
  });

  const date = new Date();
  const assessmentResult = existing
    ? await prisma.assessmentResult.update({
        where: { id: existing.id },
        data: { grade, comment, subjectName: submission.subjectName, type, date },
      })
    : await prisma.assessmentResult.create({
        data: {
          studentId: student.id,
          subjectName: submission.subjectName,
          title: submission.title,
          type,
          date,
          grade,
          maxGrade: 7,
          comment,
          term: submission.term,
        },
      });

  await prisma.aIGradingSubmission.update({
    where: { id: submissionId },
    data: { status: 'PUBLISHED', assessmentResultId: assessmentResult.id, teacherFeedback: comment },
  });

  const rows: { userId: string; title: string; message: string; type: string }[] = [];
  const message = `${submission.title} (${submission.term}): ${grade}/7.${comment ? ` ${comment}` : ''}`;
  if (student.userId) rows.push({ userId: student.userId, title: 'New grade published', message, type: 'INFO' });
  if (student.parent?.userId) {
    rows.push({ userId: student.parent.userId, title: `${student.name}: new grade published`, message, type: 'INFO' });
  }
  if (rows.length) await prisma.notification.createMany({ data: rows });

  revalidatePath('/teacher/grading/ai-grader');
  revalidatePath('/teacher/grading');
  revalidatePath('/teacher/reports');
  revalidatePath('/student/grades');

  return {
    success: `Published — grade ${grade}/7 saved` + (rows.length ? ` and ${rows.length} notification${rows.length === 1 ? '' : 's'} sent.` : '.'),
  };
}
