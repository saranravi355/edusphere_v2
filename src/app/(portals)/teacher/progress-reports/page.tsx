import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { FileText, Plus, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Only the homeroom (class) teacher of a PYP student writes their progress
 * report — it speaks in the homeroom teacher's voice across every subject,
 * not just the ones a given subject teacher personally observes.
 */
export default async function TeacherProgressReportsPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: {
      classes: {
        select: {
          id: true,
          name: true,
          students: {
            where: { curriculum: "PYP" },
            select: {
              id: true,
              name: true,
              registrationNo: true,
              academicYear: true,
              progressReports: { select: { id: true, term: true, academicYear: true, status: true }, orderBy: { createdAt: "desc" } },
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });
  if (!teacher) redirect("/teacher");

  const students = teacher.classes.flatMap((c) => c.students.map((s) => ({ ...s, classroom: c.name })));

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Progress Reports"
        description="Write and generate PYP progress reports for the PYP students in your homeroom class."
      />

      {students.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
          <FileText className="mx-auto mb-2 text-slate-400" size={28} />
          No PYP students found in the class you are homeroom teacher for.
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={s.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{s.name}</p>
                  <p className="text-[11px] text-slate-400">{s.classroom} · {s.registrationNo}</p>
                </div>
                <Link
                  href={`/teacher/progress-reports/new?studentId=${s.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                >
                  <Plus size={13} /> New report
                </Link>
              </div>
              {s.progressReports.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
                  {s.progressReports.map((r) => (
                    <Link
                      key={r.id}
                      href={`/teacher/progress-reports/${r.id}`}
                      className="flex items-center justify-between gap-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg px-2 py-1.5 -mx-2"
                    >
                      <span className="text-slate-600 dark:text-slate-300">{r.term} · {r.academicYear}</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${r.status === "GENERATED" ? "text-emerald-600" : "text-amber-600"}`}>
                        {r.status === "GENERATED" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {r.status === "GENERATED" ? "Generated" : "Draft"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
