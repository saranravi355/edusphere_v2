import { DEPARTMENTS } from "@/lib/operations";

/**
 * The front door.
 *
 * The landing page cards and the login form both need to know which portals
 * exist and which sample account belongs to each. They used to know separately
 * — five near-identical blocks of JSX on one side, an if/else chain on the
 * other — so adding a portal meant editing two places and noticing the second.
 *
 * `slug` is the ?role= value in the URL. It is a hint for prefilling the form,
 * nothing more: what a person may actually reach is decided by the role on
 * their account, in middleware and in every guard. Changing ?role= in the
 * address bar gets you a different placeholder email and no extra access.
 */
export interface Portal {
  slug: string;
  label: string;
  /** Heading on the login form: "Login to <this> Portal". */
  loginTitle: string;
  /** Prefilled so the demo accounts stay easy to reach. */
  sampleEmail: string;
  /** Other addresses that reach the same portal, shown as a hint. */
  alternatives?: readonly string[];
}

export const PORTALS: readonly Portal[] = [
  { slug: "admin", label: "Management", loginTitle: "Administrator", sampleEmail: "admin@edusphere.com" },
  { slug: "principal", label: "Principal", loginTitle: "Principal", sampleEmail: "principal@edusphere.com" },
  { slug: "teacher", label: "Teacher", loginTitle: "Teacher", sampleEmail: "meena.k@edusphere.com" },
  { slug: "student", label: "Student", loginTitle: "Student", sampleEmail: "aarav.p@edusphere.com" },
  { slug: "parent", label: "Parent", loginTitle: "Parent", sampleEmail: "rahul.p@edusphere.com" },
  {
    slug: "operations",
    label: "Operations",
    loginTitle: "Operations",
    // Five departments share this door and each lands somewhere different.
    // The list is derived from DEPARTMENTS so a new department appears here
    // without anyone remembering to add it.
    sampleEmail: `${DEPARTMENTS[0].slug}@edusphere.com`,
    alternatives: DEPARTMENTS.slice(1).map((d) => `${d.slug}@edusphere.com`),
  },
] as const;

const FALLBACK = PORTALS.find((p) => p.slug === "student")!;

/** Never throws: an unknown ?role= falls back to the student portal. */
export function portalBySlug(slug: string | null | undefined): Portal {
  return PORTALS.find((p) => p.slug === slug) ?? FALLBACK;
}
