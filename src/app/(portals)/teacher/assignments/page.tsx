import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, CheckCircle2, Clock, BookOpen } from "lucide-react";
import Link from "next/link";



export default async function TeacherAssignmentsPage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      homeworks: {
        include: {
          classroom: true,
          subject: true,
          submissions: true
        },
        orderBy: { dueDate: 'asc' }
      },
      classes: {
        include: { students: true }
      }
    }
  });

  if (!teacher) return null;

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader 
        title="Assignment Library" 
        description="Manage homework and track submissions across your classes."
        action={
          <Modal title="Create Assignment" buttonText="Create Assignment" buttonIcon={<Plus size={16} />}>
            <div className="space-y-4 text-left">
              <input type="text" placeholder="Assignment Title" className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                  <select className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 text-sm">
                    <option>10A</option>
                    <option>10B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input type="date" className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 text-sm" />
                </div>
              </div>
              <textarea placeholder="Description..." className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 text-sm h-20 resize-none"></textarea>
            </div>
          </Modal>
        }
      />


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teacher.homeworks.length > 0 ? teacher.homeworks.map(hw => {
          // Find total students in this class
          const totalStudents = teacher.classes.find(c => c.id === hw.classroomId)?.students.length || 0;
          const submittedCount = hw.submissions.length;
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
                      <Clock size={12} /> Due {new Date(hw.dueDate).toLocaleDateString('en-GB')}
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
                  <button className="flex-1 text-center py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 text-center py-1.5 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-md transition-colors">
                    Grade
                  </button>
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
