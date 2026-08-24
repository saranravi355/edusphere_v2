/**
 * The operations portal.
 *
 * Canteen, transport, hostel, resources and assets are run by people who are
 * not administrators and have no business seeing payroll, staff appraisals or
 * student records. They used to live under /admin, which meant the only way to
 * let the canteen supervisor edit next week's menu was to make them an
 * administrator.
 *
 * Each department is now its own place with its own login. This file is the
 * single source of truth for that mapping: the slug in the URL, the role on the
 * account, and who may reach it. Middleware, the layouts, the navigation, the
 * login redirect and every server action all read from here, so a department
 * cannot be added to one and forgotten in another.
 */

export interface Department {
  /** URL segment: /operations/<slug> */
  slug: string;
  /** The single role permitted to run this department. */
  role: string;
  label: string;
  /** One line, shown on the operations hub. */
  blurb: string;
}

export const DEPARTMENTS: readonly Department[] = [
  { slug: "canteen",   role: "CANTEEN_MANAGER",   label: "Canteen",   blurb: "Weekly menu, allergens and the wallet ledger." },
  { slug: "transport", role: "TRANSPORT_MANAGER", label: "Transport", blurb: "Routes, stops, drivers and who rides on which bus." },
  { slug: "hostel",    role: "HOSTEL_MANAGER",    label: "Hostel",    blurb: "Room allocation, occupancy and gate passes." },
  { slug: "resources", role: "RESOURCES_MANAGER", label: "Resources", blurb: "Bookable rooms, labs and equipment." },
  { slug: "assets",    role: "ASSETS_MANAGER",    label: "Assets",    blurb: "The equipment register and who has what out." },
] as const;

/** Every department role. Not admins — see OPERATIONS_PORTAL_ROLES for that. */
export const OPERATIONS_ROLES: readonly string[] = DEPARTMENTS.map((d) => d.role);

/**
 * Administrators keep full access to every department, so that removing a
 * manager's account never locks the school out of its own canteen menu.
 */
export const OPERATIONS_ADMIN_ROLES: readonly string[] = ["SUPER_ADMIN", "PRINCIPAL"];

/** Anyone who may load the portal shell at all. */
export const OPERATIONS_PORTAL_ROLES: readonly string[] = [
  ...OPERATIONS_ADMIN_ROLES,
  ...OPERATIONS_ROLES,
];

export function isOperationsRole(role: string | undefined | null): boolean {
  return !!role && OPERATIONS_ROLES.includes(role);
}

export function departmentBySlug(slug: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.slug === slug);
}

/** The department a manager runs, or undefined for an admin or anyone else. */
export function departmentForRole(role: string | undefined | null): Department | undefined {
  return DEPARTMENTS.find((d) => d.role === role);
}

/**
 * Whether this role may act on this department.
 *
 * Admins may act on all of them; a manager may act on exactly one. Everybody
 * else — teachers, parents, students, and anyone not signed in — on none.
 */
export function canAccessDepartment(role: string | undefined | null, slug: string): boolean {
  if (!role) return false;
  if (OPERATIONS_ADMIN_ROLES.includes(role)) return true;
  return departmentForRole(role)?.slug === slug;
}

/**
 * The roles allowed to act on one department, for passing to guard().
 * Always includes the administrators.
 */
export function rolesForDepartment(slug: string): readonly string[] {
  const dept = departmentBySlug(slug);
  return dept ? [...OPERATIONS_ADMIN_ROLES, dept.role] : OPERATIONS_ADMIN_ROLES;
}

/** Where a signed-in user should land in this portal. */
export function operationsLandingPath(role: string | undefined | null): string {
  const dept = departmentForRole(role);
  return dept ? `/operations/${dept.slug}` : "/operations";
}
