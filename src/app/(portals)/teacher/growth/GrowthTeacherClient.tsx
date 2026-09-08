"use client";

import { useActionState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Fingerprint, Brain, FileImage, Search } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { addLearnerProfileEvidence, addATLRecord } from "./actions";
import { LEARNER_PROFILE_ATTRIBUTES, ATL_CATEGORIES, ATL_RATING_LABELS, learnerProfileLabel, atlCategoryLabel } from "@/lib/ib";

type StudentRow = { id: string; name: string; registrationNo: string; classroom: string | null };
type Detail = {
  profileEvidence: { id: string; attribute: string; evidence: string; createdAt: string }[];
  atlRecords: { id: string; category: string; rating: number; note: string | null; createdAt: string }[];
  portfolioItems: { id: string; title: string; subject: string | null; academicYear: string | null; fileUrl: string; createdAt: string }[];
} | null;

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
const label = "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

function StudentPicker({ students, selectedId }: { students: StudentRow[]; selectedId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();

  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
        No students found among the classes you teach.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-2 max-h-[70vh] overflow-y-auto">
      {students.map((s) => (
        <button
          key={s.id}
          onClick={() => router.push(`${pathname}?studentId=${s.id}`)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
            selectedId === s.id ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-slate-50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0">
            <User size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
            <p className="text-[11px] text-slate-400">{s.classroom ?? "—"}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ProfileForm({ studentId }: { studentId: string }) {
  const [state, action] = useActionState(addLearnerProfileEvidence, undefined);
  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="studentId" value={studentId} />
      <select name="attribute" required defaultValue="" className={field}>
        <option value="" disabled>Attribute</option>
        {LEARNER_PROFILE_ATTRIBUTES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>
      <textarea name="evidence" rows={2} required placeholder="What did you observe?" className={field} />
      <FormFeedback state={state} />
      <SubmitButton size="sm" pendingText="Saving…">Record evidence</SubmitButton>
    </form>
  );
}

function ATLForm({ studentId }: { studentId: string }) {
  const [state, action] = useActionState(addATLRecord, undefined);
  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid grid-cols-2 gap-2">
        <select name="category" required defaultValue="" className={field}>
          <option value="" disabled>Skill category</option>
          {ATL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select name="rating" required defaultValue="" className={field}>
          <option value="" disabled>Rating</option>
          {[1, 2, 3, 4].map((r) => <option key={r} value={r}>{ATL_RATING_LABELS[r]}</option>)}
        </select>
      </div>
      <textarea name="note" rows={2} placeholder="Note (optional)" className={field} />
      <FormFeedback state={state} />
      <SubmitButton size="sm" pendingText="Saving…">Record rating</SubmitButton>
    </form>
  );
}

function Detail({ studentId, detail }: { studentId: string; detail: NonNullable<Detail> }) {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Fingerprint size={15} /> Learner Profile</h3>
        <ProfileForm studentId={studentId} />
        <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
          {detail.profileEvidence.length === 0 ? (
            <p className="text-xs text-slate-400">No evidence recorded yet.</p>
          ) : (
            detail.profileEvidence.map((e) => (
              <p key={e.id} className="text-xs text-slate-500 dark:text-slate-400">
                <b className="text-slate-700 dark:text-slate-200">{learnerProfileLabel(e.attribute)}</b> — {e.evidence} <span className="text-slate-400">({fmt(e.createdAt)})</span>
              </p>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Brain size={15} /> ATL Skills</h3>
        <ATLForm studentId={studentId} />
        <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
          {detail.atlRecords.length === 0 ? (
            <p className="text-xs text-slate-400">No ratings recorded yet.</p>
          ) : (
            detail.atlRecords.map((r) => (
              <p key={r.id} className="text-xs text-slate-500 dark:text-slate-400">
                <b className="text-slate-700 dark:text-slate-200">{atlCategoryLabel(r.category)}</b> — {ATL_RATING_LABELS[r.rating]}
                {r.note ? ` (${r.note})` : ""} <span className="text-slate-400">({fmt(r.createdAt)})</span>
              </p>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5 space-y-2">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><FileImage size={15} /> Portfolio</h3>
        {detail.portfolioItems.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {detail.portfolioItems.map((p) => (
              <a key={p.id} href={p.fileUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 dark:border-zinc-800 p-2.5 hover:border-slate-300 dark:hover:border-zinc-700">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{p.title}</p>
                <p className="text-[10px] text-slate-400">{p.subject ?? "—"} · {p.academicYear ?? "—"}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GrowthTeacherClient({ students, selectedId, detail }: { students: StudentRow[]; selectedId: string | null; detail: Detail }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="md:col-span-1">
        <StudentPicker students={students} selectedId={selectedId} />
      </div>
      <div className="md:col-span-2">
        {selectedId && detail ? (
          <Detail studentId={selectedId} detail={detail} />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
            <Search className="mx-auto mb-2 text-slate-400" size={24} />
            Choose a student to record or review their growth.
          </div>
        )}
      </div>
    </div>
  );
}
