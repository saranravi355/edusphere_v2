import AppShell from "@/components/layout/AppShell";
import AIAssistant from "@/components/ui/AIAssistant";
import { getSession } from "@/lib/session";
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

  return (
    <I18nProvider>
      <AppShell user={session.user}>{children}</AppShell>
      <AIAssistant role={session.user.role} />
    </I18nProvider>
  );
}
