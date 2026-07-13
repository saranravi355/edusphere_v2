import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LearningNeedsClient from "./LearningNeedsClient";

export const dynamic = "force-dynamic";

export default async function LearningNeedsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const [plans, students, teachers] = await Promise.all([
    prisma.iEPPlan.findMany({
      include: {
        student: { include: { classroom: true } },
        caseManager: { include: { user: true } },
        goals: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, name: true, registrationNo: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Learning Needs & IEP"
        description="Flag students with special educational needs, track individualised goals and classroom accommodations."
      />
      <LearningNeedsClient
        plans={JSON.parse(JSON.stringify(plans))}
        students={students}
        teachers={teachers.map((t) => ({ id: t.id, name: t.user?.name || "Unnamed" }))}
      />
    </div>
  );
}
