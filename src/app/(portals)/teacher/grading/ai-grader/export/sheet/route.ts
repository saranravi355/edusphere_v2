import prisma from '@/lib/prisma';
import { guard, TEACHER_ROLES } from '@/lib/authz';
import { buildIndividualPdf, buildIndividualDocx } from '@/lib/grading/report';
import type { SubmissionRow } from '../../types';
import type { GradingResult } from '@/lib/grading/types';

export const dynamic = 'force-dynamic';

/** Downloads one student's full graded sheet (score, AI rationale, general feedback, every
 *  question's breakdown) as PDF or DOCX. Query params: submissionId, format ("pdf" | "docx"). */
export async function GET(request: Request) {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return new Response(auth.error, { status: 403 });

  const url = new URL(request.url);
  const submissionId = url.searchParams.get('submissionId') ?? '';
  const format = url.searchParams.get('format') === 'docx' ? 'docx' : 'pdf';

  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { classes: { select: { id: true } } }
  });
  if (!teacher) return new Response('Your staff record is missing.', { status: 403 });

  const s = await prisma.aIGradingSubmission.findUnique({ where: { id: submissionId } });
  if (!s || !teacher.classes.some(c => c.id === s.classroomId)) return new Response('Not one of your classes.', { status: 403 });

  const student = s.studentId ? await prisma.student.findUnique({ where: { id: s.studentId }, select: { name: true, registrationNo: true } }) : null;

  const row: SubmissionRow = {
    id: s.id,
    studentId: s.studentId,
    studentName: student?.name ?? 'Unassigned',
    registrationNo: student?.registrationNo ?? '',
    originalFileName: s.originalFileName,
    batchId: s.batchId,
    subjectName: s.subjectName,
    title: s.title,
    term: s.term,
    programme: s.programme,
    status: s.status,
    errorMessage: s.errorMessage,
    totalScore: s.totalScore,
    maxTotal: s.maxTotal,
    teacherOverrideScore: s.teacherOverrideScore,
    teacherOverrideQuestionScores: s.teacherOverrideQuestionScores as unknown as Record<number, number> | null,
    teacherFeedback: s.teacherFeedback,
    result: s.result as unknown as GradingResult,
    ocrText: s.ocrText,
    ocrPages: null,
    ocrConfidence: s.ocrConfidence,
    fileUrl: s.fileUrl,
    createdAt: s.createdAt.toISOString()
  };

  const safeName = `${row.studentName}-${row.title}`.replace(/[^a-z0-9\-_]+/gi, '_');

  if (format === 'docx') {
    const buffer = await buildIndividualDocx(row);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'content-disposition': `attachment; filename="${safeName}.docx"`
      }
    });
  }

  const bytes = await buildIndividualPdf(row);
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${safeName}.pdf"`
    }
  });
}
