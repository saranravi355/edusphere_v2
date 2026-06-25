import TopNav from "@/components/layout/TopNav";
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
      <div className="flex flex-col h-screen overflow-hidden bg-ui-bg dark:bg-black font-sans">
        <TopNav user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        <AIAssistant role={session.user.role} />
      </div>
    </I18nProvider>
  );
}
