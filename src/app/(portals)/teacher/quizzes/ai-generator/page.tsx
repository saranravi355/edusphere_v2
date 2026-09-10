"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { Sparkles, ListChecks, Plus } from "lucide-react";

// DP Economics as the current guide sets it: Paper 1 is the extended-response
// paper (a 10-mark part (a) and a 15-mark part (b)), Paper 2 is data response.
// Exam questions are tagged to assessment objectives, not to lettered criteria.
// The old set had the two papers the wrong way round and invented "Criterion A:
// Knowledge" labels, with mark values no DP Economics question carries.
const generated = [
  { q: "Explain two limitations of using GDP per capita as a measure of economic development.", type: "Paper 1 — part (a)", marks: 10, objective: "AO2 Application and analysis" },
  { q: "Using a production possibilities curve, explain the concept of opportunity cost.", type: "Paper 2 — data response", marks: 4, objective: "AO2 Application and analysis" },
  { q: "Using real-world examples, evaluate the effectiveness of fiscal policy in closing a deflationary gap.", type: "Paper 1 — part (b)", marks: 15, objective: "AO3 Synthesis and evaluation" },
  { q: "Define the term 'merit good'.", type: "Paper 2 — data response", marks: 2, objective: "AO1 Knowledge and understanding" },
];

export default function AIQuestionGeneratorPage() {
  const { running, complete, run } = useAIScan(2400);
  const [topic, setTopic] = useState("DP Economics HL — Paper 1 and Paper 2 practice");

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="AI Question Bank Generator"
        description="Generates IB-style exam questions mapped to assessment objectives and command terms for any DP or MYP subject and topic."
      />

      <AIPreviewNotice />

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <label htmlFor="qbank-topic" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Topic / Unit</label>
        <input
          id="qbank-topic"
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
                <span>{g.type}</span><span>·</span><span>{g.objective}</span>
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
