import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { ShieldAlert, ThumbsUp, ThumbsDown, User, Calendar } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function BehaviorPage() {
  const incidents = await prisma.behaviorIncident.findMany({
    include: { student: true, teacher: { include: { user: true } } },
    orderBy: { date: "desc" },
    take: 20
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Behavior & Disciplinary" 
        subtitle="Manage merits, demerits, and student conduct."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-semantic-success dark:border-l-green-500">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-semantic-success dark:text-green-400">
            <ThumbsUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Merits (This Month)</p>
            <h3 className="text-2xl font-bold text-navy-900 dark:text-white">1,245</h3>
          </div>
        </div>
        
        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-semantic-error dark:border-l-red-500">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-semantic-error dark:text-red-400">
            <ThumbsDown size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Demerits</p>
            <h3 className="text-2xl font-bold text-navy-900 dark:text-white">82</h3>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-semantic-warning dark:border-l-yellow-500">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-semantic-warning dark:text-yellow-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Active Detentions</p>
            <h3 className="text-2xl font-bold text-navy-900 dark:text-white">14</h3>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Recent Incidents</h2>
          <Modal title="Log Behavior Incident" buttonText="Log Incident">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student</label>
                <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500">
                  <option>Select a student...</option>
                  <option>Rahul Patel (Grade 10)</option>
                  <option>Emma Thompson (Grade 11)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <option>Merit (Positive)</option>
                    <option>Demerit (Negative)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Points</label>
                  <input type="number" defaultValue="5" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea rows={3} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="Describe the incident..."></textarea>
              </div>
            </div>
          </Modal>
        </div>
        
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Reported By</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border dark:divide-slate-800">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No recent incidents logged.
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-navy-900 dark:text-slate-200">
                      {incident.student.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${incident.type === "MERIT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {incident.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{incident.category}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{incident.description}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{incident.teacher.user.name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{incident.date.toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
