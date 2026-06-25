"use client";

import PageHeader from "@/components/ui/PageHeader";
import { BrainCircuit, Upload, Scan, CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function AIGrader() {
  const [analyzing, setAnalyzing] = useState(false);
  const [complete, setComplete] = useState(false);

  const runGrader = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setComplete(true);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="AI Automated Exam Grader" 
          description="Upload scanned handwritten exams. Our NLP engine will use OCR to read, evaluate, and assign a score."
        />
        <Link href="/teacher/grading" className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
          Back to Gradebook
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload & Control Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-indigo-500" />
              Upload Batch
            </h3>
            
            <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-zinc-900/50 mb-6">
              <FileText size={48} className="text-slate-400 mb-4" />
              <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">Drag & Drop Scanned PDFs</p>
              <p className="text-sm text-slate-500">or click to browse from your computer.</p>
              <div className="mt-4 px-4 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-bold font-mono">
                Loaded: Grade10_Physics_Midterm.pdf (24 Pages)
              </div>
            </div>

            {!complete ? (
              <button 
                onClick={runGrader}
                disabled={analyzing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg"
              >
                {analyzing ? <><Scan className="animate-spin" size={18}/> Processing OCR & Grading...</> : "Run AI Evaluator"}
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-4 rounded-xl text-center">
                <p className="font-bold text-green-700 dark:text-green-400 mb-1 flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Evaluation Complete
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">24 Papers Graded in 4.1s. Saved to Gradebook.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Analysis Mockup */}
        <div className="bg-black rounded-2xl p-6 text-green-400 font-mono shadow-sm relative overflow-hidden flex flex-col h-[500px]">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <BrainCircuit size={100} />
          </div>
          
          <h3 className="font-medium text-slate-400 mb-4 text-sm flex items-center gap-2 z-10">
            <BrainCircuit size={16} /> Neural Engine Output Terminal
          </h3>
          
          <div className="flex-1 overflow-auto text-xs space-y-2 opacity-80 z-10">
            {analyzing ? (
              <>
                <p className="animate-pulse">Loading OCR Module v4.2...</p>
                <p className="delay-100 opacity-0 animate-[fade-in_0s_0.5s_forwards]">Ingesting page 1: Ananya Iyer (STU-102)...</p>
                <p className="delay-200 opacity-0 animate-[fade-in_0s_1s_forwards] text-white">Extracting handwritten text: "Newton's second law states that F=ma..."</p>
                <p className="delay-300 opacity-0 animate-[fade-in_0s_1.5s_forwards] text-yellow-400">Evaluating against Rubric ID: 8942...</p>
                <p className="delay-400 opacity-0 animate-[fade-in_0s_2s_forwards] text-blue-400">Match found. Semantic similarity: 98%. Awarding 5/5 points.</p>
                <p className="delay-500 opacity-0 animate-[fade-in_0s_2.5s_forwards]">Ingesting page 2: Aarav Patel (STU-101)...</p>
                <p className="delay-700 opacity-0 animate-[fade-in_0s_3s_forwards] text-white">Extracting handwritten text: "Force is energy..."</p>
                <p className="delay-1000 opacity-0 animate-[fade-in_0s_3.5s_forwards] text-red-400">Incorrect definition detected. Awarding 1/5 points.</p>
              </>
            ) : complete ? (
              <>
                <p className="text-green-500 font-bold">BATCH COMPLETE.</p>
                <p>--- Summary ---</p>
                <p>Papers Processed: 24</p>
                <p>Average Score: 74.2%</p>
                <p>Anomalies Detected: 1 (Alex Carter - Blank Paper)</p>
                <p className="text-blue-400 mt-4">Writing scores to SQL Database... Success.</p>
              </>
            ) : (
              <p className="text-slate-600">Awaiting payload...</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
