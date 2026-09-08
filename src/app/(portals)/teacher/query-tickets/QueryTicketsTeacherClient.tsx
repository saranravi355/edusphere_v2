"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronDown, CheckCircle2, Clock, MessageSquareText } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { addTeacherReply, resolveTicket } from "./actions";

type Msg = { id: string; authorRole: string; text: string; createdAt: string };
type Ticket = {
  id: string;
  studentName: string;
  studentRegistrationNo: string;
  classroom: string | null;
  subject: string;
  status: string;
  updatedAt: string;
  messages: Msg[];
};

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action] = useActionState(addTeacherReply, undefined);
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isOpen = ticket.status === "OPEN";

  const markResolved = () => {
    startTransition(async () => {
      await resolveTicket(ticket.id);
      router.refresh();
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <User size={17} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{ticket.subject}</p>
            <p className="text-[11px] text-slate-400">
              {ticket.studentName} · {ticket.classroom ?? "—"} · {fmt(ticket.updatedAt)}
            </p>
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
            const fromTeacher = m.authorRole === "TEACHER";
            return (
              <div key={m.id} className={`rounded-xl border p-3 text-sm ${fromTeacher ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-zinc-800"}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-500">{fromTeacher ? "You" : ticket.studentName}</span>
                  <span className="text-[11px] text-slate-400">{fmt(m.createdAt)}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{m.text}</p>
              </div>
            );
          })}
          <ReplyForm ticketId={ticket.id} />
          {isOpen && (
            <button
              onClick={markResolved}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-60"
            >
              <CheckCircle2 size={13} /> Mark resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function QueryTicketsTeacherClient({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
        <MessageSquareText className="mx-auto mb-2 text-slate-400" size={28} />
        No tickets from students yet.
      </div>
    );
  }

  const openCount = tickets.filter((t) => t.status === "OPEN").length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">{openCount} open of {tickets.length} total</p>
      {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
    </div>
  );
}
