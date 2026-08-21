import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import VisitModal from "./VisitModal";
import { Activity, Thermometer, Pill } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatDate, formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Health & Clinic.
 *
 * The "Log New Visit" dialog wrote nothing — see actions.ts. Of the four tiles,
 * "Total Visits" counted only the twenty rows this page happens to load, and
 * "Fever" and "12 Medications Administered" were literals. All four are
 * computed now, and the page has the session guard it was missing.
 */
export default async function ClinicPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [visits, totalVisits, students, byReason, treatedThisMonth] = await Promise.all([
    prisma.clinicVisit.findMany({
      include: { student: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.clinicVisit.count(),
    prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, name: true, allergies: true, classroom: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.clinicVisit.groupBy({
      by: ["reason"],
      _count: { _all: true },
      orderBy: { _count: { reason: "desc" } },
      take: 1,
    }),
    // "Medication administered" is anything where the treatment was not
    // explicitly nothing — the schema has no medication table to be exact with.
    prisma.clinicVisit.count({
      where: { date: { gte: monthStart }, NOT: { treatment: { in: ["", "None", "none", "-"] } } },
    }),
  ]);

  const exportRows = visits.map((v) => ({
    Student: v.student.name,
    Reason: v.reason,
    Treatment: v.treatment,
    Notes: v.notes ?? "",
    Date: formatDate(v.date, "ddmmyyyy"),
  }));

  const commonest = byReason[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Health & Clinic"
        description="School nurse digital logbook and medical records."
        action={<ExportButton rows={exportRows} filename="clinic-visits" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col">
          <Activity className="text-red-500 mb-2" size={24} aria-hidden />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">{totalVisits}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visits logged, all time</p>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <Thermometer className="text-orange-500 mb-2" size={24} aria-hidden />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white truncate" title={commonest?.reason}>
            {commonest?.reason ?? "—"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {commonest ? `Most common reason (${commonest._count._all} visits)` : "No visits yet"}
          </p>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <Pill className="text-blue-500 mb-2" size={24} aria-hidden />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">{treatedThisMonth}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Treatments given this month</p>
        </div>
        <div className="glass-card p-6 flex items-center justify-center">
          <VisitModal
            students={students.map((s) => ({
              id: s.id,
              name: s.name,
              classroom: s.classroom?.name ?? "Unassigned",
              allergies: s.allergies,
            }))}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Recent Clinic Log</h2>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-ui-border dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Date &amp; Time</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Reason for Visit</th>
              <th className="px-6 py-4">Treatment</th>
              <th className="px-6 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border dark:divide-slate-800">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No clinic visits logged yet.</td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatDate(visit.date, "dMonYy")} · {formatTime(visit.date)}
                  </td>
                  <td className="px-6 py-4 font-bold text-navy-900 dark:text-slate-200">{visit.student.name}</td>
                  <td className="px-6 py-4 text-red-600 dark:text-red-400 font-medium">{visit.reason}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{visit.treatment}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic text-xs">{visit.notes || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
