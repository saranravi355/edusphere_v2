import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plane, ArrowRight, Users, ClipboardCheck } from "lucide-react";

export default async function StaffHubPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  const [teacherCount, pendingLeave] = await Promise.all([
    prisma.teacher.count(),
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
  ]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Staff"
        description="Manage teaching staff and leave requests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{teacherCount}</p>
            <p className="text-xs text-slate-500">Teachers on staff</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
            <Plane size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{pendingLeave}</p>
            <p className="text-xs text-slate-500">Pending leave requests</p>
          </div>
        </div>
      </div>

      <Link href="/admin/staff/leave" className="group block">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Leave Management</h3>
            <p className="text-sm text-slate-500 mt-1">Review and approve or reject staff leave requests.</p>
          </div>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Open <ArrowRight size={14} />
          </span>
        </div>
      </Link>

      <Link href="/admin/staff/appraisal" className="group block">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">PD & Appraisal</h3>
              <p className="text-sm text-slate-500 mt-1">Track CPD hours and run IB-scale classroom observations.</p>
            </div>
          </div>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Open <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </div>
  );
}
