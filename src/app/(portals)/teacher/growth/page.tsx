import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import GrowthTeacherClient from "./GrowthTeacherClient";

export const dynamic = "force-dynamic";

export default async function TeacherGrowthPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: {
      classes: { select: { id: true } },
      timetable: { select: { classroomId: true } },
    },
  });
  if (!teacher) redirect("/teacher");

  const classroomIds = Array.from(new Set([...teacher.classes.map((c) => c.id), ...teacher.timetable.map((t) => t.classroomId)]));

  const students = classroomIds.length
    ? await prisma.student.findMany({
        where: { classroomId: { in: classroomIds } },
        select: { id: true, name: true, registrationNo: true, classroom: { select: { name: true } } },
        orderBy: { name: "asc" },
      })
    : [];

  const { studentId } = await searchParams;
  const selected = studentId && students.some((s) => s.id === studentId) ? studentId : null;

  let detail = null;
  if (selected) {
    const [profileEvidence, atlRecords, portfolioItems] = await Promise.all([
      prisma.learnerProfileEvidence.findMany({ where: { studentId: selected }, orderBy: { createdAt: "desc" } }),
      prisma.aTLSkillRecord.findMany({ where: { studentId: selected }, orderBy: { createdAt: "desc" } }),
      prisma.portfolioItem.findMany({ where: { studentId: selected }, orderBy: { createdAt: "desc" } }),
    ]);
    detail = {
      profileEvidence: profileEvidence.map((e) => ({ id: e.id, attribute: e.attribute, evidence: e.evidence, createdAt: e.createdAt.toISOString() })),
      atlRecords: atlRecords.map((r) => ({ id: r.id, category: r.category, rating: r.rating, note: r.note, createdAt: r.createdAt.toISOString() })),
      portfolioItems: portfolioItems.map((p) => ({ id: p.id, title: p.title, subject: p.subject, academicYear: p.academicYear, fileUrl: p.fileUrl, createdAt: p.createdAt.toISOString() })),
    };
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Student Growth"
        description="Record Learner Profile evidence and ATL skill growth for the students you teach, and review their portfolio."
      />
      <GrowthTeacherClient
        students={students.map((s) => ({ id: s.id, name: s.name, registrationNo: s.registrationNo, classroom: s.classroom?.name ?? null }))}
        selectedId={selected}
        detail={detail}
      />
    </div>
  );
}
