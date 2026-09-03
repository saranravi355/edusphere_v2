import PageHeader from '@/components/ui/PageHeader';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AIGraderClient from './AIGraderClient';
import type { SubmissionRow } from './types';
import type { GradingResult, OcrPage } from '@/lib/grading/types';
import { SUBJECTS } from '@/lib/grading/subjects';

export const dynamic = 'force-dynamic';

export default async function AIGraderPage({
  searchParams
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) redirect('/');

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { subjects: true, classes: { select: { id: true, name: true }, orderBy: { name: 'asc' } } }
  });

  if (!teacher || teacher.classes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <PageHeader title="AI Exam Grader" description="Upload scanned answer sheets for instant AI-assisted grading." />
        <p className="text-slate-500">You are not assigned to any classes yet.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const activeClass = teacher.classes.find(c => c.id === sp.classId) ?? teacher.classes[0];
  // Full IB subject list, not narrowed to this teacher's own Teacher.subjects record - a
  // teacher covering for a colleague, or grading a cross-subject exam, shouldn't be blocked
  // from picking the right subject just because their own staff profile lists fewer.
  const mySubjects = SUBJECTS;

  const students = await prisma.student.findMany({
    where: { classroomId: activeClass.id, isActive: true },
    select: { id: true, name: true, registrationNo: true },
    orderBy: { name: 'asc' }
  });

  const submissions = await prisma.aIGradingSubmission.findMany({
    where: { classroomId: activeClass.id },
    select: {
      id: true,
      studentId: true,
      subjectName: true,
      title: true,
      term: true,
      programme: true,
      status: true,
      errorMessage: true,
      totalScore: true,
      maxTotal: true,
      teacherOverrideScore: true,
      teacherOverrideQuestionScores: true,
      teacherFeedback: true,
      result: true,
      ocrText: true,
      ocrPages: true,
      ocrConfidence: true,
      fileUrl: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const studentsById = new Map(students.map(s => [s.id, s]));
  const rows: SubmissionRow[] = submissions.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    studentName: studentsById.get(s.studentId)?.name ?? 'Unknown student',
    registrationNo: studentsById.get(s.studentId)?.registrationNo ?? '',
    result: s.result as unknown as GradingResult,
    ocrPages: s.ocrPages as unknown as OcrPage[] | null,
    teacherOverrideQuestionScores: s.teacherOverrideQuestionScores as unknown as Record<number, number> | null
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <PageHeader title="AI Exam Grader" description="Upload scanned answer sheets for instant AI-assisted grading, then review and publish to families." />
      <AIGraderClient
        classes={teacher.classes}
        activeClassId={activeClass.id}
        mySubjects={mySubjects}
        students={students}
        submissions={rows}
      />
    </div>
  );
}
