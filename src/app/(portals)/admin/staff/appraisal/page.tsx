import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AppraisalClient from "./AppraisalClient";

export const dynamic = "force-dynamic";

export default async function StaffAppraisalPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { name: true, email: true } },
      pdRecords: { orderBy: { dateCompleted: "desc" } },
      observations: { orderBy: { date: "desc" } },
    },
  });

  const rows = teachers.map((t) => {
    const obs = t.observations;
    const avg =
      obs.length > 0
        ? obs.reduce(
            (sum, o) => sum + (o.planningScore + o.deliveryScore + o.engagementScore + o.assessmentScore) / 4,
            0
          ) / obs.length
        : null;
    return {
      id: t.id,
      name: t.user?.name || "Unnamed",
      subjects: t.subjects,
      cpdHours: t.pdRecords.reduce((n, r) => n + r.hours, 0) + t.cpdHours,
      pdCount: t.pdRecords.length,
      obsCount: obs.length,
      avgScore: avg,
      lastObservation: obs[0]
        ? {
            date: obs[0].date.toISOString(),
            observerName: obs[0].observerName,
            focusArea: obs[0].focusArea,
            planningScore: obs[0].planningScore,
            deliveryScore: obs[0].deliveryScore,
            engagementScore: obs[0].engagementScore,
            assessmentScore: obs[0].assessmentScore,
            strengths: obs[0].strengths,
            growthAreas: obs[0].growthAreas,
          }
        : null,
    };
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="PD & Appraisal"
        description="Track CPD hours, run classroom observations on the IB 1–7 scale, and spot coaching opportunities."
      />
      <AppraisalClient rows={rows} observerName={session.user.name || "Principal"} />
    </div>
  );
}
