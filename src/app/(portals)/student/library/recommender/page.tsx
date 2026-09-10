"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { Sparkles, BookOpen, Star } from "lucide-react";

type Book = { title: string; author: string; reason: string; match: number };

// Every title, for either programme, is in the school library's catalogue.
const BOOKS: Record<"DP" | "MYP", Book[]> = {
  DP: [
    { title: "The God of Small Things", author: "Arundhati Roy", reason: "In the library, and overlaps with your English A: Language & Literature unit on identity and power", match: 94 },
    { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", reason: "Strong fit for your TOK exhibition theme on knowledge and history", match: 88 },
    { title: "Development as Freedom", author: "Amartya Sen", reason: "Pairs with the development economics unit in Economics HL; heavier going, so worth starting early", match: 81 },
  ],
  MYP: [
    { title: "Persepolis", author: "Marjane Satrapi", reason: "A graphic memoir for your Language & Literature unit on identity and perspective", match: 92 },
    { title: "Factfulness", author: "Hans Rosling", reason: "Pairs with your Individuals & Societies unit on development and inequality", match: 86 },
    { title: "The Man Who Knew Infinity", author: "Robert Kanigel", reason: "Ramanujan's life, for the Mathematics interest you listed; a longer read, so worth starting early", match: 79 },
  ],
};

export default function ReadingRecommenderPage() {
  const { running, complete, run } = useAIScan(2200);
  const books = BOOKS[useProgramme()];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Reading Level Recommender"
        description="Suggests books matched to your reading level and current coursework — drawn from the school library catalogue."
      />

      <AIPreviewNotice />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-amber-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><BookOpen size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-amber-300" /> Recommendation Engine</h2>
          <p className="text-amber-200 text-sm mb-6 max-w-lg leading-relaxed">
            Matches your current subject units and recent reading against the library&apos;s available titles.
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
