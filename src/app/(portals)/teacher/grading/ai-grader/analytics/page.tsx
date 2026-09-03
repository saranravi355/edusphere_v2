import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';
import type { AnalyticsSubmission } from '@/lib/grading/analytics';
import type { GradingResult } from '@/lib/grading/types';

export const dynamic = 'force-dynamic';

export default async function ClassAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) redirect('/');

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { classes: { select: { id: true, name: true }, orderBy: { name: 'asc' } } }
  });

  if (!teacher || teacher.classes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <PageHeader title="Class Analytics" description="Aggregate performance across every AI-graded answer sheet." />
        <p className="text-slate-500">You are not assigned to any classes yet.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const activeClass = teacher.classes.find(c => c.id === sp.classId) ?? teacher.classes[0];

  const [students, submissions] = await Promise.all([
    prisma.student.count({ where: { classroomId: activeClass.id, isActive: true } }),
    prisma.aIGradingSubmission.findMany({
      where: { classroomId: activeClass.id },
      select: {
        studentId: true,
        status: true,
        totalScore: true,
        maxTotal: true,
        teacherOverrideScore: true,
        teacherOverrideQuestionScores: true,
        result: true,
        student: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const rows: AnalyticsSubmission[] = submissions.map(s => ({
    studentId: s.studentId,
    studentName: s.student.name,
    status: s.status,
    totalScore: s.totalScore,
    maxTotal: s.maxTotal,
    teacherOverrideScore: s.teacherOverrideScore,
    teacherOverrideQuestionScores: s.teacherOverrideQuestionScores as unknown as Record<number, number> | null,
    result: s.result as unknown as GradingResult
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Class Analytics"
        description={`Aggregate performance across ${activeClass.name}'s AI-graded answer sheets.`}
        action={
          <Link
            href={`/teacher/grading/ai-grader?classId=${activeClass.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200"
          >
            <ArrowLeft size={14} aria-hidden /> Back to grader
          </Link>
        }
      />
      <AnalyticsClient
        classes={teacher.classes}
        activeClassId={activeClass.id}
        submissions={rows}
        totalStudents={students}
      />
    </div>
  );
}
