"use server";

import { cookies } from "next/headers";
import { encrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  
  if (!email) {
    return { error: "Email is required" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      teacherProfile: true,
      parentProfile: true,
    }
  });

  if (!user) {
    return { error: "User not found" };
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { expires, httpOnly: true });

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
