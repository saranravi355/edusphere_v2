"use client";

import PageHeader from "@/components/ui/PageHeader";
import { BookOpen, Search, Save, CheckCircle2, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function TeacherGradingEngine() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Grading Engine" 
        description="Enter raw scores, calculate curves, and publish report cards."
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-4 items-center w-full md:w-auto">
          <select className="p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-medium text-slate-700 dark:text-slate-300">
            <option>Class 10-A (Science)</option>
            <option>Class 10-B (Science)</option>
          </select>
          <select className="p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-medium text-slate-700 dark:text-slate-300">
            <option>Midterm Exam</option>
            <option>Final Exam</option>
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link href="/teacher/grading/ai-grader" className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm w-full md:w-auto">
            <FileText size={16} /> AI Exam Grader
          </Link>
          <button onClick={handleSave} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm w-full md:w-auto">
            {saved ? <><CheckCircle2 size={16}/> Saved</> : <><Save size={16} /> Save Scores</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Gradebook Table */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" className="pl-9 p-2 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black w-64" placeholder="Search students..." />
            </div>
            <div className="flex gap-4 text-sm font-medium text-slate-500">
              <span>Total Students: 24</span>
              <span>Graded: 22/24</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                  <th className="p-4 font-medium min-w-[200px]">Student Name</th>
                  <th className="p-4 font-medium">MCQ (40)</th>
                  <th className="p-4 font-medium">Theory (60)</th>
                  <th className="p-4 font-medium">Total (100)</th>
                  <th className="p-4 font-medium">Percentile</th>
                  <th className="p-4 font-medium">Final Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Ananya Iyer</p>
                    <p className="text-xs text-slate-500">STU-102</p>
                  </td>
                  <td className="p-4"><input type="number" defaultValue="38" className="w-16 p-1.5 border border-slate-300 dark:border-zinc-700 rounded text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black" /></td>
                  <td className="p-4"><input type="number" defaultValue="55" className="w-16 p-1.5 border border-slate-300 dark:border-zinc-700 rounded text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black" /></td>
                  <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">93</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">98th</td>
                  <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-bold w-10 text-center inline-block">A+</span></td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Aarav Patel</p>
                    <p className="text-xs text-slate-500">STU-101</p>
                  </td>
                  <td className="p-4"><input type="number" defaultValue="25" className="w-16 p-1.5 border border-slate-300 dark:border-zinc-700 rounded text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black" /></td>
                  <td className="p-4"><input type="number" defaultValue="42" className="w-16 p-1.5 border border-slate-300 dark:border-zinc-700 rounded text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black" /></td>
                  <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">67</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">45th</td>
                  <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-xs font-bold w-10 text-center inline-block">B</span></td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors bg-red-50/50 dark:bg-red-900/10">
                  <td className="p-4">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Alex Carter</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 text-red-500"><AlertCircle size={12}/> Needs Review</p>
                  </td>
                  <td className="p-4"><input type="number" defaultValue="12" className="w-16 p-1.5 border border-red-300 dark:border-red-900/50 rounded text-center text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-black text-red-600" /></td>
                  <td className="p-4"><input type="number" defaultValue="20" className="w-16 p-1.5 border border-red-300 dark:border-red-900/50 rounded text-center text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-black text-red-600" /></td>
                  <td className="p-4 text-sm font-bold text-red-600 dark:text-red-500">32</td>
                  <td className="p-4 text-sm text-red-600 dark:text-red-500">5th</td>
                  <td className="p-4"><span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-bold w-10 text-center inline-block">F</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              Class Performance
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                <span className="text-sm text-slate-500">Class Average</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">74.2%</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                <span className="text-sm text-slate-500">Highest Score</span>
                <span className="font-bold text-green-600 dark:text-green-500">98% (Sindhu S.)</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                <span className="text-sm text-slate-500">Lowest Score</span>
                <span className="font-bold text-red-600 dark:text-red-500">32% (Alex C.)</span>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
              Publish Report Cards
            </button>
            <p className="text-xs text-center text-slate-400 mt-2">This will notify parents and students.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
