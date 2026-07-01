"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { ScanLine, Sparkles, CheckCircle2 } from "lucide-react";

export default function AIGraderPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);

  const runScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult([
        "> Initializing OCR engine...",
        "> Detected handwriting block (confidence: 94%)",
        "> Extracted: &quot;Newton&apos;s second law states that F=ma...&quot;",
        "> Extracted: &quot;Force is energy applied over a distance...&quot;",
        "> Cross-referencing answer key...",
        "> Question 1: Correct (full marks)",
        "> Question 2: Partial credit — missing unit conversion",
        "> Final Score: 8.5 / 10",
      ]);
      setScanning(false);
    }, 2800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="AI Automated Exam Grader"
        description="Upload scanned answer sheets for instant AI-assisted grading."
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center text-center mb-6">
          <ScanLine size={40} className="text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">Drop a scanned answer sheet here, or click to upload</p>
          <button
            onClick={runScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-70"
          >
            <Sparkles size={16} /> {scanning ? "Processing..." : "Simulate Scan"}
          </button>
        </div>

        {result && (
          <div className="bg-slate-950 rounded-xl p-5 font-mono text-sm text-green-400 space-y-1 shadow-inner">
            {result.map((line, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
            ))}
            <p className="flex items-center gap-2 text-white font-bold pt-2">
              <CheckCircle2 size={14} className="text-green-400" /> Grading complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
