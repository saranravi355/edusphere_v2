"use client";

import { useState } from "react";
import { Fingerprint, Brain } from "lucide-react";
import { LEARNER_PROFILE_ATTRIBUTES, ATL_CATEGORIES, ATL_RATING_LABELS } from "@/lib/ib";

type ProfileEvidence = { id: string; attribute: string; evidence: string; teacherName: string; createdAt: string };
type ATLRecord = { id: string; category: string; rating: number; note: string | null; teacherName: string; createdAt: string };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

function ProfileTab({ items }: { items: ProfileEvidence[] }) {
  const byAttribute = new Map<string, ProfileEvidence[]>();
  for (const item of items) {
    if (!byAttribute.has(item.attribute)) byAttribute.set(item.attribute, []);
    byAttribute.get(item.attribute)!.push(item);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {LEARNER_PROFILE_ATTRIBUTES.map((attr) => {
        const evidence = byAttribute.get(attr.value) ?? [];
        return (
          <div key={attr.value} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{attr.label}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500">{evidence.length}</span>
            </div>
            {evidence.length === 0 ? (
              <p className="text-xs text-slate-400">No evidence recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {evidence.map((e) => (
                  <div key={e.id} className="text-xs">
                    <p className="text-slate-600 dark:text-slate-300">{e.evidence}</p>
                    <p className="text-slate-400 mt-0.5">— {e.teacherName}, {fmt(e.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ATLTab({ items }: { items: ATLRecord[] }) {
  const byCategory = new Map<string, ATLRecord[]>();
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category)!.push(item);
  }

  return (
    <div className="space-y-3">
      {ATL_CATEGORIES.map((cat) => {
        const history = byCategory.get(cat.value) ?? [];
        const latest = history[0];
        return (
          <div key={cat.value} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{cat.label}</span>
              {latest ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {ATL_RATING_LABELS[latest.rating]}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Not yet rated</span>
              )}
            </div>
            {history.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {history.slice(0, 3).map((h) => (
                  <div key={h.id} className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-600 dark:text-slate-300">{ATL_RATING_LABELS[h.rating]}</span>
                    {h.note ? ` — ${h.note}` : ""} <span className="text-slate-400">({fmt(h.createdAt)}, {h.teacherName})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function GrowthClient({ profileEvidence, atlRecords }: { profileEvidence: ProfileEvidence[]; atlRecords: ATLRecord[] }) {
  const [tab, setTab] = useState<"profile" | "atl">("profile");

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => setTab("profile")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "profile" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-400"}`}
        >
          <Fingerprint size={15} /> Learner Profile
        </button>
        <button
          onClick={() => setTab("atl")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "atl" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-400"}`}
        >
          <Brain size={15} /> ATL Skills
        </button>
      </div>
      {tab === "profile" ? <ProfileTab items={profileEvidence} /> : <ATLTab items={atlRecords} />}
    </div>
  );
}
