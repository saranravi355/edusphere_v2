"use client";

import { useActionState, useState } from "react";
import { User, Plus, ChevronDown, CheckCircle2, Clock, MessageSquareText } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { raiseTicket, addStudentReply } from "./actions";

type Teacher = { id: string; name: string; subject: string | null };
type Msg = { id: string; authorRole: string; text: string; createdAt: string };
type Ticket = { id: string; teacherName: string; subject: string; status: string; updatedAt: string; messages: Msg[] };

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
const label = "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function NewTicketForm({ teachers }: { teachers: Teacher[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(raiseTicket, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 py-4 text-sm font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus size={16} /> Raise a new ticket
      </button>
    );
  }

  return (
    <form action={action} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Raise a new ticket</h3>
      <div>
        <label className={label} htmlFor="qt-teacher">Teacher</label>
        <select id="qt-teacher" name="teacherId" required defaultValue="" className={field}>
          <option value="" disabled>Choose a teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="qt-subject">Subject</label>
        <input id="qt-subject" name="subject" required maxLength={120} placeholder="e.g. Missed homework deadline" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="qt-message">Your question or issue</label>
        <textarea id="qt-message" name="message" rows={4} required className={field} />
      </div>
      <FormFeedback state={state} />
      <div className="flex gap-2">
        <SubmitButton pendingText="Sending…">Send ticket</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action] = useActionState(addStudentReply, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 pt-1">
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea name="text" rows={2} required placeholder="Write a reply…" className={field} />
      <FormFeedback state={state} />
      <SubmitButton size="sm" pendingText="Sending…" className="self-start">Reply</SubmitButton>
    </form>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(false);
  const isOpen = ticket.status === "OPEN";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <User size={17} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{ticket.subject}</p>
            <p className="text-[11px] text-slate-400">To {ticket.teacherName} · {fmt(ticket.updatedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
            isOpen ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          }`}>
            {isOpen ? <Clock size={11} /> : <CheckCircle2 size={11} />}
            {isOpen ? "Open" : "Resolved"}
          </span>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2.5">
          {ticket.messages.map((m) => {
            const mine = m.authorRole === "STUDENT";
            return (
              <div key={m.id} className={`rounded-xl border p-3 text-sm ${mine ? "border-slate-200 dark:border-zinc-800" : "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20"}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-500">{mine ? "You" : ticket.teacherName}</span>
                  <span className="text-[11px] text-slate-400">{fmt(m.createdAt)}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{m.text}</p>
              </div>
            );
          })}
          <ReplyForm ticketId={ticket.id} />
        </div>
      )}
    </div>
  );
}

export default function QueryTicketsClient({ teachers, tickets }: { teachers: Teacher[]; tickets: Ticket[] }) {
  return (
    <div className="space-y-4">
      <NewTicketForm teachers={teachers} />
      {tickets.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
          <MessageSquareText className="mx-auto mb-2 text-slate-400" size={28} />
          No tickets raised yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  );
}
