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
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Ananya Iyer</h3>
            <p className="text-slate-500">Student ID: STU-26-102</p>
            <p className="text-slate-500">IB Diploma Programme • Year 1</p>
          </div>
        </div>

        {/* Grades Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-800 dark:border-slate-100 uppercase text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="pb-3">Subject (HL/SL)</th>
                <th className="pb-3">Teacher</th>
                <th className="pb-3 text-center">IA Score</th>
                <th className="pb-3 text-center">Predicted EA</th>
                <th className="pb-3 text-right">IB Grade (1-7)</th>
                <th className="pb-3 pl-6 text-left">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">Mathematics: Analysis & Approaches (HL)</td>
                <td className="py-4 text-slate-500 text-sm">Dr. S. Jenkins</td>
                <td className="py-4 text-center font-bold">18/20</td>
                <td className="py-4 text-center text-slate-500 text-sm">76/80</td>
                <td className="py-4 text-right"><span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md font-bold text-sm">7</span></td>
                <td className="py-4 pl-6 text-sm text-slate-600 dark:text-slate-400 italic">&quot;Excellent grasp of mathematical concepts. Consistently high performance in calculus.&quot;</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">Physics (HL)</td>
                <td className="py-4 text-slate-500 text-sm">Mr. E. Clark</td>
                <td className="py-4 text-center font-bold">21/24</td>
                <td className="py-4 text-center text-slate-500 text-sm">68/76</td>
                <td className="py-4 text-right"><span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md font-bold text-sm">6</span></td>
                <td className="py-4 pl-6 text-sm text-slate-600 dark:text-slate-400 italic">&quot;Strong analytical skills. Needs to refine lab report conclusions.&quot;</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">English A: Literature (SL)</td>
                <td className="py-4 text-slate-500 text-sm">Mrs. M. Davis</td>
                <td className="py-4 text-center font-bold">16/20</td>
                <td className="py-4 text-center text-slate-500 text-sm">55/80</td>
                <td className="py-4 text-right"><span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md font-bold text-sm">5</span></td>
                <td className="py-4 pl-6 text-sm text-slate-600 dark:text-slate-400 italic">&quot;Great participation, but focus more on essay structure for Paper 2.&quot;</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">Economics (HL)</td>
                <td className="py-4 text-slate-500 text-sm">Ms. A. Sharma</td>
                <td className="py-4 text-center font-bold">22/25</td>
                <td className="py-4 text-center text-slate-500 text-sm">82/95</td>
                <td className="py-4 text-right"><span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md font-bold text-sm">7</span></td>
                <td className="py-4 pl-6 text-sm text-slate-600 dark:text-slate-400 italic">&quot;Outstanding macroeconomic analysis. Keep up the phenomenal work.&quot;</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">Chemistry (SL)</td>
                <td className="py-4 text-slate-500 text-sm">Dr. R. Gupta</td>
                <td className="py-4 text-center font-bold">19/24</td>
                <td className="py-4 text-center text-slate-500 text-sm">60/76</td>
                <td className="py-4 text-right"><span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md font-bold text-sm">6</span></td>
                <td className="py-4 pl-6 text-sm text-slate-600 dark:text-slate-400 italic">&quot;Solid foundational knowledge. Practicing past papers will push this to a 7.&quot;</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-800 dark:text-slate-100">Spanish B (SL)</td>
                <td className="py-4 text-slate-500 text-sm">Mr. L. Martinez</td>
                <td className="py-4 text-center font-bold">20/25</td>
                <td className="py-4 text-center text-slate-500 text-sm">65/75</td>
                <td className="py-4 text-right"><span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md font-bold text-sm">6</span></td>
                <td className="py-4 pl-6 text-sm text-slate-600 dark:text-slate-400 italic">&quot;Excellent conversational skills. Vocabulary expansion is recommended.&quot;</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8 p-6 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">DP Core Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Theory of Knowledge</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">A</span>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">Excellent</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Extended Essay</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">B</span>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">Good</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">CAS Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-800 dark:text-slate-100">On Track</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium bg-slate-200 dark:bg-zinc-700 px-2 py-0.5 rounded">120 hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-blue-500" /> AI IB Performance Summary
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ananya is demonstrating an exceptional understanding of HL subjects, particularly Mathematics and Economics. To secure a 43+ overall, she should focus on elevating her English Literature SL score. Her TOK and EE combined will yield +3 bonus points.
            </p>
          </div>

          <div className="flex flex-col justify-center items-center p-6 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900">
            <p className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-2">Total DP Points</p>
            <h2 className="text-5xl font-black text-slate-800 dark:text-slate-100 mb-2">40<span className="text-2xl text-slate-400 font-medium">/45</span></h2>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
              <TrendingUp size={16} /> Projected to meet Ivy League conditions
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
