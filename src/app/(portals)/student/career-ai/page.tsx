"use client";

import PageHeader from "@/components/ui/PageHeader";
import { BrainCircuit, GraduationCap, Briefcase, TrendingUp, Target, Award } from "lucide-react";
import { useState } from "react";

export default function CareerPredictor() {
  const [analyzing, setAnalyzing] = useState(false);
  const [complete, setComplete] = useState(false);

  const runPredictor = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setComplete(true);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="AI Career & College Predictor" 
        description="Analyzes your academic performance, behavior logs, and extracurriculars to forecast optimal future pathways."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input/Control */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <BrainCircuit size={40} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Pathway Engine</h3>
            <p className="text-sm text-slate-500 mb-6">
              Compiles 4 years of your transcript data, discipline score, and AI notes into a predictive tensor array.
            </p>

            {!complete ? (
              <button 
                onClick={runPredictor}
                disabled={analyzing}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 disabled:opacity-50 text-white dark:text-slate-900 font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
              >
                {analyzing ? <><div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin"/> Processing Tensor Array...</> : "Generate AI Prediction"}
              </button>
            ) : (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl">
                <p className="font-bold text-green-700 dark:text-green-400 text-sm">Analysis Complete</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Predictions generated based on 94% confidence intervals.</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Canvas */}
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* College Admissions */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <GraduationCap className="text-blue-500" size={20} /> Top University Matches
                </h3>
                
                <div className="space-y-4">
                  {/* Match 1 */}
                  <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Massachusetts Institute of Technology (MIT)</h4>
                      <p className="text-sm text-slate-500 mt-1">Recommended Major: Aerospace Engineering</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Acceptance Probability</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full w-[82%]"></div>
                        </div>
                        <span className="font-bold text-green-600 dark:text-green-400 text-sm">82%</span>
                      </div>
                    </div>
                  </div>

                  {/* Match 2 */}
                  <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Stanford University</h4>
                      <p className="text-sm text-slate-500 mt-1">Recommended Major: Computer Science</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Acceptance Probability</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full w-[65%]"></div>
                        </div>
                        <span className="font-bold text-yellow-600 dark:text-yellow-500 text-sm">65%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Path */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 pointer-events-none">
                  <Target size={150} />
                </div>
                
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 relative z-10">
                  <Briefcase className="text-purple-500" size={20} /> Predicted Optimal Career
                </h3>
                
                <div className="relative z-10 space-y-4">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Chief Technology Officer (CTO) / Technical Founder</h2>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl">
                    <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                      <strong>AI Rationale:</strong> Your exceptional scores in Advanced Mathematics and Physics, combined with your "+5 pts Leadership" behavior logs, strongly index towards executive technical leadership. You show high aptitude for both complex problem solving and team management.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <Award size={16} className="text-yellow-500" /> High Earning Potential
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <TrendingUp size={16} className="text-green-500" /> 24% Industry Growth
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <BrainCircuit size={80} className="mb-4 opacity-20" />
              <p className="font-medium text-slate-600 dark:text-slate-300 text-lg">Awaiting Your Data</p>
              <p className="text-sm max-w-sm text-center mt-2">Click "Generate AI Prediction" to run the ML model against your academic and behavioral history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
