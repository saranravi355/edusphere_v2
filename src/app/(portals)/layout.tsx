import AppShell from "@/components/layout/AppShell";
import AIAssistant from "@/components/ui/AIAssistant";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { I18nProvider } from "@/providers/I18nProvider";

// Matches the ink colors on each portal's own card on the landing page
// (src/app/LandingPage.tsx PORTALS) — see the .portal-* rules in globals.css.
const PORTAL_CLASS: Record<string, string> = {
  SUPER_ADMIN: "portal-admin",
  PRINCIPAL: "portal-principal",
  CLASS_TEACHER: "portal-teacher",
  SUBJECT_TEACHER: "portal-teacher",
  STUDENT: "portal-student",
  PARENT: "portal-parent",
  CANTEEN_MANAGER: "portal-operations",
  TRANSPORT_MANAGER: "portal-operations",
  HOSTEL_MANAGER: "portal-operations",
  RESOURCES_MANAGER: "portal-operations",
  ASSETS_MANAGER: "portal-operations",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const notificationRows = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const notifications = notificationRows.map((n) => ({
    id: n.id, title: n.title, message: n.message, type: n.type, isRead: n.isRead, createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className={`contents ${PORTAL_CLASS[session.user.role] ?? ""}`}>
      <I18nProvider>
        <AppShell user={session.user} notifications={notifications}>{children}</AppShell>
        <AIAssistant role={session.user.role} />
      </I18nProvider>
    </div>
  );
}
