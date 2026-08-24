import { getSession } from "@/lib/session";

/**
 * Authorization for Server Actions.
 *
 * Route guards are NOT enough. Every "use server" function is an independently
 * addressable HTTP endpoint: knowing its action id is enough to invoke it, with
 * any session or none, regardless of which page the caller can load. Several
 * admin actions (calendar, timetable, appraisals, IEP plans) had no check at
 * all, so a signed-in parent — or an anonymous caller — could have driven them
 * directly.
 *
 * Every mutating action should begin with a guard.
 */

export const ADMIN_ROLES = ["SUPER_ADMIN", "PRINCIPAL"] as const;
export const TEACHER_ROLES = ["CLASS_TEACHER", "SUBJECT_TEACHER"] as const;
export const STAFF_ROLES = [...ADMIN_ROLES, ...TEACHER_ROLES] as const;

/**
 * Operations managers — canteen, transport, hostel, resources, assets.
 *
 * Deliberately NOT folded into STAFF_ROLES. A hostel warden is staff in the
 * everyday sense, but STAFF_ROLES is what gates things like the asset register
 * and the resource directory across the rest of the app, and widening it here
 * would hand every manager the other four departments by accident. Each
 * department's actions guard on rolesForDepartment() instead, which admits the
 * administrators and exactly one manager.
 *
 * The department list itself lives in lib/operations.ts.
 */
export const OPERATIONS_MANAGER_ROLES = [
  "CANTEEN_MANAGER",
  "TRANSPORT_MANAGER",
  "HOSTEL_MANAGER",
  "RESOURCES_MANAGER",
  "ASSETS_MANAGER",
] as const;

export type Guarded =
  | { ok: true; user: { id: string; role: string; name?: string | null } }
  | { ok: false; error: string };

/**
 * Returns the caller if their role is allowed, otherwise a message safe to show
 * the user. Deliberately does not reveal which role would have been required.
 */
export async function guard(allowed: readonly string[]): Promise<Guarded> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!allowed.includes(user.role)) {
    return { ok: false, error: "You do not have permission to do that." };
  }
  return { ok: true, user };
}
