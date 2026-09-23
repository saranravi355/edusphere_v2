/**
 * The visiting-team portal.
 *
 * An IB visiting team reads the school's accreditation evidence and nothing
 * else — not student records, not fees, not the confirm queue. Rather than a
 * read-only flag on an administrator account, they get their own role, for the
 * same reason the five operations managers do: the guard becomes structural
 * instead of conditional.
 *
 * This file is the single source of truth, read by middleware, the layout and
 * the login door, so the role cannot be added to one and forgotten in another.
 */

export const VISITOR_ROLE = "IB_VISITOR";
export const VISITOR_SLUG = "visitor";

/**
 * Management keeps access so the school can see exactly what it is showing a
 * visiting team without a second account — the same reasoning
 * OPERATIONS_ADMIN_ROLES gives for not locking the school out of its own
 * canteen. A Principal is deliberately absent: they have the full dashboard at
 * /admin/accreditation, which is a superset of this view.
 */
export const VISITOR_PORTAL_ROLES: readonly string[] = [VISITOR_ROLE, "SUPER_ADMIN"];

export function isVisitorRole(role: string | undefined | null): boolean {
  return role === VISITOR_ROLE;
}
