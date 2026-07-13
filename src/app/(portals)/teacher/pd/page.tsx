import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import PDClient from "./PDClient";

export const dynamic = "force-dynamic";

const CPD_TARGET = 30; // annual CPD hour target

export default async function TeacherPDPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      pdRecords: { orderBy: { dateCompleted: "desc" } },
      observations: { orderBy: { date: "desc" }, take: 5 },
    },
  });

  if (!teacher) redirect("/teacher");

  const records = teacher.pdRecords.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    provider: r.provider,
    hours: r.hours,
    dateCompleted: r.dateCompleted.toISOString(),
    notes: r.notes,
  }));

  const observations = teacher.observations.map((o) => ({
    id: o.id,
    date: o.date.toISOString(),
    observerName: o.observerName,
    className: o.className,
    focusArea: o.focusArea,
    avg: (o.planningScore + o.deliveryScore + o.engagementScore + o.assessmentScore) / 4,
    strengths: o.strengths,
    growthAreas: o.growthAreas,
  }));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Professional Development"
        description="Log CPD activities, track your hours against the annual target, and review observation feedback."
      />
      <PDClient
        records={records}
        observations={observations}
        baseHours={teacher.cpdHours}
        target={CPD_TARGET}
      />
    </div>
  );
}
