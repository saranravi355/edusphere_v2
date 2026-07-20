"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function payFee(formData: FormData) {
  // Mock payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  revalidatePath("/parent");
}

export async function sendMessage(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const receiverId = String(formData.get("receiverId") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!receiverId || !content) return;

  await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      subject: "Parent message",
      content,
      isRead: false,
    },
  });

  revalidatePath("/parent/messages");
}
