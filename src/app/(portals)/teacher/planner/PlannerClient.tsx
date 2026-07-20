"use client";

import { useState, useTransition } from "react";
import {
  Plus, X, BookOpen, CheckCircle2, Clock, FileText, Sparkles, Loader2,
  Trash2, Globe2, ChevronDown, ChevronUp, Printer,
} from "lucide-react";
import { createLessonPlan, setLessonStatus, deleteLessonPlan, generateSubPlan } from "./actions";

interface Plan {
  id: string;
  title: string;
  subjectName: string;
  className: string | null;
  date: string;
  durationMinutes: number;
  ibUnit: string | null;
  atlSkills: string | null;
  learnerProfile: string | null;
  objectives: string | null;
  activities: string | null;
  resources: string | null;
  assessment: string | null;
  status: string;
  subPlan: string | null;
}

const ATL_SKILLS = ["Thinking", "Communication", "Social", "Self-management", "Research"];
const LEARNER_PROFILE = ["Inquirers", "Knowledgeable", "Thinkers", "Communicators", "Principled", "Open-minded", "Caring", "Risk-takers", "Balanced", "Reflective"];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400" },
  PLANNED: { label: "Planned", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  DELIVERED: { label: "Delivered", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

export default function PlannerClient({ plans, subjects }: { plans: Plan[]; subjects: string[] }) {
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [atl, setAtl] = useState<string[]>([]);
  const [profile, setProfile] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingSub, setPendingSub] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const delivered = plans.filter((p) => p.status === "DELIVERED").length;
  const coverage = plans.length ? Math.round((delivered / plans.length) * 100) : 0;

  function toggle(list: string[], set: (v: string[]) => void, item: string) {
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function submit(formData: FormData) {
    setError(null);
    formData.set("atlSkills", atl.join(", "));
    formData.set("learnerProfile", profile.join(", "));
    startTransition(async () => {
      const res = await createLessonPlan(formData);
      if (res?.error) setError(res.error);
      else {
        setShowForm(false);
        setAtl([]);
        setProfile([]);
      }
    });
  }

  function makeSubPlan(id: string) {
    setPendingSub(id);
    startTransition(async () => {
      await generateSubPlan(id);
      setPendingSub(null);
      setExpanded(id);
    });
  }

  return (
    <div className="space-y-4">
      {/* Coverage strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{plans.length}</p>
            <p className="text-xs text-slate-500">Lesson plans this term</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{coverage}%</p>
            <p className="text-xs text-slate-500">Curriculum coverage (delivered vs planned)</p>
            <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${coverage}%` }} />
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:opacity-90 rounded-2xl p-5 shadow-sm text-white flex items-center justify-center gap-2 font-bold text-sm transition-all"
        >
          <Plus size={18} /> New IB Lesson Plan
        </button>
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
          <FileText className="mx-auto mb-2 text-slate-400" size={28} />
          No lesson plans yet — create your first IB-aligned plan.
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const meta = STATUS_META[p.status] || STATUS_META.PLANNED;
            const open = expanded === p.id;
            return (
              <div key={p.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">{p.title}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.subjectName}{p.className ? ` · ${p.className}` : ""} · {new Date(p.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {p.durationMinutes} min
                      {p.ibUnit ? ` · Unit: ${p.ibUnit}` : ""}
                    </p>
                    {(p.atlSkills || p.learnerProfile) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.atlSkills?.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                          <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">ATL: {s}</span>
                        ))}
                        {p.learnerProfile?.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                          <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.status !== "DELIVERED" && (
                      <button
                        onClick={() => startTransition(() => setLessonStatus(p.id, "DELIVERED").then(() => {}))}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100"
                      >
                        Mark delivered
                      </button>
                    )}
                    <button
                      onClick={() => makeSubPlan(p.id)}
                      disabled={pendingSub === p.id}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      {pendingSub === p.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {p.subPlan ? "Regenerate sub-plan" : "Generate sub-plan"}
                    </button>
                    <button onClick={() => setExpanded(open ? null : p.id)} className="p-1.5 text-slate-400 hover:text-slate-600">
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={() => startTransition(() => deleteLessonPlan(p.id).then(() => {}))}
                      className="p-1.5 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {p.objectives && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Objectives</p>
                          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{p.objectives}</p>
                        </div>
                      )}
                      {p.activities && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Activities</p>
                          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{p.activities}</p>
                        </div>
                      )}
                      {p.resources && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Resources</p>
                          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{p.resources}</p>
                        </div>
                      )}
                      {p.assessment && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Assessment</p>
                          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{p.assessment}</p>
                        </div>
                      )}
                    </div>
                    {p.subPlan && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <FileText size={13} /> Substitute teacher plan
                          </p>
                          <button onClick={() => window.print()} className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1">
                            <Printer size={12} /> Print
                          </button>
                        </div>
                        <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">{p.subPlan}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Globe2 size={18} className="text-blue-600" /> New IB Lesson Plan
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">{error}</div>}

            <form action={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lesson title</label>
                  <input name="title" required placeholder="e.g. Energy transfer — station inquiry" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject</label>
                  <input name="subjectName" required list="subj" placeholder="e.g. MYP Sciences" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                  <datalist id="subj">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class</label>
                  <input name="className" placeholder="e.g. MYP 4B" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                  <input type="date" name="date" required className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration (min)</label>
                  <input type="number" name="durationMinutes" defaultValue={60} min={15} max={240} className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">IB unit / syllabus topic</label>
                  <input name="ibUnit" placeholder="e.g. MYP Unit: Systems & change · Key concept: Systems" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ATL skill focus</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ATL_SKILLS.map((s) => (
                    <button type="button" key={s} onClick={() => toggle(atl, setAtl, s)}
                      className={`px-2.5 py-1.5 text-[11px] font-bold rounded-full transition-colors ${atl.includes(s) ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300 hover:bg-slate-200"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Learner profile attributes</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {LEARNER_PROFILE.map((s) => (
                    <button type="button" key={s} onClick={() => toggle(profile, setProfile, s)}
                      className={`px-2.5 py-1.5 text-[11px] font-bold rounded-full transition-colors ${profile.includes(s) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300 hover:bg-slate-200"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Objectives</label>
                  <textarea name="objectives" rows={3} placeholder="What will students understand or be able to do?" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Activities (one per line)</label>
                  <textarea name="activities" rows={3} placeholder={"Station inquiry rotation (20 min)\nGroup Sankey diagram (15 min)"} className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Resources</label>
                  <textarea name="resources" rows={2} placeholder="Lab kits, thermal camera, worksheets…" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Assessment</label>
                  <textarea name="assessment" rows={2} placeholder="e.g. Formative — Criterion B practice prompts, peer-marked" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none" />
                </div>
              </div>

              <button type="submit" disabled={isPending} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                {isPending ? "Saving…" : "Create Lesson Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
