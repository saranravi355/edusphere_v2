import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { Search, GraduationCap, BrainCircuit, ExternalLink, Activity } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClassSwitcher from "@/components/teacher/ClassSwitcher";

export default async function TeacherStudentsDirectory({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classId?: string }>;
}) {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const currentClassId = resolvedParams.classId || "8A";
  const isClassTeacher = currentClassId === "8A";

  const displayStudents = await prisma.student.findMany({
    where: {
      classroom: {
        name: currentClassId
      },
      OR: query ? [
        { name: { contains: query } },
        { registrationNo: { contains: query } }
      ] : undefined
    },
    orderBy: { name: 'asc' },
    take: 50
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <ClassSwitcher isClassTeacher={isClassTeacher} />

      <PageHeader
        title={`Student Directory - Class ${currentClassId}`}
        description="Search your students to view profiles, grades, and AI insights."
      />

      {/* Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <form className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by student name or registration number..."
            className="w-full bg-transparent border-none focus:outline-none text-slate-900 dark:text-white"
          />
        </form>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Search
        </button>
      </div>

      {/* Student List Grid */}
      {displayStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayStudents.map((student) => (
            <div key={student.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 flex items-center justify-center font-bold text-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{student.name}</h3>
                    <p className="text-xs text-slate-500">{student.registrationNo}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium">
                  {student.curriculum}
                </span>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{student.gender || "Not specified"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Blood Group</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{student.bloodGroup || "Unknown"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">DOB</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {student.dateOfBirth ? student.dateOfBirth.toLocaleDateString('en-GB') : "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <Link href={`/teacher/students/${student.id}/ai-analysis`} className="flex-1">
                  <button className="w-full py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    <BrainCircuit size={16} />
                    AI Insights
                  </button>
                </Link>
                <Link href={`/teacher/students/${student.id}`} className="flex-1">
                  <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    <Activity size={16} />
                    Full Profile
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <GraduationCap size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No students found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your search query.</p>
        </div>
      )}
    </div>
  );
}
