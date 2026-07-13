import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import RegistryClient from "./RegistryClient";

export const dynamic = "force-dynamic";

export default async function StudentRegistryPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const students = await prisma.student.findMany({
    include: {
      classroom: { select: { name: true, gradeLevel: true } },
      parent: { include: { user: { select: { name: true } } } },
      iepPlans: { where: { status: { not: "ARCHIVED" } }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows = students.map((s) => ({
    id: s.id,
    name: s.name,
    registrationNo: s.registrationNo,
    curriculum: s.curriculum,
    gender: s.gender,
    classroom: s.classroom?.name || null,
    parentName: s.parent?.user?.name || null,
    parentPhone: s.parent?.phone || null,
    enrollmentDate: s.enrollmentDate.toISOString(),
    hasIEP: s.iepPlans.length > 0 || !!s.learningNeeds,
    isActive: s.isActive,
  }));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <PageHeader
        title="Student Registry"
        description="The complete enrolment register — search, filter, and run Platform AI analyses on any cohort."
      />
      <RegistryClient rows={rows} />
    </div>
  );
}
