import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }
  return <>{children}</>;
}
