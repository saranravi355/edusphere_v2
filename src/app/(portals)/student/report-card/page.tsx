import PageHeader from "@/components/ui/PageHeader";
import { Download, Award, TrendingUp, AlertCircle, Sparkles } from "lucide-react";

export default function StudentReportCard() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title="Academic Report Card" 
          description="Midterm Examination Results (Fall 2026)"
        />
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg mb-6">
          <Download size={18} /> Download PDF
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between border-b border-slate-200 dark:border-zinc-800 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">EduSphere 360</h1>
            <p className="text-slate-500 font-medium">Official Academic Transcript</p>
          </div>
          <div className="mt-6 md:mt-0 text-left md:text-right">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Jane Smith</h3>
            <p className="text-slate-500">Student ID: STU-26-102</p>
            <p className="text-slate-500">Grade 10 • Section A</p>
          </div>
        </div>

        {/* Grades Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-800 dark:border-slate-100 uppercase text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="pb-3">Subject</th>
                <th className="pb-3">Teacher</th>
                <th className="pb-3 text-center">Score</th>
                <th className="pb-3 text-center">Percentile</th>
                <th className="pb-3 text-right">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">Advanced Mathematics</td>
                <td className="py-4 text-slate-500 text-sm">Dr. S. Jenkins</td>
                <td className="py-4 text-center font-bold">94/100</td>
                <td className="py-4 text-center text-slate-500 text-sm">98th</td>
                <td className="py-4 text-right"><span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md font-bold text-sm">A+</span></td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">Physics (Lab + Theory)</td>
                <td className="py-4 text-slate-500 text-sm">Mr. E. Clark</td>
                <td className="py-4 text-center font-bold">88/100</td>
                <td className="py-4 text-center text-slate-500 text-sm">85th</td>
                <td className="py-4 text-right"><span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md font-bold text-sm">A</span></td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">World Literature</td>
                <td className="py-4 text-slate-500 text-sm">Mrs. M. Davis</td>
                <td className="py-4 text-center font-bold">76/100</td>
                <td className="py-4 text-center text-slate-500 text-sm">62nd</td>
                <td className="py-4 text-right"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md font-bold text-sm">B</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700/50">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-purple-500" /> AI Performance Summary
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Jane has shown exceptional aptitude in STEM subjects, specifically Mathematics, ranking in the top 2% of her cohort. Literature requires minor attention, particularly in essay structuring. Overall trajectory is highly positive.
            </p>
          </div>
          
          <div className="flex flex-col justify-center items-center p-6 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-2xl">
            <p className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-2">GPA</p>
            <h2 className="text-5xl font-black text-slate-800 dark:text-slate-100 mb-2">3.8<span className="text-2xl text-slate-400 font-medium">/4.0</span></h2>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
              <TrendingUp size={16} /> Top 5% of Class
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
