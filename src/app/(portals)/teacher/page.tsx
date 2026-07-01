import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, GraduationCap } from "lucide-react";

async function markAttendance(studentId: string, status: string, recordedBy: string) {
  "use server";
  await prisma.attendance.create({
    data: { studentId, status, date: new Date(), recordedBy }
  });
  revalidatePath("/teacher");
}

async function assignGrade(studentId: string, formData: FormData) {
  "use server";
  const score = formData.get("score") as string;
  revalidatePath("/teacher");
}

async function bulkMarkPresent(studentIds: string[], recordedBy: string) {
  "use server";
  await prisma.attendance.createMany({
    data: studentIds.map(id => ({ studentId: id, status: 'PRESENT', date: new Date(), recordedBy }))
  });
  revalidatePath("/teacher");
}

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session || (session.user.role !== 'CLASS_TEACHER' && session.user.role !== 'SUBJECT_TEACHER')) {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: { include: { students: true } } }
  });

  const myClass = teacher?.classes[0];
  const students = myClass?.students || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Welcome back, ${session.user.name?.split(' ')[0] || 'Teacher'}`}
        description="Manage your class roster, grading, and attendance."
      />

      <SchoolSnapshot />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{student.name}</td>
                    <td className="py-3 px-4 text-center">
                      <form action={async () => { "use server"; await markAttendance(student.id, 'PRESENT', session.user.id); }}>
                        <button type="submit" className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-md">
                          <CheckCircle2 size={12} /> Present
                        </button>
                      </form>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <form action={async (fd) => { "use server"; await assignGrade(student.id, fd); }} className="flex items-center justify-center gap-2">
                        <input name="score" type="number" placeholder="Score" className="w-16 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs dark:bg-slate-800" />
                        <button type="submit" className="text-xs font-bold text-blue-600 hover:underline">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400">No students assigned to your class.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
