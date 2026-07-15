import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ArrowLeft, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect("/");
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true, classroom: true }
  });

  if (!student) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      <PageHeader
        title={student.name || "Student Profile"}
        description={`Grade ${student.classroom?.gradeLevel ?? "—"} • ${student.classroom?.name || "Unassigned"}`}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserIcon size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{student.name}</h3>
            <p className="text-sm text-slate-500">{student.registrationNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Date of Birth</p>
            <p className="text-slate-700 dark:text-slate-300">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Grade Level</p>
            <p className="text-slate-700 dark:text-slate-300">{student.classroom?.gradeLevel ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Father&apos;s Name</p>
            <p className="text-slate-700 dark:text-slate-300">{student.fatherName || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Mother&apos;s Name</p>
            <p className="text-slate-700 dark:text-slate-300">{student.motherName || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Mother&apos;s Occupation</p>
            <p className="text-slate-700 dark:text-slate-300">{student.motherOccupation || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Address</p>
            <p className="text-slate-700 dark:text-slate-300">{student.address || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
