"use client";

import PageHeader from "@/components/ui/PageHeader";
import { ShieldAlert, ThumbsUp, ThumbsDown, Search, Send, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function TeacherDisciplineEngine() {
  const [selectedStudent, setSelectedStudent] = useState<string>("Ananya Iyer");
  const [incidentType, setIncidentType] = useState<"positive" | "negative">("negative");

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Behavioral Disciplinary Engine" 
        description="Log student incidents, award behavior points, and trigger parent alerts."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Logger */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-purple-500" />
              Log New Incident
            </h3>
            
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input type="text" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full pl-10 p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-slate-100" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Incident Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIncidentType("positive")} className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${incidentType === 'positive' ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <ThumbsUp size={16} /> Positive
                  </button>
                  <button type="button" onClick={() => setIncidentType("negative")} className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${incidentType === 'negative' ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <ThumbsDown size={16} /> Negative
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Behavior Category</label>
                <select className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black">
                  {incidentType === 'positive' ? (
                    <>
                      <option>Outstanding Leadership (+5 pts)</option>
                      <option>Helping a Peer (+3 pts)</option>
                      <option>Exceptional Project Work (+5 pts)</option>
                    </>
                  ) : (
                    <>
                      <option>Disrupting Class (-3 pts)</option>
                      <option>Bullying / Harassment (-10 pts)</option>
                      <option>Academic Dishonesty (-15 pts)</option>
                      <option>Unexcused Absence (-5 pts)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Notes</label>
                <textarea rows={3} className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black" placeholder="Describe the incident..."></textarea>
                <p className="text-xs text-slate-400 mt-1">This note will be analyzed by our ML Sentiment Engine.</p>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Send size={18} /> Submit Log & Alert Parent
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 flex gap-4">
            <div className="mt-1"><AlertTriangle className="text-red-500" size={24}/></div>
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-400">Critical Action Required</h3>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1 mb-3">Aarav Patel has fallen below the -20 behavior point threshold. The system has automatically placed them on a 1-week suspension warning.</p>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors">
                View Escalation Protocol
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert size={18} className="text-slate-500" />
                Recent Behavior Logs
              </h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Incident</th>
                    <th className="p-4 font-medium">Points</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">Ananya Iyer</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">Outstanding Leadership</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-bold">
                        +5 pts
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">Today, 10:45 AM</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">Aarav Patel</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">Disrupting Class</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-bold">
                        -3 pts
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">Yesterday, 1:15 PM</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">Arjun Nair</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">Academic Dishonesty</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-bold">
                        -15 pts
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">Oct 12, 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
