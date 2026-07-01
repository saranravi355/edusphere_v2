import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default async function StaffLeavePage() {
  const session = await getSession();
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
    redirect("/");
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    include: { teacher: { include: { user: true } } },
    orderBy: { appliedAt: 'desc' }
  });

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    "use server";
    await prisma.leaveRequest.update({ where: { id }, data: { status } });
    revalidatePath("/admin/staff/leave");
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Pending", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
    APPROVED: { label: "Approved", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
    REJECTED: { label: "Rejected", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Staff Leave Management"
        description="Review and approve teacher leave requests."
      />

      <div className="space-y-4">
        {leaveRequests.map((req) => {
          const config = statusConfig[req.status] || statusConfig.PENDING;
          return (
            <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{req.teacher.user.name}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-4">&quot;{req.reason}&quot;</p>

              {req.status === 'PENDING' && (
                <div className="flex gap-3">
                  <form action={async () => { "use server"; await updateStatus(req.id, 'APPROVED'); }}>
                    <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors">
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  </form>
                  <form action={async () => { "use server"; await updateStatus(req.id, 'REJECTED'); }}>
                    <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">
                      <XCircle size={12} /> Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {leaveRequests.length === 0 && (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
            <Clock size={32} />
            <p>No leave requests submitted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
