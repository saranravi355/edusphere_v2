import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { FileText, Download, Clock, User } from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

export default async function ParentProgressReportPage() {
  const session = await getSession();
  if (!session || session.user.role !== "PARENT") redirect("/");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    select: {
      students: {
        select: {
          id: true,
          name: true,
          progressReports: {
            orderBy: [{ academicYear: "desc" }, { term: "desc" }],
            select: { id: true, term: true, academicYear: true, grade: true, status: true, pdfUrl: true, generatedAt: true },
          },
        },
      },
    },
  });
  if (!parent) redirect("/parent");

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <PageHeader title="Progress Reports" description="Published PYP progress reports for your children." />

      {parent.students.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
          No children linked to your account yet.
        </div>
      ) : (
        parent.students.map((s) => (
          <div key={s.id} className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><User size={14} /> {s.name}</h3>
            {s.progressReports.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-6 text-center text-slate-500 text-sm">
                <FileText className="mx-auto mb-2 text-slate-400" size={22} />
                No progress reports published yet.
              </div>
            ) : (
              s.progressReports.map((r) => (
                <div key={r.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{r.term} — {r.academicYear}</p>
                    <p className="text-[11px] text-slate-400">
                      {r.grade ? `${r.grade} · ` : ""}
                      {r.status === "GENERATED" && r.generatedAt ? `Published ${fmt(r.generatedAt)}` : "Not yet published"}
                    </p>
                  </div>
                  {r.status === "GENERATED" && r.pdfUrl ? (
                    <a
                      href={r.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                    >
                      <Download size={13} /> View / Download
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                      <Clock size={13} /> In progress
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}
