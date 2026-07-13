import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function AcademicCalendarPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const events = await prisma.academicEvent.findMany({ orderBy: { startDate: "asc" } });

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Academic Calendar"
        description="Terms, holidays and exam windows in one place — sync national/Karnataka holidays and IB exam sessions with one tap."
      />
      <CalendarClient
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() || null,
          source: e.source,
          notes: e.notes,
        }))}
      />
    </div>
  );
}
