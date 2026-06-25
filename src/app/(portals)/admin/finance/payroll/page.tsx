"use client";

import PageHeader from "@/components/ui/PageHeader";
import { DollarSign, FileDown, CheckCircle2, AlertCircle, PlayCircle, Plane } from "lucide-react";
import { useState } from "react";

export default function AutomatedPayroll() {
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);

  const runPayroll = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setComplete(true);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Automated Staff Payroll" 
        description="Run monthly payroll batches. Automatically syncs with Leave Management."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <PlayCircle size={18} className="text-emerald-500" />
              Batch Execution
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payroll Cycle</label>
                <select className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-700 dark:text-slate-300 font-medium">
                  <option>November 2026</option>
                  <option>October 2026</option>
                </select>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl flex gap-3">
                <Plane className="text-blue-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-blue-800 dark:text-blue-300">Syncing with Leave Module to calculate Unpaid Time Off (UTO) deductions.</p>
              </div>
            </div>

            {!complete ? (
              <button 
                onClick={runPayroll}
                disabled={running}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 disabled:opacity-50 text-white dark:text-slate-900 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md"
              >
                {running ? <><div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin"/> Processing...</> : "Run Payroll Batch"}
              </button>
            ) : (
              <button className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md">
                <CheckCircle2 size={18} /> Disburse Funds
              </button>
            )}
          </div>

          {complete && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4">
              <p className="text-emerald-100 font-medium text-sm">Total Disbursable</p>
              <h3 className="text-4xl font-bold mt-1">₹2,45,600</h3>
              <p className="text-xs text-emerald-200 mt-2">Across 85 Staff Members</p>
            </div>
          )}
        </div>

        {/* Ledger */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <DollarSign size={18} className="text-slate-500" />
              Salary Ledger (Nov 2026)
            </h3>
            {complete && (
              <button className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <FileDown size={16}/> Export CSV
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto">
            {complete ? (
              <table className="w-full text-left animate-in fade-in duration-500">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                    <th className="p-4 font-medium">Staff Member</th>
                    <th className="p-4 font-medium">Base Salary</th>
                    <th className="p-4 font-medium">Deductions (Leaves)</th>
                    <th className="p-4 font-medium">Net Pay</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Meena Krishnan</p>
                      <p className="text-xs text-slate-500">Principal</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">₹8,500.00</td>
                    <td className="p-4 text-sm text-slate-500">₹0.00 <span className="text-xs ml-1">(0 Unpaid Days)</span></td>
                    <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">₹8,500.00</td>
                    <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-xs font-bold w-max inline-block">Drafted</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 bg-red-50/50 dark:bg-red-900/10">
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Rajesh Kumar</p>
                      <p className="text-xs text-slate-500">Teacher</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">₹4,200.00</td>
                    <td className="p-4 text-sm font-bold text-red-600 dark:text-red-500">-₹280.00 <span className="text-xs font-normal text-slate-500 ml-1">(2 Unpaid Days)</span></td>
                    <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">₹3,920.00</td>
                    <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-xs font-bold w-max inline-block">Drafted</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Sindhu Sharma</p>
                      <p className="text-xs text-slate-500">Teacher</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">₹4,500.00</td>
                    <td className="p-4 text-sm text-slate-500">₹0.00 <span className="text-xs ml-1">(Earned Leave Used)</span></td>
                    <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">₹4,500.00</td>
                    <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-xs font-bold w-max inline-block">Drafted</span></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400">
                <DollarSign size={64} className="mb-4 opacity-20" />
                <p className="font-medium text-slate-600 dark:text-slate-300">Ledger Empty</p>
                <p className="text-sm max-w-xs text-center mt-2">Run the Payroll Batch to generate the monthly salary ledger.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
