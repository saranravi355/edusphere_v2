import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

/**
 * Reachable by anyone signed in, and unavoidable for anyone whose account still
 * carries `mustChangePassword` — the middleware sends them here from every
 * other protected path.
 */
export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, passwordChangedAt: true },
  });
  if (!user) redirect("/");

  return (
    <ChangePasswordForm
      name={user.name.split(" ")[0]}
      firstTime={user.passwordChangedAt === null}
    />
  );
}
