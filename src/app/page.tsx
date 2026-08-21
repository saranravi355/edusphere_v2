import prisma from "@/lib/prisma";
import LandingPage from "./LandingPage";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * The public front door.
 *
 * Its "General Notifications & Circulars" board listed three invented notices
 * from three offices this school does not have, each row styled as clickable
 * with no handler, under a "View All Circulars" button that did nothing. The
 * board now shows the school's own published calendar — term dates, holidays
 * and exam windows — which is the one thing a visitor can legitimately see
 * without signing in.
 */
export default async function Home() {
  const now = new Date();
  const events = await prisma.academicEvent.findMany({
    where: { OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }] },
    orderBy: { startDate: "asc" },
    take: 4,
    select: { id: true, title: true, type: true, startDate: true, endDate: true },
  });

  return (
    <LandingPage
      notices={events.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startDate: formatDate(e.startDate, "dMon"),
        endDate: e.endDate ? formatDate(e.endDate, "dMon") : null,
      }))}
    />
  );
}
