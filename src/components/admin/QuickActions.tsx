"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, CalendarPlus, Megaphone, Receipt,
  ShieldAlert, Upload, UserPlus, Users, UserCog, type LucideIcon,
} from "lucide-react";
import { onboardTeacher, createAnnouncement } from "@/app/(portals)/admin/actions";
import { FORCE_PASSWORD_RESET } from "@/lib/demo";
import FormModal from "@/components/ui/FormModal";
import type { ActionState } from "@/components/ui/form";

/**
 * Quick Actions — the things the office starts from the front door.
 *
 * Previously two: onboard a teacher, and send an announcement. Both are short
 * enough to finish inside a dialog, which is why they are dialogs. Everything
 * else the office begins from this screen already has a page of its own, and
 * the most-used of them — registering a student — was reachable only by opening
 * Students and then finding Register inside it.
 *
 * So the panel now holds both kinds, and the distinction is deliberate rather
 * than incidental: a dialog when the whole job fits in three fields, a link when
 * the job has a real form behind it. Registering a student asks for about thirty
 * fields across five sections; reproducing that in a modal would be a worse copy
 * of a page that already exists.
 *
 * Nothing here is offered to somebody who cannot open it. A Principal's sidebar
 * is Overview, Academics and People — no Finance, no Operations, no user
 * administration — so the two admin-only tiles are filtered out rather than
 * left to fail with a redirect to the landing page.
 */

const field =
  "mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg " +
  "px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-slate-100";
const label = "text-sm font-medium text-slate-700 dark:text-slate-300";

const tile =
  "w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow group";

/**
 * `onboardTeacher` predates the shared ActionState convention and returns
 * `{ success: true }`. Wrapping it here keeps FormModal's contract — pending
 * state, a message, close only on success — without changing the action's
 * signature for its other caller.
 */
async function onboardTeacherWithMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const res = await onboardTeacher(formData);
  if (res && "error" in res && res.error) return { error: res.error };
  const who = String(formData.get("name") ?? "The teacher");
  const temp = res && "tempPassword" in res ? res.tempPassword : undefined;
  // The dialog is told to stay open (keepOpenOnSuccess) precisely so this can
  // be read and written down. It is shown once and stored nowhere.
  return {
    success: temp
      ? `${who} now has a portal account. One-time password: ${temp} — write it down now, it is not shown again. They will be asked to choose their own on first sign-in.`
      : `${who} now has a portal account.`,
  };
}

interface ActionLink {
  href: string;
  icon: LucideIcon;
  title: string;
  line: string;
  /** Colour family, matched to the two dialog tiles above. */
  tone: keyof typeof TONES;
  /** Hidden from a Principal, whose sidebar does not carry the section. */
  adminOnly?: boolean;
}

const TONES = {
  emerald: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:hover:bg-emerald-900/40 dark:text-emerald-300",
  sky: "bg-sky-50 border-sky-100 hover:bg-sky-100 hover:border-sky-200 text-sky-700 dark:bg-sky-900/20 dark:border-sky-900/30 dark:hover:bg-sky-900/40 dark:text-sky-300",
  rose: "bg-rose-50 border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-900/30 dark:hover:bg-rose-900/40 dark:text-rose-300",
  amber: "bg-amber-50 border-amber-100 hover:bg-amber-100 hover:border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-900/30 dark:hover:bg-amber-900/40 dark:text-amber-300",
  slate: "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 dark:bg-slate-800/40 dark:border-slate-700/50 dark:hover:bg-slate-800 dark:text-slate-300",
} as const;

const LINKS: ActionLink[] = [
  {
    href: "/admin/students/register",
    icon: UserPlus,
    title: "Register New Student",
    line: "Admission form — personal, contact, guardian and academic details.",
    tone: "emerald",
  },
  {
    href: "/admin/students/import",
    icon: Upload,
    title: "Bulk Import",
    line: "Enrol a whole year group from a spreadsheet.",
    tone: "sky",
  },
  {
    href: "/admin/behavior",
    icon: ShieldAlert,
    title: "Record an Incident",
    line: "Log a behaviour or safeguarding record against a student.",
    tone: "rose",
  },
  {
    href: "/admin/academic-setup/calendar",
    icon: CalendarPlus,
    title: "Add a Calendar Event",
    line: "Term dates, holidays, IB exam windows.",
    tone: "amber",
  },
  {
    href: "/admin/fees",
    icon: Receipt,
    title: "Generate Fee Invoices",
    line: "Raise this term's invoices from the fee schedule.",
    tone: "slate",
    adminOnly: true,
  },
  {
    href: "/admin/users",
    icon: UserCog,
    title: "Manage Accounts",
    line: "Reset a login, change a role, deactivate a user.",
    tone: "slate",
    adminOnly: true,
  },
];

export default function QuickActions({ isPrincipal = false }: { isPrincipal?: boolean }) {
  const [audienceTouched, setAudienceTouched] = useState(false);
  const links = LINKS.filter((l) => !(l.adminOnly && isPrincipal));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-2">
      <FormModal
        title="Onboard Teacher"
        description="Creates the staff record and a portal login."
        buttonText="Onboard New Teacher"
        buttonIcon={<Users className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden />}
        buttonClassName={`${tile} bg-purple-50 border-purple-100 hover:bg-purple-100 hover:border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-900/30 dark:hover:bg-purple-900/40 dark:text-purple-300 flex-row-reverse justify-between`}
        submitLabel="Create teacher profile"
        pendingLabel="Creating…"
        action={onboardTeacherWithMessage}
        keepOpenOnSuccess={FORCE_PASSWORD_RESET}
      >
        <div>
          <label className={label} htmlFor="ot-name">Full name</label>
          <input id="ot-name" required name="name" type="text" placeholder="Anita Sharma" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ot-email">Email address</label>
          <input id="ot-email" required name="email" type="email" placeholder="anita.sharma@edusphere.com" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ot-subjects">Subjects</label>
          <input id="ot-subjects" required name="subjects" type="text" placeholder="Mathematics, Physics" className={field} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          They sign in with the school&apos;s starter password and are prompted to change it.
        </p>
      </FormModal>

      <FormModal
        title="Broadcast Announcement"
        description="Saved to the school record and delivered to each recipient's notifications."
        buttonText="School-Wide Announcement"
        buttonIcon={<AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden />}
        buttonClassName={`${tile} bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/30 dark:hover:bg-blue-900/40 dark:text-blue-300 flex-row-reverse justify-between`}
        submitLabel="Send announcement"
        pendingLabel="Sending…"
        action={createAnnouncement}
      >
        <div>
          <label className={label} htmlFor="an-title">Subject</label>
          <input id="an-title" required name="title" type="text" placeholder="Half-term closure: 20–24 October" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="an-message">Message</label>
          <textarea id="an-message" required name="message" rows={4} placeholder="Type your announcement here…" className={`${field} resize-none`} />
        </div>
        <fieldset onChange={() => setAudienceTouched(true)}>
          <legend className={label}>Send to</legend>
          {/*
            These checkboxes had no name attribute, so nothing they said ever
            left the browser. They decide the audience now.
          */}
          <div className="flex flex-wrap gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" name="notifyTeachers" defaultChecked /> Teachers
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" name="notifyParents" defaultChecked /> Parents
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" name="notifyStudents" /> Students
            </label>
          </div>
          {audienceTouched && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <Megaphone size={12} aria-hidden /> Everyone selected gets a notification in their portal.
            </p>
          )}
        </fieldset>
      </FormModal>

      {links.map((l) => (
        <Link key={l.href} href={l.href} className={`${tile} ${TONES[l.tone]}`}>
          <span className="min-w-0 text-left">
            <span className="flex items-center gap-1 font-semibold text-sm">
              {l.title}
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-70 transition-opacity" aria-hidden />
            </span>
            <span className="block text-[11px] opacity-70 mt-0.5 leading-snug">{l.line}</span>
          </span>
          <l.icon className="w-5 h-5 shrink-0 ml-3 group-hover:scale-110 transition-transform" aria-hidden />
        </Link>
      ))}
    </div>
  );
}
