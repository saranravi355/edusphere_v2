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

/**
 * Management only. Everything to do with money, accounts and the institution
 * itself: the finance ledger and fee schedule, user administration, campuses,
 * and system settings.
 *
 * ADMIN_ROLES is still the right guard for most of /admin — a Principal runs
 * the school's academic and pastoral life and needs nearly all of it. This is
 * the smaller set for the parts they should not be in.
 */
export const MANAGEMENT_ROLES = ["SUPER_ADMIN"] as const;

/**
 * What a Principal may open under /admin.
 *
 * The sidebar has said this for a while — a Principal is given Overview,
 * Academics and People, and nothing else — but saying it was all it did. Every
 * /admin route was reachable by typing the address, and only five of the
 * management pages (finance, fees, users, schools, settings) happened to carry
 * a layout that checked. Anything added later would have been open by default.
 *
 * So the remit is written down here as an allow-list and enforced in
 * middleware, which makes the default the other way round: a new area under
 * /admin is management-only until somebody adds it to this list deliberately.
 *
 * Prefix match on a path segment boundary, so "/admin/students" admits
 * "/admin/students/registry/abc" but "/admin/settings" is not admitted by
 * "/admin/set".
 */
const PRINCIPAL_ADMIN_PATHS = [
  "/admin", // the dashboard itself
  "/admin/live",
  "/admin/analytics",
  "/admin/ai-insights",
  // Academics
  "/admin/academic-setup",
  "/admin/programmes",
  "/admin/exams",
  "/admin/library",
  // People, and the pastoral records that belong with them
  "/admin/staff",
  "/admin/students",
  "/admin/behavior",
  "/admin/clubs",
  "/admin/alumni",
  "/admin/clinic",
] as const;

/**
 * Whether this role may open this /admin path.
 *
 * SUPER_ADMIN — "Management" on the front door — may open everything; that is
 * what distinguishes the two roles. Anyone who is not an administrator at all
 * is rejected before this by the portal check in middleware.
 */
export function canOpenAdminPath(role: string | undefined | null, path: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role !== "PRINCIPAL") return false;
  return PRINCIPAL_ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
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
