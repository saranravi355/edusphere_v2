import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { getSession } from "@/lib/session";
import { HelpCircle, Plus, CheckCircle2, Clock } from "lucide-react";

export default async function QuizzesPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Online Assessments" 
        description="Create and manage interactive quizzes for your classes."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <HelpCircle className="text-blue-600 dark:text-blue-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">12</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Quizzes</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <CheckCircle2 className="text-green-600 dark:text-green-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">85%</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg Completion Rate</p>
        </div>
        <div className="glass-card flex items-center justify-center bg-primary-600 border-none shadow-lg shadow-primary-600/30">
          <Modal title="Create New Quiz" buttonText="Create Quiz" buttonIcon={<Plus size={24} />}>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quiz Title</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" placeholder="e.g. Chapter 4: Photosynthesis" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <option>10A - Biology</option>
                    <option>10B - Biology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time Limit (Mins)</label>
                  <input type="number" defaultValue="30" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Questions</label>
                <input type="number" defaultValue="10" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
              </div>
            </div>
          </Modal>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Active Quizzes</h2>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Quiz Title</th>
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Submissions</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">Cell Biology Midterm</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">10A - Biology</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Tomorrow, 11:59 PM</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">24 / 30</td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium cursor-pointer">View Results</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">Genetics Quiz 1</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">10B - Biology</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Oct 28, 2026</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">0 / 28</td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium cursor-pointer">Edit Quiz</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
