"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { BrainCircuit, Sparkles, AlertTriangle, Smile, Frown, Meh } from "lucide-react";

const mockNotes = [
  { student: "Aarav Patel", note: "&quot;Seemed withdrawn during group activities today, didn't participate much.&quot;", sentiment: "negative", teacher: "Ms. Sharma" },
  { student: "Diya Reddy", note: "&quot;Bright and enthusiastic in class discussions, asked great questions.&quot;", sentiment: "positive", teacher: "Mr. Venkatesh" },
  { student: "Kabir Singh", note: "&quot;Average engagement, completed assignments but seemed distracted.&quot;", sentiment: "neutral", teacher: "Mrs. Lakshmi Rajan" },
];

export default function SentimentAIPage() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const runScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2500);
  };

  const sentimentConfig = {
    positive: { icon: Smile, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
    negative: { icon: Frown, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    neutral: { icon: Meh, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Smart Behavioral Sentiment AI"
        description="Scan teacher notes and behavior logs to flag at-risk students early."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={150} />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-300" /> Global Sentiment Scanner
          </h2>
          <p className="text-indigo-200 text-sm mb-6 max-w-lg leading-relaxed">
            This tool analyzes free-text notes left by teachers across attendance, grading, and behavior logs to detect early signs of disengagement or distress.
          </p>
          <button
            onClick={runScan}
            disabled={scanning}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
          >
            {scanning ? (
              <><BrainCircuit size={18} className="animate-spin" /> Scanning Records...</>
            ) : (
              <><BrainCircuit size={18} /> Run Global Scan</>
            )}
          </button>
        </div>
      </div>

      {scanned && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" /> Flagged Observations
          </h3>
          {mockNotes.map((item, i) => {
            const config = sentimentConfig[item.sentiment as keyof typeof sentimentConfig];
            const Icon = config.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.student}</p>
                    <span className="text-xs text-slate-400">{item.teacher}</span>
                  </div>
                  <p
                    className="text-sm text-slate-600 dark:text-slate-400 italic"
                    dangerouslySetInnerHTML={{ __html: item.note }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
