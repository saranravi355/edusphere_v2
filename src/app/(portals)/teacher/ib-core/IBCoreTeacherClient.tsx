"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, User, CheckCircle2, Clock, MessageSquareText, Send } from "lucide-react";
import { addSupervisorComment, approveCASEntry, updateCoreStatus } from "./actions";
import { IB_CORE_ELEMENTS, casStrandLabel } from "@/lib/ib";

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
type StudentRow = {
  id: string;
  name: string;
  registrationNo: string;
  classroom: string | null;
  byElement: Record<string, CoreRecord>;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });
}

function ElementPanel({ record, element }: { record: CoreRecord; element: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(record?.status ?? "IN_PROGRESS");
  const [grade, setGrade] = useState(record?.grade ?? "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (!record) {
    return <p className="text-sm text-slate-400 py-3">No {element} activity yet.</p>;
  }

  const submitComment = () => {
    if (!comment.trim()) return;
    startTransition(async () => {
      const res = await addSupervisorComment(record.id, comment);
      setMsg(res.error ?? "Comment sent.");
      if (!res.error) {
        setComment("");
        router.refresh();
      }
    });
  };

  const approve = (entryId: string) => {
    startTransition(async () => {
      await approveCASEntry(entryId);
      router.refresh();
    });
  };

  const saveStatus = () => {
    startTransition(async () => {
      const res = await updateCoreStatus(record.id, status, grade);
      setMsg(res.error ?? "Updated.");
      if (!res.error) router.refresh();
    });
  };

  return (
    <div className="space-y-3 py-3">
      {element !== "CAS" && (
        <div className="flex items-center gap-2 flex-wrap">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-xs p-1.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black">
            {["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "COMPLETE"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade (A-E)" className="text-xs p-1.5 w-24 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black" />
          <button onClick={saveStatus} disabled={pending} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-60">Save</button>
        </div>
      )}

      {element === "CAS" && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 p-2"><b>{record.creativityHours}h</b><br />Creativity</div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 p-2"><b>{record.activityHours}h</b><br />Activity</div>
          <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 p-2"><b>{record.serviceHours}h</b><br />Service</div>
        </div>
      )}

      <div className="space-y-2">
        {record.entries.length === 0 ? (
          <p className="text-xs text-slate-400">No entries yet.</p>
        ) : (
          [...record.entries].reverse().map((e) => (
            <div key={e.id} className={`rounded-lg border p-2.5 text-xs ${e.authorRole === "TEACHER" ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-zinc-800"}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-slate-500">
                  {e.authorRole === "TEACHER" ? "You" : "Student"}{e.strand ? ` · ${casStrandLabel(e.strand)}` : ""}{e.hours ? ` · ${e.hours}h` : ""}
                </span>
                <span className="text-slate-400">{fmt(e.createdAt)}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{e.text}</p>
              {e.kind === "REFLECTION" && e.strand && (
                e.approved ? (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-600"><CheckCircle2 size={11} /> Approved</span>
                ) : (
                  <button onClick={() => approve(e.id)} disabled={pending} className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-600 hover:underline disabled:opacity-60">
                    <Clock size={11} /> Approve
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a supervisor comment…"
          className="flex-1 text-xs p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black"
        />
        <button onClick={submitComment} disabled={pending || !comment.trim()} className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
          <Send size={13} />
        </button>
      </div>
      {msg && <p className="text-[11px] text-slate-400">{msg}</p>}
    </div>
  );
}

function StudentCard({ row }: { row: StudentRow }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<string>("CAS");

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <User size={17} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{row.name}</p>
            <p className="text-[11px] text-slate-400">{row.classroom ?? "—"} · {row.registrationNo}</p>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex gap-1 pt-3">
            {IB_CORE_ELEMENTS.map((el) => (
              <button
                key={el}
                onClick={() => setTab(el)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${tab === el ? "bg-slate-800 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500"}`}
              >
                {el}
              </button>
            ))}
          </div>
          <ElementPanel record={row.byElement[tab]} element={tab} />
        </div>
      )}
    </div>
  );
}

export default function IBCoreTeacherClient({ students }: { students: StudentRow[] }) {
  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
        <MessageSquareText className="mx-auto mb-2 text-slate-400" size={28} />
        No DP students found among the classes you teach.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((row) => <StudentCard key={row.id} row={row} />)}
    </div>
  );
}
