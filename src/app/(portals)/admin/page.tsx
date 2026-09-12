import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";
import QuickActions from "@/components/admin/QuickActions";
import AIFeatureLink from "@/components/ai/AIFeatureLink";
import { openCounts, waitingItems } from "@/lib/overview";
import { firstName } from "@/lib/utils";
import {
  Activity, ArrowRight, CheckCircle2, HeartHandshake, HeartPulse,
  Sparkles, TrendingUp,
} from "lucide-react";

/**
 * Dashboard — the front door.
 *
 * This page had drifted into being a third copy of the same numbers. Directly
 * above its own cards, SchoolSnapshot was already rendering students, today's
 * attendance, active incidents, teaching staff and pending leave; the page then
 * drew an attendance card, a students-and-teachers card and a staff leave queue
 * underneath, and listed recent behaviour incidents next to a Live Operations
 * page whose entire job is exactly that list. Four screens in Overview and no
 * two of them had a job the others did not.
 *
 * The division of labour now, written down in lib/overview.ts and honoured here:
 *
 *   Dashboard  — the front door. Counts and doors. Never a list of names.
 *   Live Ops   — today's work. Queues and exceptions. Never a time axis.
 *   Analytics  — the shape of the term. Trends and distributions. Never a queue.
 *
 * So what is left here is what a front door is for: the headline numbers once,
 * how much is waiting and the way in to it, the handful of things the office
 * starts from this screen, and a plain statement of which of the other three
 * pages answers which question — because a sidebar that lists Dashboard, Live
 * Ops, Analytics and AI Insights explains none of that on its own.
 *
 * The counts come from lib/overview.ts, the same module Live Operations reads,
 * so the front door cannot advertise a number the page behind it disagrees with.
 */

export const dynamic = "force-dynamic";

const TONES: Record<string, string> = {
  rose: "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300",
  amber: "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300",
};

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PRINCIPAL")) {
    redirect("/");
  }
  const isPrincipal = session.user.role === "PRINCIPAL";
  const waiting = waitingItems(await openCounts(), session.user.role);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Welcome back, ${firstName(session.user.name, "Admin")}`}
        description={
          isPrincipal
            ? "Where the school stands, and what is waiting for you. Today's registers and approvals are in Live Operations; the term's trends are in School Analytics."
            : "Where the school stands, and what is waiting for you. Today's queues are in Live Operations; the term's trends are in School Analytics."
        }
      />

      <SchoolSnapshot />

      {/* Waiting on someone — counts and a way in, never the list itself.
          The list is Live Operations' job and it does it better. */}
      <section>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Waiting on you</h2>
        {waiting.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-5">
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Nothing is outstanding.</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                Every register is taken, no approvals are pending, and nothing is overdue.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {waiting.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:brightness-95 dark:hover:brightness-125 ${TONES[q.tone]}`}
              >
                <span className="text-3xl font-black tabular-nums leading-none">{q.n}</span>
                <span className="text-xs font-medium leading-snug flex-1">{q.label}</span>
                <ArrowRight size={15} className="shrink-0 opacity-60" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions run the full width: there are now seven of them, and in a
          third-column sidebar they became a single tall stack you had to scroll. */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActions isPrincipal={isPrincipal} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Where to go next. Four entries under "Overview" and nothing in the
              product ever said how they differ — so this does, in one line each. */}
          <Card>
            <CardHeader>
              <CardTitle>Where to look next</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  href: "/admin/live",
                  icon: Activity,
                  title: "Live Operations",
                  line: "Today. Registers not taken, absences, approvals, anything overdue.",
                  tone: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
                },
                {
                  href: "/admin/analytics",
                  icon: TrendingUp,
                  title: "School Analytics",
                  line: "This term. Attendance trends, IB attainment, collection, behaviour.",
                  tone: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
                },
                {
                  href: "/admin/ai-insights",
                  icon: Sparkles,
                  title: "AI Insights",
                  line: "The full index of predictive tools, each also linked from its own page.",
                  tone: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
                },
              ].map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${d.tone}`}>
                    <d.icon size={17} aria-hidden />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{d.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{d.line}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AIFeatureLink
              href="/admin/ai-insights/school-health-score"
              icon={<HeartPulse size={15} />}
              title="School Health Score"
              description="Composite KPI across academics, attendance, staff and finance."
            />
            <AIFeatureLink
              href="/admin/ai-insights/parent-engagement"
              icon={<HeartHandshake size={15} />}
              title="Parent Engagement Score"
              description="Scores family engagement across portal, events and messaging."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
