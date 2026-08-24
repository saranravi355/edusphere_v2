"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, STAFF_ROLES } from "@/lib/authz";
import { rolesForDepartment } from "@/lib/operations";

/** Administrators, plus the assets manager who keeps the register. */
const ASSETS = rolesForDepartment("assets");

/**
 * Borrowing is deliberately wider than the register itself: a teacher signing
 * out a laptop is the ordinary case, and always was. The assets manager is
 * added to that existing set rather than replacing it, so moving this module
 * into the operations portal does not quietly take the ability away from
 * every teacher in the school.
 */
const ASSET_BORROWERS = [...STAFF_ROLES, ...ASSETS];
import type { ActionState } from "@/components/ui/form";
import { ASSET_CATEGORIES } from "@/lib/options";

/**
 * Add a piece of equipment to the register.
 *
 * The Asset and AssetCheckout tables have been in the schema from the start and
 * the page rendered them faithfully — but there was no way to add an asset, and
 * no way to lend one out or take it back. The whole module was a read-only view
 * of rows that could only arrive through the seed script.
 */
export async function createAsset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ASSETS);
  if (!auth.ok) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const serialNo = String(formData.get("serialNo") ?? "").trim();

  if (!name) return { error: "Give the asset a name." };
  if (!(ASSET_CATEGORIES as readonly string[]).includes(category)) return { error: "Choose a category." };
  if (!serialNo) return { error: "A serial number is what tells two identical laptops apart." };

  const clash = await prisma.asset.findUnique({ where: { serialNo }, select: { name: true } });
  if (clash) return { error: `Serial ${serialNo} is already registered to “${clash.name}”.` };

  await prisma.asset.create({ data: { name, category, serialNo, status: "AVAILABLE" } });
  revalidatePath("/operations/assets");
  revalidatePath("/admin/library");
  return { success: `${name} added to the register.` };
}

/** Lend an asset to a member of staff or a student. */
export async function checkOutAsset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ASSET_BORROWERS);
  if (!auth.ok) return { error: auth.error };

  const assetId = String(formData.get("assetId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!assetId) return { error: "Choose an asset." };
  if (!userId) return { error: "Choose who is taking it." };

  const [asset, user] = await Promise.all([
    prisma.asset.findUnique({ where: { id: assetId }, select: { id: true, name: true, status: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
  ]);
  if (!asset) return { error: "That asset no longer exists." };
  if (!user) return { error: "That person no longer has an account." };
  if (asset.status !== "AVAILABLE") return { error: `${asset.name} is already ${asset.status.replace("_", " ").toLowerCase()}.` };

  await prisma.$transaction([
    prisma.assetCheckout.create({ data: { assetId, userId, status: "ACTIVE" } }),
    prisma.asset.update({ where: { id: assetId }, data: { status: "CHECKED_OUT" } }),
  ]);

  revalidatePath("/operations/assets");
  revalidatePath("/admin/library");
  return { success: `${asset.name} checked out to ${user.name}.` };
}

/** Take an asset back. */
export async function returnAsset(checkoutId: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(ASSET_BORROWERS);
  if (!auth.ok) return { error: auth.error };

  const checkout = await prisma.assetCheckout.findUnique({
    where: { id: checkoutId },
    select: { id: true, assetId: true, status: true },
  });
  if (!checkout) return { error: "That loan no longer exists." };
  if (checkout.status !== "ACTIVE") return { error: "That item has already been returned." };

  await prisma.$transaction([
    prisma.assetCheckout.update({ where: { id: checkoutId }, data: { status: "RETURNED", returnDate: new Date() } }),
    prisma.asset.update({ where: { id: checkout.assetId }, data: { status: "AVAILABLE" } }),
  ]);

  revalidatePath("/operations/assets");
  revalidatePath("/admin/library");
  return { success: true };
}
