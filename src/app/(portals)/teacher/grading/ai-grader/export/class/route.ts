import prisma from '@/lib/prisma';
import { guard, TEACHER_ROLES } from '@/lib/authz';
import { buildClassSummaryPdf, buildClassSummaryDocx } from '@/lib/grading/report';
import type { SubmissionRow } from '../../types';
import type { GradingResult } from '@/lib/grading/types';

export const dynamic = 'force-dynamic';

/** Downloads a combined class gradesheet (every graded/evaluated sheet for the class, one row
 *  per student, with score and AI rationale) as PDF or DOCX - the "just give me the marks"
 *  export for a bulk-uploaded assessment. Query params: classId, format ("pdf" | "docx"),
 *  optionally title (defaults to the most recent assessment title in the class). */
export async function GET(request: Request) {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return new Response(auth.error, { status: 403 });

  const url = new URL(request.url);
  const classId = url.searchParams.get('classId') ?? '';
  const format = url.searchParams.get('format') === 'docx' ? 'docx' : 'pdf';
  const titleFilter = url.searchParams.get('title');

  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { classes: { select: { id: true, name: true } } }
  });
  const activeClass = teacher?.classes.find(c => c.id === classId);
  if (!activeClass) return new Response('Not one of your classes.', { status: 403 });

  const students = await prisma.student.findMany({
    where: { classroomId: classId, isActive: true },
    select: { id: true, name: true, registrationNo: true }
  });
  const studentsById = new Map(students.map(s => [s.id, s]));

  const submissions = await prisma.aIGradingSubmission.findMany({
    where: {
      classroomId: classId,
      status: { in: ['EVALUATED', 'NEEDS_REVIEW', 'PUBLISHED'] },
      ...(titleFilter ? { title: titleFilter } : {})
    },
    orderBy: { createdAt: 'desc' }
  });
  if (submissions.length === 0) return new Response('No graded sheets to export yet.', { status: 404 });

  const assessmentTitle = titleFilter || submissions[0].title;

  const rows: SubmissionRow[] = submissions.map(s => ({
    id: s.id,
    studentId: s.studentId,
    studentName: (s.studentId && studentsById.get(s.studentId)?.name) ?? 'Unassigned',
    registrationNo: (s.studentId && studentsById.get(s.studentId)?.registrationNo) ?? '',
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
  }));

  const safeName = `${activeClass.name}-${assessmentTitle}`.replace(/[^a-z0-9\-_]+/gi, '_');

  if (format === 'docx') {
    const buffer = await buildClassSummaryDocx(activeClass.name, assessmentTitle, rows);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'content-disposition': `attachment; filename="${safeName}.docx"`
      }
    });
  }

  const bytes = await buildClassSummaryPdf(activeClass.name, assessmentTitle, rows);
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${safeName}.pdf"`
    }
  });
}
