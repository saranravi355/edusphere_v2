"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/authz";
import { rolesForDepartment } from "@/lib/operations";

/** Administrators, plus the resources manager. */
const RESOURCES = rolesForDepartment("resources");
import type { ActionState } from "@/components/ui/form";

/**
 * Add a facility, piece of equipment or book to the resource directory.
 *
 * This was an inline action inside the page with a real submit button, but the
 * generic Modal drew its own blue "Save" underneath it — the more prominent of
 * the two — which alerted "Data successfully submitted!" and closed without
 * submitting anything. Whichever button you pressed, you were told it worked.
 */
export async function createResource(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(RESOURCES);
  if (!auth.ok) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const rawCapacity = String(formData.get("capacity") ?? "").trim();

  if (!name) return { error: "Give the resource a name." };
  if (!["FACILITY", "EQUIPMENT", "LIBRARY_BOOK"].includes(type)) return { error: "Choose a resource type." };

  let capacity: number | null = null;
  if (rawCapacity) {
    const n = Number(rawCapacity);
    if (!Number.isInteger(n) || n < 1) return { error: "Capacity must be a whole number of people, or left blank." };
    capacity = n;
  }

  const clash = await prisma.resource.findFirst({ where: { name, type }, select: { id: true } });
  if (clash) return { error: `There is already a ${type.replace("_", " ").toLowerCase()} called “${name}”.` };

  await prisma.resource.create({ data: { name, type, capacity, status: "AVAILABLE" } });

  revalidatePath("/operations/resources");
  return { success: `${name} added to the directory.` };
}
