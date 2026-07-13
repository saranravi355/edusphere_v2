import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CASClient from "./CASClient";

export const dynamic = "force-dynamic";

const TARGET_PER_STRAND = 50; // school benchmark hours per strand over the DP
const REFLECTION_TARGET = 15;

export default async function CASCoordinatorPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const casRecords = await prisma.iBCoreRecord.findMany({
    where: { element: "CAS" },
    include: {
      student: {
        select: { id: true, name: true, registrationNo: true, curriculum: true, classroom: { select: { name: true } } },
      },
    },
  });

  const rows = casRecords
    .filter((r) => r.student.curriculum === "DP")
    .map((r) => {
      const total = r.creativityHours + r.activityHours + r.serviceHours;
      const strandsActive = [r.creativityHours, r.activityHours, r.serviceHours].filter((h) => h > 0).length;
      const status =
        total >= TARGET_PER_STRAND * 3 && r.reflections >= REFLECTION_TARGET
          ? "COMPLETE"
          : strandsActive === 3 && total >= 60
          ? "ON_TRACK"
          : "NEEDS_ATTENTION";
      return {
        id: r.id,
        studentId: r.student.id,
        name: r.student.name,
        registrationNo: r.student.registrationNo,
        classroom: r.student.classroom?.name || null,
        creativity: r.creativityHours,
        activity: r.activityHours,
        service: r.serviceHours,
        reflections: r.reflections,
        total,
        status,
      };
    })
    .sort((a, b) => a.total - b.total);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="CAS Coordinator"
        description="Creativity, Activity, Service across the DP cohort — strand balance, reflections, and one-tap nudges. CAS is required for the diploma but carries no points."
      />
      <CASClient rows={rows} strandTarget={TARGET_PER_STRAND} reflectionTarget={REFLECTION_TARGET} />
    </div>
  );
}
