import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Users, Plus } from "lucide-react";

export default async function AdminClubsPage() {
  const session = await getSession();
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
    redirect("/");
  }

  const clubs = await prisma.club.findMany({
    include: { _count: { select: { members: true } }, teacher: { include: { user: true } } }
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Clubs & Activities"
          description="Manage extracurricular clubs, advisors, and memberships."
        />
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> New Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <div key={club.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users size={18} />
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                {club._count.members} members
              </span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{club.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{club.description}</p>
            <p className="text-xs text-slate-400">Advisor: {club.teacher?.user?.name || "Unassigned"}</p>
          </div>
        ))}
        {clubs.length === 0 && (
          <p className="text-sm text-slate-400 py-6 col-span-3 text-center">You haven&apos;t created any extracurricular activities yet.</p>
        )}
      </div>
    </div>
  );
}
