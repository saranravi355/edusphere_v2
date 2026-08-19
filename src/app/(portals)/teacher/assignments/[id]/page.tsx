import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, FileText, Paperclip, Users } from "lucide-react";
import { formatDate } from "@/lib/dates";
import GradeForm from "./GradeForm";

export const dynamic = "force-dynamic";

export default async function AssignmentSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!teacher) redirect("/");

  const homework = await prisma.homework.findUnique({
    where: { id },
    include: {
      classroom: { include: { students: { orderBy: { name: "asc" }, select: { id: true, name: true } } } },
      subject: true,
      submissions: { include: { student: { select: { id: true, name: true } } } },
    },
  });

  if (!homework) notFound();
  // A teacher must not read another teacher's submissions by guessing an id.
  if (homework.teacherId !== teacher.id) redirect("/teacher/assignments");

  const byStudent = new Map(homework.submissions.map((s) => [s.studentId, s]));
  const roster = homework.classroom.students;
  const submittedCount = roster.filter((s) => byStudent.has(s.id)).length;
  const gradedCount = homework.submissions.filter((s) => s.grade !== null).length;
  const overdue = homework.dueDate < new Date();

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <Link href="/teacher/assignments" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} aria-hidden /> Back to assignments
      </Link>

      <PageHeader
        title={homework.title}
        description={`${homework.subject.name} · Class ${homework.classroom.name} · due ${formatDate(homework.dueDate, "dMonYyyy")}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Submitted", value: `${submittedCount} / ${roster.length}`, icon: Users },
          { label: "Graded", value: `${gradedCount} / ${submittedCount}`, icon: FileText },
          { label: "Status", value: overdue ? "Closed" : "Open", icon: Clock },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
          {roster.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">This class has no students yet.</p>
          )}
          {roster.map((student) => {
            const sub = byStudent.get(student.id);
            return (
              <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                <div className="sm:w-48 shrink-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{student.name}</p>
                  {sub ? (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted {formatDate(sub.submittedAt, "dMonYyyy")}
                      {sub.submittedAt > homework.dueDate && <span className="text-amber-600 dark:text-amber-400"> · late</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">Not submitted</p>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {sub ? (
                    <>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{sub.content}</p>
                      {sub.attachmentUrl && (
                        <a href={sub.attachmentUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-2">
                          <Paperclip size={12} aria-hidden /> Attached link
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nothing submitted yet.</p>
                  )}
                </div>

                <div className="shrink-0">
                  {sub ? <GradeForm submissionId={sub.id} current={sub.grade} />
                       : <span className="text-xs text-slate-400">—</span>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
