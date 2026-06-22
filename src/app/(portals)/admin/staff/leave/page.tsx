import PageHeader from "@/components/ui/PageHeader";
import { Users, CheckCircle2, XCircle, Clock, Plane } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLeaveManagement() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Staff Leave & Substitutes" 
        description="Review leave requests and assign substitute teachers."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pending Requests</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">4</h3>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Staff on Leave Today</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">2</h3>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Unassigned Substitutes</p>
          <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 mt-1">1</h3>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Substitutes Pool</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">12</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock size={18} className="text-orange-500" />
              Pending Leave Approvals
            </h3>
          </div>
          <div className="p-4 space-y-4">
            
            {/* Request 1 */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">DS</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">David Smith</h4>
                  <p className="text-xs text-slate-500">Class Teacher (Grade 10)</p>
                </div>
              </div>
              <div className="flex-1 px-4">
                <div className="flex gap-4 text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Casual Leave</span>
                  <span className="text-slate-500">Nov 5 (1 Day)</span>
                </div>
                <p className="text-xs text-slate-500 italic">"Family emergency, need to attend to personal matters."</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button className="flex-1 md:flex-none px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                  <XCircle size={16} /> Deny
                </button>
              </div>
            </div>

            {/* Request 2 */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">EC</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Emily Clark</h4>
                  <p className="text-xs text-slate-500">Subject Teacher (Physics)</p>
                </div>
              </div>
              <div className="flex-1 px-4">
                <div className="flex gap-4 text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Earned Leave</span>
                  <span className="text-slate-500">Dec 10 - Dec 14 (5 Days)</span>
                </div>
                <p className="text-xs text-slate-500 italic">"Attending an international physics seminar in Berlin."</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button className="flex-1 md:flex-none px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                  <XCircle size={16} /> Deny
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Substitute Assignment */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Substitute Needs
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
              <h4 className="font-bold text-sm text-red-800 dark:text-red-400">Math 101 - Tomorrow</h4>
              <p className="text-xs text-red-600 dark:text-red-500 mb-2">Original Teacher: Sarah Jenkins (Sick Leave)</p>
              <select className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm text-slate-700 dark:text-slate-300 mb-2">
                <option>Assign Substitute...</option>
                <option>David Smith (Free P1)</option>
                <option>Emily Clark (Free P1)</option>
              </select>
              <button className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">Confirm Assignment</button>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl">
              <h4 className="font-bold text-sm text-green-800 dark:text-green-400">Physics 202 - Wednesday</h4>
              <p className="text-xs text-green-600 dark:text-green-500 mb-2">Original Teacher: Mark Admin (Casual Leave)</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-xs font-bold text-green-800 dark:text-green-200">EC</div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Assigned: Emily Clark</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
