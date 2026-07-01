"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { Sparkles, BookOpen, Star } from "lucide-react";

const books = [
  { title: "The Kite Runner", author: "Khaled Hosseini", reason: "Matches your reading level and overlaps with your English A unit on identity & conflict", match: 94 },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", reason: "Strong fit for your TOK exhibition theme on knowledge and history", match: 88 },
  { title: "The Curious Incident of the Dog in the Night-Time", author: "Mark Haddon", reason: "Slightly below your current Lexile band — good for a faster, confidence-building read", match: 76 },
];

export default function ReadingRecommenderPage() {
  const { running, complete, run } = useAIScan(2200);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Reading Level Recommender"
        description="Suggests books matched to your reading level and current coursework — drawn from the school library catalogue."
      />

      <div className="bg-gradient-to-br from-amber-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-amber-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><BookOpen size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-amber-300" /> Recommendation Engine</h2>
          <p className="text-amber-200 text-sm mb-6 max-w-lg leading-relaxed">
            Matches your last reading assessment level and current subject units against the library&apos;s available titles.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><BookOpen size={18} className="animate-pulse" /> Finding Books...</> : <><BookOpen size={18} /> Recommend Books for Me</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {books.map((b, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 text-sm">{b.match}%</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{b.title}</p>
                  {i === 0 && <Star size={14} className="text-amber-400" fill="currentColor" />}
                </div>
                <p className="text-xs text-slate-400 mb-1">{b.author}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{b.reason}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AIEmptyState icon={BookOpen} title="No Recommendations Yet" subtitle="Run the engine to get books matched to your reading level." />
      )}
    </div>
  );
}
