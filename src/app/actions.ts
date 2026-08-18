"use server";

import { cookies } from "next/headers";
import { encrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type LoginState = { error?: string } | undefined;

/**
 * Signature matches React's `useActionState`, so the login page can render
 * whatever this returns. The previous version was invoked as
 * `action={async (fd) => { await login(fd) }}`, which threw the result away —
 * every failure looked identical to nothing happening at all.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  // Normalise: addresses are stored lower-case, and mobile keyboards happily
  // auto-capitalise the first letter, which previously failed the lookup.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email },
      include: {
        teacherProfile: true,
        parentProfile: true,
      }
    });
  } catch (e) {
    // A database outage must not look like a wrong password.
    console.error("[login] database lookup failed:", e);
    return { error: "Cannot reach the database right now. Please try again in a moment." };
  }

  if (!user || user.password !== password) {
    return { error: "Invalid email or password." };
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { expires, httpOnly: true, sameSite: "lax", path: "/" });

  // redirect() signals via a thrown control-flow error, so it must stay outside
  // the try/catch above.
  if (user.role === "SUPER_ADMIN" || user.role === "PRINCIPAL") {
    redirect("/admin");
  } else if (user.role === "CLASS_TEACHER" || user.role === "SUBJECT_TEACHER") {
    redirect("/teacher");
  } else if (user.role === "PARENT") {
    redirect("/parent");
  } else if (user.role === "STUDENT") {
    redirect("/student");
  } else {
    redirect("/");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
  redirect("/");
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}
