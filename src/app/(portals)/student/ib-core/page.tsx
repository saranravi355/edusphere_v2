import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import IBCoreClient from "./IBCoreClient";
import { IB_CORE_ELEMENTS } from "@/lib/ib";

export const dynamic = "force-dynamic";

export default async function StudentIBCorePage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, curriculum: true },
  });
  if (!student) redirect("/student");

  if (student.curriculum !== "DP") {
    return (
      <div className="space-y-6 pb-12 max-w-3xl mx-auto">
        <PageHeader title="IB Core" description="Creativity, Activity, Service · Extended Essay · Theory of Knowledge" />
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
          The Diploma core (CAS, the Extended Essay and TOK) applies to DP students. Your programme is {student.curriculum || "not set"}.
        </div>
      </div>
    );
  }

  const records = await prisma.iBCoreRecord.findMany({
    where: { studentId: student.id, element: { in: [...IB_CORE_ELEMENTS] } },
    include: { entries: { orderBy: { createdAt: "asc" } } },
  });

  const byElement = Object.fromEntries(
    IB_CORE_ELEMENTS.map((el) => {
      const r = records.find((rec) => rec.element === el);
      return [
        el,
        r
          ? {
              id: r.id,
              title: r.title,
              status: r.status,
              grade: r.grade,
              creativityHours: r.creativityHours,
              activityHours: r.activityHours,
              serviceHours: r.serviceHours,
              entries: r.entries.map((e) => ({
                id: e.id,
                authorRole: e.authorRole,
                kind: e.kind,
                strand: e.strand,
                hours: e.hours,
                text: e.text,
                approved: e.approved,
                createdAt: e.createdAt.toISOString(),
              })),
            }
          : null,
      ];
    })
  );

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <PageHeader title="IB Core" description="Creativity, Activity, Service · Extended Essay · Theory of Knowledge" />
      <IBCoreClient byElement={byElement} />
    </div>
  );
}
