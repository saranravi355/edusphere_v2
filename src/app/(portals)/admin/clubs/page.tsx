import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ClubsClient from "./ClubsClient";

export const dynamic = "force-dynamic";

export default async function AdminClubsPage() {
  const session = await getSession();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PRINCIPAL")) {
    redirect("/");
  }

  const clubs = await prisma.club.findMany({
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      members: {
        include: { student: { select: { name: true, registrationNo: true, classroom: { select: { name: true } } } } },
      },
      activities: { orderBy: { date: "asc" } },
    },
  });

  const now = new Date();
  const rows = clubs.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    advisor: c.teacher?.user?.name || "Unassigned",
    members: c.members.map((m) => ({
      name: m.student.name,
      registrationNo: m.student.registrationNo,
      classroom: m.student.classroom?.name || null,
    })),
    past: c.activities
      .filter((a) => a.date < now)
      .reverse()
      .map((a) => ({ id: a.id, title: a.title, type: a.type, date: a.date.toISOString(), location: a.location, description: a.description, outcome: a.outcome })),
    upcoming: c.activities
      .filter((a) => a.date >= now)
      .map((a) => ({ id: a.id, title: a.title, type: a.type, date: a.date.toISOString(), location: a.location, description: a.description, outcome: null })),
  }));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Clubs & Activities"
        description="Extracurricular clubs with full member rosters, past activity records and upcoming events."
      />
      <ClubsClient clubs={rows} />
    </div>
  );
}
