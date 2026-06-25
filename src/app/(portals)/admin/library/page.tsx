"use client";

import PageHeader from "@/components/ui/PageHeader";
import { Book, ScanLine, Clock, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function LibraryManagement() {
  const [scanning, setScanning] = useState(false);
  const [scannedBook, setScannedBook] = useState<string | null>(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedBook("The Principia Mathematica (ID: LIB-1049)");
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Library System" 
        description="Checkout books, process returns, and manage late fees."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Checkout / Scan Module */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <ScanLine size={18} className="text-blue-500" />
              Quick Checkout
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student ID / Registration No.</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input type="text" className="w-full pl-10 p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-slate-100" placeholder="e.g. STU-26-101" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Book Barcode / ID</label>
                <div className="relative flex gap-2">
                  <input type="text" value={scannedBook || ""} readOnly className="flex-1 p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-slate-100" placeholder="Scan barcode..." />
                  <button onClick={handleScan} className="px-4 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center transition-colors">
                    <ScanLine size={20} className={scanning ? "animate-pulse text-blue-500" : ""} />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button disabled={!scannedBook} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                  Checkout Book
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-sm flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertCircle size={32} />
            </div>
            <div>
              <p className="text-orange-100 font-medium text-sm">Active Late Fees</p>
              <h3 className="text-3xl font-bold">₹125.00</h3>
              <p className="text-xs text-orange-200 mt-1">Across 8 students. Auto-added to invoices.</p>
            </div>
          </div>
        </div>

        {/* Current Checkouts */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Book size={18} className="text-purple-500" />
              Current Checkouts
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2 text-slate-400" size={14} />
              <input type="text" className="pl-8 p-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black w-48" placeholder="Search books/students..." />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                  <th className="p-4 font-medium">Book</th>
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium">Due Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                  <td className="p-4">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Harry Potter (Vol 1)</p>
                    <p className="text-xs text-slate-500">LIB-8021</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">Aarav Patel (STU-26-101)</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">Nov 12, 2026</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-medium">
                      Active
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Return</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 bg-red-50/50 dark:bg-red-900/10">
                  <td className="p-4">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Advanced Calculus</p>
                    <p className="text-xs text-slate-500">LIB-3055</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">Ananya Iyer (STU-26-102)</td>
                  <td className="p-4 text-sm font-bold text-red-600 dark:text-red-400">Oct 28, 2026</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-medium flex items-center gap-1 w-max">
                      <AlertCircle size={12}/> Overdue (₹15)
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Return</button>
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
