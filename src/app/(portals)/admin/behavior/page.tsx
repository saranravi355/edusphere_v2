import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import IncidentModal from "./IncidentModal";
import { ShieldAlert, ThumbsUp, ThumbsDown } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Behaviour & Disciplinary.
 *
 * Three things were wrong here. The page had no session or role check at all —
 * the only route in the portal without one. The "Log Incident" dialog had no
 * form behind it: its Save came from the generic Modal and popped
 * "Data successfully submitted!" without writing anything, and its student
 * dropdown offered two children who do not attend this school. And the three
 * headline figures — 1,245 merits, 82 demerits, 14 detentions — were literals
 * sitting directly above a table of the real incidents.
 */
export default async function BehaviorPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [incidents, students, teachers, monthByType, concerning] = await Promise.all([
    prisma.behaviorIncident.findMany({
      include: { student: { select: { name: true } }, teacher: { select: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, name: true, classroom: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    // Grouped by type rather than by the sign of `points`, because the seeded
    // rows disagree about whether a demerit is stored negative.
    prisma.behaviorIncident.groupBy({
      by: ["type"],
      where: { date: { gte: monthStart } },
      _count: { _all: true },
      _sum: { points: true },
    }),
    prisma.behaviorIncident.groupBy({
      by: ["studentId"],
      where: { type: "DEMERIT" },
      _count: { _all: true },
    }),
  ]);

  const merit = monthByType.find((r) => r.type === "MERIT");
  const demerit = monthByType.find((r) => r.type === "DEMERIT");
  const needsReview = concerning.filter((c) => c._count._all >= 3).length;

  const exportRows = incidents.map((i) => ({
    Student: i.student.name,
    Type: i.type,
    Category: i.category,
    Description: i.description,
    Points: i.points,
    Teacher: i.teacher?.user?.name ?? "",
    Date: formatDate(i.date, "ddmmyyyy"),
  }));

  const stats = [
    {
      label: "Merits this month",
      value: merit?._count._all ?? 0,
      sub: `${Math.abs(merit?._sum.points ?? 0)} points awarded`,
      icon: ThumbsUp,
      tone: "border-l-semantic-success dark:border-l-green-500",
      chip: "bg-green-100 dark:bg-green-900/30 text-semantic-success dark:text-green-400",
    },
    {
      label: "Demerits this month",
      value: demerit?._count._all ?? 0,
      sub: `${Math.abs(demerit?._sum.points ?? 0)} points deducted`,
      icon: ThumbsDown,
      tone: "border-l-semantic-error dark:border-l-red-500",
      chip: "bg-red-100 dark:bg-red-900/30 text-semantic-error dark:text-red-400",
    },
    {
      // There is no detention model, so this counts what the data can actually
      // answer rather than inventing a number.
      label: "Students on 3+ demerits",
      value: needsReview,
      sub: "all time — worth a conversation",
      icon: ShieldAlert,
      tone: "border-l-semantic-warning dark:border-l-yellow-500",
      chip: "bg-yellow-100 dark:bg-yellow-900/30 text-semantic-warning dark:text-yellow-400",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Behaviour & Disciplinary"
        description="Manage merits, demerits, and student conduct."
        action={<ExportButton rows={exportRows} filename="behavior-incidents" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className={`glass-card p-6 flex items-center gap-4 border-l-4 ${s.tone}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.chip}`}>
              <s.icon size={24} aria-hidden />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              <h3 className="text-2xl font-bold text-navy-900 dark:text-white">{s.value}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 flex flex-wrap gap-3 justify-between items-center bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Recent Incidents</h2>
          <IncidentModal
            students={students.map((s) => ({ id: s.id, name: s.name, classroom: s.classroom?.name ?? "Unassigned" }))}
            teachers={teachers.map((t) => ({ id: t.id, name: t.user.name }))}
          />
        </div>

        <div className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4">Reported By</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border dark:divide-slate-800">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No incidents logged yet. Use “Log Incident” to record the first one.
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-navy-900 dark:text-slate-200">{incident.student.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${incident.type === "MERIT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {incident.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{incident.category}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{incident.description}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {Math.abs(incident.points)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{incident.teacher.user.name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(incident.date, "dMonYy")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
