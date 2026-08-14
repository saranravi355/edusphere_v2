import AppShell from "@/components/layout/AppShell";
import AIAssistant from "@/components/ui/AIAssistant";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { I18nProvider } from "@/providers/I18nProvider";

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
    <I18nProvider>
      <AppShell user={session.user} notifications={notifications}>{children}</AppShell>
      <AIAssistant role={session.user.role} />
    </I18nProvider>
  );
}
