"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { Sparkles, FileEdit, Check, X } from "lucide-react";

const drafts = [
  {
    student: "Aanya Kapoor",
    assignment: "Chemistry SL — IA Draft: Rates of Reaction",
    feedback: "Strong use of qualitative observations, but your data table lacks uncertainty values for the burette readings (Criterion B: Data Collection). Consider repeating trial 3 — the outlier wasn't addressed in your analysis.",
  },
  {
    student: "Ethan Fernandes",
    assignment: "Individuals & Societies — Source Evaluation",
    feedback: "Good identification of origin and purpose, but the evaluation of value/limitation for Source B is underdeveloped against Criterion B. Add a sentence linking the source's bias to its usefulness for this specific question.",
  },
  {
    student: "Priya Nair",
    assignment: "English A — Comparative Essay Draft",
    feedback: "Excellent global engagement with both texts. Tighten your thesis statement to more directly answer the prompt, and ensure each body paragraph closes with a line back to the line of inquiry.",
  },
];

export default function AIFeedbackReviewPage() {
  const { running, complete, run } = useAIScan(2500);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Smart Homework Feedback"
        description="Drafts criterion-referenced feedback on submitted homework and IA drafts for you to review, edit and approve before it reaches students."
      />

      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><FileEdit size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-emerald-300" /> Feedback Drafting Engine</h2>
          <p className="text-emerald-200 text-sm mb-6 max-w-lg leading-relaxed">
            Reads new submissions in your queue and drafts criterion-aligned feedback. Nothing is sent to students until you approve it.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><FileEdit size={18} className="animate-pulse" /> Drafting Feedback...</> : <><FileEdit size={18} /> Draft Feedback for Queue (3)</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {drafts.map((d, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <p className="font-bold text-slate-800 dark:text-slate-100">{d.student}</p>
              <p className="text-xs text-slate-500 mb-3">{d.assignment}</p>
              <textarea
                defaultValue={d.feedback}
                className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div className="flex gap-2 mt-3">
                <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"><Check size={13} /> Approve & Send</button>
                <button className="px-4 py-1.5 border border-slate-200 dark:border-zinc-700 text-slate-500 text-xs font-bold rounded-lg flex items-center gap-1"><X size={13} /> Discard</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AIEmptyState icon={FileEdit} title="No Drafts Yet" subtitle="Draft feedback for your pending submissions queue." />
      )}
    </div>
  );
}
