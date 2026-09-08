import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import GrowthClient from "./GrowthClient";

export const dynamic = "force-dynamic";

export default async function StudentGrowthPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student) redirect("/student");

  const [profileEvidence, atlRecords] = await Promise.all([
    prisma.learnerProfileEvidence.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      include: { recordedBy: { select: { user: { select: { name: true } } } } },
    }),
    prisma.aTLSkillRecord.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      include: { recordedBy: { select: { user: { select: { name: true } } } } },
    }),
  ]);

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <PageHeader
        title="My Growth"
        description="Learner Profile evidence and Approaches to Learning skills your teachers have recorded for you."
      />
      <GrowthClient
        profileEvidence={profileEvidence.map((e) => ({
          id: e.id,
          attribute: e.attribute,
          evidence: e.evidence,
          teacherName: e.recordedBy.user.name,
          createdAt: e.createdAt.toISOString(),
        }))}
        atlRecords={atlRecords.map((r) => ({
          id: r.id,
          category: r.category,
          rating: r.rating,
          note: r.note,
          teacherName: r.recordedBy.user.name,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
