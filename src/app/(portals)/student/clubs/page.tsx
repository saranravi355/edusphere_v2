import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Tent, Trophy, CalendarDays, MapPin, CheckCircle2, Users, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default async function StudentClubsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { clubMemberships: { select: { clubId: true } } },
  });
  if (!student) redirect("/student");

  const myClubIds = student.clubMemberships.map((m) => m.clubId);
  const clubs = await prisma.club.findMany({
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { members: true } },
      activities: { orderBy: { date: "asc" } },
    },
  });

  const now = new Date();
  const mine = clubs.filter((c) => myClubIds.includes(c.id));
  const others = clubs.filter((c) => !myClubIds.includes(c.id));
  const upcomingMine = mine.flatMap((c) => c.activities.filter((a) => a.date >= now).map((a) => ({ ...a, clubName: c.name })));

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="My Clubs & Activities"
        description="Your club memberships, what you've taken part in, and what's coming up — great evidence for CAS reflections."
      />

      {/* Upcoming events across my clubs */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
          <CalendarDays size={15} className="text-amber-600" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Coming up for you</h3>
        </div>
        {upcomingMine.length === 0 ? (
          <p className="p-5 text-xs text-slate-400">No upcoming events in your clubs.</p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
            {upcomingMine.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{a.clubName}</span>
                    {a.location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {a.location}</span>}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{fmt(a.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My clubs with past activity record */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mine.map((club) => {
          const past = club.activities.filter((a) => a.date < now).reverse();
          return (
            <div key={club.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Tent size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{club.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Advisor: {club.teacher?.user?.name || "—"} · {club._count.members} members
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 whitespace-nowrap">MEMBER</span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Past activities</p>
                {past.length === 0 ? (
                  <p className="text-xs text-slate-400">Nothing recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {past.map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5">
                        {a.type === "COMPETITION" ? (
                          <Trophy size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 dark:text-slate-200">{a.title}</p>
                          <p className="text-[11px] text-slate-400">{fmt(a.date)}{a.outcome ? ` — ${a.outcome}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {mine.length === 0 && (
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
            <Tent className="mx-auto mb-2 text-slate-400" size={28} />
            You haven&apos;t joined any clubs yet — explore the ones below and speak to the advisor.
          </div>
        )}
      </div>

      {/* Explore other clubs */}
      {others.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" /> Explore more clubs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {others.map((club) => (
              <div key={club.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{club.name}</p>
                  <p className="text-xs text-slate-500 truncate">{club.description}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{club._count.members} members · Advisor: {club.teacher?.user?.name || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
