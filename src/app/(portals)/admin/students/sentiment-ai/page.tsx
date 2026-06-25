"use client";

import PageHeader from "@/components/ui/PageHeader";
import { BrainCircuit, MessageSquare, AlertTriangle, TrendingDown, ArrowRight, ShieldAlert } from "lucide-react";
import { useState } from "react";

export default function SmartSentimentAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [complete, setComplete] = useState(false);

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setComplete(true);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Smart Behavioral Sentiment AI" 
        description="NLP engine that scans teacher notes and disciplinary logs to detect early warning signs."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scanner Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <BrainCircuit size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Deep Scan Engine</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              Run NLP sentiment analysis across 4,500+ unread teacher notes, assignment comments, and discipline logs.
            </p>

            {!complete ? (
              <button 
                onClick={runAnalysis}
                disabled={analyzing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md"
              >
                {analyzing ? <><BrainCircuit className="animate-pulse" size={18}/> Scanning NLP Corpus...</> : "Run Global Scan"}
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-4 rounded-xl text-center">
                <p className="font-bold text-green-700 dark:text-green-400 text-sm mb-1">Scan Complete</p>
                <p className="text-xs text-green-600 dark:text-green-500">Processed 4,521 logs in 2.5s</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl p-6 text-white shadow-sm border border-slate-800">
            <h3 className="font-medium text-slate-400 mb-2 text-sm">Engine Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">NLP Confidence</span>
                <span className="font-mono text-green-400">92.4%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Lexicon Loaded</span>
                <span className="font-mono">Educational DB v2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-500" size={18} /> Critical Flagged Students
              </h3>

              {/* Flag 1 */}
              <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Kabir Verma</h4>
                    <p className="text-sm text-slate-500">Grade 8 • <span className="text-red-500 font-medium">High Risk (Isolation/Bullying)</span></p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold font-mono">
                    NLP Score: 0.88
                  </span>
                </div>
                
                <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-3 mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correlated Teacher Notes</p>
                  <div className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <MessageSquare size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <p>"Kabir has been sitting alone during lunch for the past week. Seems unusually quiet in group discussions." <span className="text-xs text-slate-400 block mt-1">- Mr. Kumar (2 days ago)</span></p>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-zinc-700/50 pt-3">
                    <TrendingDown size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <p>"Did not participate in P.E. today. Mentioned not wanting to be around certain classmates." <span className="text-xs text-slate-400 block mt-1">- Coach Davis (Yesterday)</span></p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <ShieldAlert size={16} /> Alert Counselor
                  </button>
                  <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    View Full Profile <ArrowRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 shadow-sm">
              <BrainCircuit size={64} className="mb-4 opacity-20" />
              <p className="font-medium text-slate-600 dark:text-slate-300">Engine Idle</p>
              <p className="text-sm max-w-xs text-center mt-2">Click "Run Global Scan" to process current unstructured data across the institution.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
