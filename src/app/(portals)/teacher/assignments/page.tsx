import PageHeader from "@/components/ui/PageHeader";
import AssignmentFormModal from "./AssignmentFormModal";
import DeleteAssignmentButton from "./DeleteAssignmentButton";
import { formatDate } from "@/lib/dates";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, CheckCircle2, Clock, BookOpen, FileEdit } from "lucide-react";
import Link from "next/link";
import AIFeatureLink from "@/components/ai/AIFeatureLink";



export default async function TeacherAssignmentsPage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      // Only the counts are rendered, so count in the database. Loading the
      // rows meant every submission and every student in every class came back
      // over the wire to have .length taken of them.
      homeworks: {
        include: {
          classroom: { select: { name: true } },
          subject: { select: { name: true } },
          _count: { select: { submissions: true } }
        },
        orderBy: { dueDate: 'asc' }
      },
      classes: {
        select: { id: true, name: true, _count: { select: { students: true } } }
      }
    }
  });

  if (!teacher) return null;

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const classOptions = teacher.classes.map((c) => ({ id: c.id, name: c.name }));
  const toDraft = (hw: (typeof teacher.homeworks)[number]) => ({
    id: hw.id,
    title: hw.title,
    description: hw.description,
    subjectId: hw.subjectId,
    classroomId: hw.classroomId,
    // <input type="date"> wants yyyy-mm-dd in the school's own timezone.
    dueDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(hw.dueDate),
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader 
        title="Assignment Library" 
        description="Manage homework and track submissions across your classes."
        action={
          <AssignmentFormModal classes={classOptions} subjects={subjects} />
        }
      />

      <AIFeatureLink
        href="/teacher/assignments/ai-feedback"
        icon={<FileEdit size={15} />}
        title="Smart Homework Feedback"
        description="Drafts criterion-referenced feedback for you to review and approve."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teacher.homeworks.length > 0 ? teacher.homeworks.map(hw => {
          // Find total students in this class
          const totalStudents = teacher.classes.find(c => c.id === hw.classroomId)?._count.students || 0;
          const submittedCount = hw._count.submissions;
          const isOverdue = new Date(hw.dueDate) < new Date();

          return (
            <Card key={hw.id} className="glass-card hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded text-xs font-semibold">
                    {hw.subject.name} • Class {hw.classroom.name}
                  </span>
                  {isOverdue ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                      <Clock size={12} /> Overdue
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                      <Clock size={12} /> Due {formatDate(hw.dueDate, "dMonYyyy")}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 transition-colors">
                  {hw.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {hw.description}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {submittedCount} / {totalStudents} Submitted
                    </span>
                  </div>
                  {submittedCount === totalStudents && totalStudents > 0 ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : null}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <AssignmentFormModal
                    classes={classOptions}
                    subjects={subjects}
                    assignment={toDraft(hw)}
                    trigger="Edit"
                  />
                  <Link
                    href={`/teacher/assignments/${hw.id}`}
                    className="flex-1 text-center py-1.5 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-md transition-colors"
                  >
                    {submittedCount > 0 ? `Grade (${submittedCount})` : "Submissions"}
                  </Link>
                  <DeleteAssignmentButton id={hw.id} title={hw.title} submissionCount={submittedCount} />
                </div>
              </CardContent>
            </Card>
          )
        }) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Assignments Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1">Create your first homework assignment to track submissions and grades.</p>
          </div>
        )}
      </div>
    </div>
  );
}
