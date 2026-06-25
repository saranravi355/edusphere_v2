"use client";

import PageHeader from "@/components/ui/PageHeader";
import { Plane, Calendar, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { useState } from "react";

export default function TeacherLeaveManagement() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Leave Management" 
        description="Request time off and track your leave balances."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balances */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Casual Leave (CL)</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">12 <span className="text-sm font-normal text-slate-500">/ 15</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 flex items-center justify-center">
              <Calendar size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Sick Leave (SL)</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">8 <span className="text-sm font-normal text-slate-500">/ 10</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Earned Leave (EL)</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">4 <span className="text-sm font-normal text-slate-500">/ 5</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
              <Plane size={24} />
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            New Request
          </h3>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Request Submitted</h4>
              <p className="text-sm text-slate-500 mt-1 mb-4">Your leave request has been sent to the Principal for approval.</p>
              <button onClick={() => setSubmitted(false)} className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Submit Another</button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                <select required className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black">
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
                  <input required type="date" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
                  <input required type="date" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                <textarea required rows={3} className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black" placeholder="Reason for leave..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Substitute Teacher (Optional)</label>
                <select className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black">
                  <option>Auto-assign</option>
                  <option>Mr. Rajesh Kumar</option>
                  <option>Mrs. Sindhu Sharma</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                Submit Request
              </button>
            </form>
          )}
        </div>

        {/* History */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Leave History</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Dates</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium">Substitute</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                  <td className="p-4 text-sm font-medium">Sick Leave</td>
                  <td className="p-4 text-sm text-slate-500">Oct 12 - Oct 13</td>
                  <td className="p-4 text-sm">2 Days</td>
                  <td className="p-4 text-sm text-slate-500">Auto-assigned</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-medium flex items-center gap-1 w-max">
                      <CheckCircle2 size={12}/> Approved
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                  <td className="p-4 text-sm font-medium">Casual Leave</td>
                  <td className="p-4 text-sm text-slate-500">Nov 5 - Nov 5</td>
                  <td className="p-4 text-sm">1 Day</td>
                  <td className="p-4 text-sm text-slate-500">Mr. Rajesh Kumar</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-xs font-medium flex items-center gap-1 w-max">
                      <Clock size={12}/> Pending
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                  <td className="p-4 text-sm font-medium">Earned Leave</td>
                  <td className="p-4 text-sm text-slate-500">Dec 20 - Dec 24</td>
                  <td className="p-4 text-sm">5 Days</td>
                  <td className="p-4 text-sm text-slate-500">-</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-medium flex items-center gap-1 w-max">
                      <XCircle size={12}/> Rejected
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
