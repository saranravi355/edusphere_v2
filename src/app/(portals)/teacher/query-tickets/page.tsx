import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import QueryTicketsTeacherClient from "./QueryTicketsTeacherClient";

export const dynamic = "force-dynamic";

export default async function TeacherQueryTicketsPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!teacher) redirect("/teacher");

  const tickets = await prisma.queryTicket.findMany({
    where: { teacherId: teacher.id },
    // Open tickets first, then most recently active within each group.
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      student: { select: { name: true, registrationNo: true, classroom: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <PageHeader
        title="Student Tickets"
        description="Questions and issues students have raised with you. Reply, or mark resolved once it's handled."
      />
      <QueryTicketsTeacherClient
        tickets={tickets.map((t) => ({
          id: t.id,
          studentName: t.student.name,
          studentRegistrationNo: t.student.registrationNo,
          classroom: t.student.classroom?.name ?? null,
          subject: t.subject,
          status: t.status,
          updatedAt: t.updatedAt.toISOString(),
          messages: t.messages.map((m) => ({ id: m.id, authorRole: m.authorRole, text: m.text, createdAt: m.createdAt.toISOString() })),
        }))}
      />
    </div>
  );
}
