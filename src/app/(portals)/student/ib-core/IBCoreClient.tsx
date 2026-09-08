"use client";

import { useActionState, useState } from "react";
import { Sparkles, BookOpen, Brain, CheckCircle2, Clock, MessageSquareText } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { addCASReflection, addCoreJournalEntry } from "./actions";
import { CAS_STRANDS, CAS_STRAND_TARGET_HOURS, IB_CORE_ELEMENT_LABELS, type IBCoreElement } from "@/lib/ib";

type Entry = {
  id: string;
  authorRole: string;
  kind: string;
  strand: string | null;
  hours: number | null;
  text: string;
  approved: boolean | null;
  createdAt: string;
};
type CoreRecord = {
  id: string;
  title: string | null;
  status: string;
  grade: string | null;
  creativityHours: number;
  activityHours: number;
  serviceHours: number;
  entries: Entry[];
} | null;

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

function EntryRow({ entry }: { entry: Entry }) {
  const isTeacher = entry.authorRole === "TEACHER";
  return (
    <div className={`rounded-xl border p-3.5 ${isTeacher ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-zinc-800"}`}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
          {isTeacher ? <MessageSquareText size={12} /> : <BookOpen size={12} />}
          {isTeacher ? "Supervisor comment" : entry.kind === "MILESTONE" ? "Milestone" : "Your entry"}
          {entry.strand && ` · ${entry.strand.charAt(0)}${entry.strand.slice(1).toLowerCase()}`}
          {entry.hours ? ` · ${entry.hours}h` : ""}
        </span>
        <span className="text-[11px] text-slate-400">{fmt(entry.createdAt)}</span>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">{entry.text}</p>
      {entry.approved !== null && (
        <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${entry.approved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
          {entry.approved ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {entry.approved ? "Approved" : "Awaiting approval"}
        </span>
      )}
    </div>
  );
}

function CASTab({ record }: { record: CoreRecord }) {
  const [state, action] = useActionState(addCASReflection, undefined);
  const hours = {
    CREATIVITY: record?.creativityHours ?? 0,
    ACTIVITY: record?.activityHours ?? 0,
    SERVICE: record?.serviceHours ?? 0,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {CAS_STRANDS.map((s) => (
          <div key={s.value} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{s.label}</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{hours[s.value]}<span className="text-xs font-medium text-slate-400">/{CAS_STRAND_TARGET_HOURS}h</span></p>
          </div>
        ))}
      </div>

      <form action={action} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Log an activity</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="cas-strand">Strand</label>
            <select id="cas-strand" name="strand" required defaultValue="" className={field}>
              <option value="" disabled>Choose one</option>
              {CAS_STRANDS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="cas-hours">Hours</label>
            <input id="cas-hours" name="hours" type="number" min={1} max={100} required className={field} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="cas-text">Reflection</label>
          <textarea id="cas-text" name="text" rows={3} required placeholder="What did you do, and what did you learn from it?" className={field} />
        </div>
        <FormFeedback state={state} />
        <SubmitButton pendingText="Saving…">Log reflection</SubmitButton>
      </form>

      <div className="space-y-2.5">
        {(record?.entries ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No CAS activity logged yet.</p>
        ) : (
          [...(record?.entries ?? [])].reverse().map((e) => <EntryRow key={e.id} entry={e} />)
        )}
      </div>
    </div>
  );
}

function JournalTab({ element, record }: { element: "EE" | "TOK"; record: CoreRecord }) {
  const [state, action] = useActionState(addCoreJournalEntry, undefined);
  const copy = element === "EE"
    ? { formTitle: "Add a milestone", placeholder: "What progress have you made on your Extended Essay?", cta: "Add milestone", titleLabel: "Essay title" }
    : { formTitle: "Add a journal entry", placeholder: "Progress on your TOK exhibition or essay…", cta: "Add entry", titleLabel: "TOK theme (optional)" };

  return (
    <div className="space-y-5">
      {record && (record.status !== "IN_PROGRESS" || record.grade) && (
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{record.status.replace(/_/g, " ")}</span>
          {record.grade && <span className="text-sm text-slate-500 ml-auto">Grade: <b>{record.grade}</b></span>}
        </div>
      )}

      <form action={action} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{copy.formTitle}</h3>
        <input type="hidden" name="element" value={element} />
        <div>
          <label className={label} htmlFor={`${element}-title`}>{copy.titleLabel}</label>
          <input id={`${element}-title`} name="title" defaultValue={record?.title ?? ""} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`${element}-text`}>Entry</label>
          <textarea id={`${element}-text`} name="text" rows={3} required placeholder={copy.placeholder} className={field} />
        </div>
        <FormFeedback state={state} />
        <SubmitButton pendingText="Saving…">{copy.cta}</SubmitButton>
      </form>

      <div className="space-y-2.5">
        {(record?.entries ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Nothing logged yet.</p>
        ) : (
          [...(record?.entries ?? [])].reverse().map((e) => <EntryRow key={e.id} entry={e} />)
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: "CAS" as const, icon: Sparkles },
  { key: "EE" as const, icon: BookOpen },
  { key: "TOK" as const, icon: Brain },
];

export default function IBCoreClient({ byElement }: { byElement: Record<string, CoreRecord> }) {
  const [tab, setTab] = useState<IBCoreElement>("CAS");

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <t.icon size={15} /> {t.key}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 -mt-2">{IB_CORE_ELEMENT_LABELS[tab]}</p>

      {tab === "CAS" && <CASTab record={byElement.CAS} />}
      {tab === "EE" && <JournalTab element="EE" record={byElement.EE} />}
      {tab === "TOK" && <JournalTab element="TOK" record={byElement.TOK} />}
    </div>
  );
}
