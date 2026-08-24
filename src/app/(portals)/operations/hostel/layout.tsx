import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { canAccessDepartment, operationsLandingPath } from "@/lib/operations";

/**
 * Only the hostel manager and the administrators get in here. Another
 * department's manager is sent back to their own, not to a dead end.
 *
 * The portal layout above has already turned away anyone who is not staff, so
 * operationsLandingPath() can only resolve to a real destination by this point.
 */
export default async function HostelOperationsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role: string | undefined = session?.user?.role;
  if (!canAccessDepartment(role, "hostel")) redirect(operationsLandingPath(role));
  return <>{children}</>;
}
