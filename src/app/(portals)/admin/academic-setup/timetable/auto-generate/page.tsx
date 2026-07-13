import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AutoGenerateClient from "./AutoGenerateClient";

export const dynamic = "force-dynamic";

export default async function AutoGeneratePage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const [classrooms, subjectCount, teacherCount] = await Promise.all([
    prisma.classroom.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.count(),
    prisma.teacher.count(),
  ]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="AI Timetable Auto-Generator"
        description="Generate a conflict-free weekly timetable for a class in seconds — teachers are never double-booked across sections."
      />
      <AutoGenerateClient
        classrooms={classrooms.map((c) => ({ id: c.id, name: c.name }))}
        subjectCount={subjectCount}
        teacherCount={teacherCount}
      />
    </div>
  );
}
