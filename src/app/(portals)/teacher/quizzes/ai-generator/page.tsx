"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { Sparkles, ListChecks, Plus } from "lucide-react";

const generated = [
  { q: "Outline two strengths and two limitations of using GDP per capita as a measure of development.", type: "Paper 2 — Extended Response", marks: 8, criterion: "Criterion B: Application" },
  { q: "Define 'opportunity cost' and illustrate it using a production possibility curve.", type: "Paper 1 — Short Answer", marks: 4, criterion: "Criterion A: Knowledge" },
  { q: "Evaluate the effectiveness of fiscal policy in addressing a negative output gap, using a real-world example.", type: "Paper 2 — Essay", marks: 12, criterion: "Criterion C: Synthesis & Evaluation" },
  { q: "Distinguish between merit goods and public goods, providing one example of each.", type: "Paper 1 — Short Answer", marks: 4, criterion: "Criterion A: Knowledge" },
];

export default function AIQuestionGeneratorPage() {
  const { running, complete, run } = useAIScan(2400);
  const [topic, setTopic] = useState("DP Economics — Macroeconomics: Government Intervention");

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="AI Question Bank Generator"
        description="Generates IB-style exam questions mapped to assessment objectives and command terms for any DP or MYP subject and topic."
      />

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Topic / Unit</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={run}
          disabled={running}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"
        >
          {running ? <><Sparkles size={18} className="animate-pulse" /> Generating Questions...</> : <><Sparkles size={18} /> Generate Question Set</>}
        </button>
      </div>

      {complete ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><ListChecks size={18} className="text-indigo-500" /> Generated Questions</h3>
          {generated.map((g, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2 gap-3">
                <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{g.q}</p>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold shrink-0">{g.marks} marks</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{g.type}</span><span>·</span><span>{g.criterion}</span>
              </div>
            </div>
          ))}
          <button className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl text-slate-500 text-sm font-semibold flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
            <Plus size={16} /> Add Selected to Quiz Bank
          </button>
        </div>
      ) : (
        <AIEmptyState icon={ListChecks} title="No Questions Yet" subtitle="Generate a question set to preview IB-aligned questions for this topic." />
      )}
    </div>
  );
}
