"use server";

import { revalidatePath } from "next/cache";

export async function payFee(formData: FormData) {
  // Mock payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  revalidatePath("/parent");
  return { success: true };
}

export async function sendMessage(formData: FormData) {
  // Mock sending message delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  revalidatePath("/parent");
  return { success: true };
}
