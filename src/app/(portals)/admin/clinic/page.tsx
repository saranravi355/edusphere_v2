import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { Activity, Thermometer, Pill, UserPlus } from "lucide-react";

export default async function ClinicPage() {
  const visits = await prisma.clinicVisit.findMany({
    include: { student: true },
    orderBy: { date: "desc" },
    take: 20
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Health & Clinic" 
        description="School nurse digital logbook and medical records."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col">
          <Activity className="text-red-500 mb-2" size={24} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">{visits.length}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Visits</p>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <Thermometer className="text-orange-500 mb-2" size={24} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">Fever</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Most Common Reason</p>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <Pill className="text-blue-500 mb-2" size={24} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">12</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Medications Administered</p>
        </div>
        <Modal title="Log Clinic Visit" buttonText="Log New Visit" buttonIcon={<UserPlus size={20} />}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student</label>
              <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <option>Search student...</option>
                <option>Aarav Sharma (Grade 8)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason / Symptoms</label>
              <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. Headache, Fever" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Treatment Administered</label>
              <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. Paracetamol, Ice Pack" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Additional Notes</label>
              <textarea rows={3} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="Optional notes..."></textarea>
            </div>
          </div>
        </Modal>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Recent Clinic Log</h2>
        </div>
        
        <div className="overflow-x-auto"><table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-ui-border dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Reason for Visit</th>
              <th className="px-6 py-4">Treatment</th>
              <th className="px-6 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border dark:divide-slate-800">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No clinic visits logged yet.</td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{visit.date.toLocaleString('en-GB')}</td>
                  <td className="px-6 py-4 font-bold text-navy-900 dark:text-slate-200">{visit.student.name}</td>
                  <td className="px-6 py-4 text-red-600 dark:text-red-400 font-medium">{visit.reason}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{visit.treatment}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic text-xs">{visit.notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
