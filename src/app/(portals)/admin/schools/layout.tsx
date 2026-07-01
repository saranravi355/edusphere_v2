import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SchoolsSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect("/admin");
  }
  return <>{children}</>;
}
