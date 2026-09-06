"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { guard } from "@/lib/authz";
import { canMessage } from "@/lib/messaging";

export async function sendMessage(formData: FormData) {
  // The messages screen offers each child's class teacher. The action used to
  // accept whatever receiverId arrived and checked only that someone was signed
  // in, so that list constrained nobody: any account could post into any user's
  // inbox under their own name. See lib/messaging.ts for the rule.
  const auth = await guard(["PARENT"]);
  if (!auth.ok) return;

  const receiverId = String(formData.get("receiverId") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!receiverId || !content) return;

  if (!(await canMessage(auth.user, receiverId))) return;

  await prisma.message.create({
    data: {
      senderId: auth.user.id,
      receiverId,
      subject: "Parent message",
      content,
      isRead: false,
    },
  });

  revalidatePath("/parent/messages");
  revalidatePath("/parent");
}
