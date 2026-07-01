import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default async function ParentDisciplinePage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: true }
  });

  const studentIds = parent?.students.map(s => s.id) || [];

  const incidents = await prisma.behaviorIncident.findMany({
    where: { studentId: { in: studentIds } },
    include: { student: true },
    orderBy: { date: 'desc' }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Behavior & Discipline"
        description="Track your children's behavior records and incidents."
      />

      <div className="space-y-3">
        {incidents.map((incident) => (
          <div key={incident.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${incident.type === 'DEMERIT' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
              {incident.type === 'DEMERIT' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{incident.student.name}</p>
                <span className="text-xs text-slate-400">{new Date(incident.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">&quot;{incident.description}&quot;</p>
            </div>
          </div>
        ))}
        {incidents.length === 0 && (
          <p className="text-sm text-slate-400 py-12 text-center">No behavior incidents recorded.</p>
        )}
      </div>
    </div>
  );
}
