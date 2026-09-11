import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import NewReportForm from "./NewReportForm";

export const dynamic = "force-dynamic";

export default async function NewProgressReportPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const { studentId } = await searchParams;
  if (!studentId) notFound();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true, classes: { select: { id: true } } },
  });
  if (!teacher) redirect("/teacher");

  const student = await prisma.student.findFirst({
    where: { id: studentId, classroomId: { in: teacher.classes.map((c) => c.id) } },
    select: { id: true, name: true, academicYear: true },
  });
  if (!student) notFound();

  return (
    <div className="space-y-6 pb-12 max-w-lg mx-auto">
      <PageHeader title="New Progress Report" description={`For ${student.name}`} />
      <NewReportForm studentId={student.id} defaultYear={student.academicYear ?? ""} />
    </div>
  );
}
