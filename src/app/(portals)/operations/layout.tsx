import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { OPERATIONS_PORTAL_ROLES } from "@/lib/operations";

/**
 * The gate on the operations portal as a whole.
 *
 * Layouts in the App Router run for every nested route, so this is what stops a
 * parent, student or teacher from reaching any department. Which department a
 * given manager may see is decided one level down, in each department's own
 * layout — and again inside every server action, because an action is an
 * addressable endpoint that no layout protects.
 */
export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = session?.user?.role;
  if (!role || !OPERATIONS_PORTAL_ROLES.includes(role)) redirect("/");
  return <>{children}</>;
}
