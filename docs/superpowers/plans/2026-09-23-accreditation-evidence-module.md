# Accreditation & Evidence Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let teachers tag their work as evidence against IB Programme Standards and Practices, let the IB coordinator confirm those tags and see where evidence is thin, and give a visiting team a read-only view of the confirmed evidence.

**Architecture:** A static taxonomy of ~18 practices in TypeScript; one `EvidenceTag` table joining a practice key to exactly one of five evidence records via explicit nullable foreign keys; coverage classified by a pure function at read time, never stored. A shared `EvidenceTagger` client component appears inside five screens that already exist. A new `IB_VISITOR` role gets its own portal, read-only because every guard in the app is an allow-list it is not named in.

**Tech Stack:** Next.js 16 App Router (server components + server actions), Prisma 5.22 on PostgreSQL, Tailwind 4, `node:test` via `tsx`, `@vercel/blob` for document upload, `lucide-react` icons.

**Spec:** `docs/superpowers/specs/2026-09-22-accreditation-evidence-design.md`

## Global Constraints

- **IB curriculum only.** IB grade scale 1–7, PYP/MYP/DP, MYP criteria A–D, ATL skills, learner profile. Never percentages, letter grades or "board exam". Per `AGENTS.md`, permanent.
- **Demo data is Indian.** Names, ₹, +91 phones, Bengaluru addresses.
- **Dates in JSX use `formatDate` from `@/lib/dates`** or `toLocaleDateString("en-GB", …)` with a pinned locale. An unpinned locale causes hydration mismatches.
- **Every server action starts with a guard.** Per `src/lib/authz.ts`: a `"use server"` function is an independently addressable HTTP endpoint, reachable with any session or none, regardless of which page imports it.
- **Route folder convention:** `page.tsx` (server, fetches via `@/lib/prisma`), `*Client.tsx` (client UI), `actions.ts` (server actions with `revalidatePath`).
- **Academic year runs April–March** and is written `"2026-27"`. Task 1 pins this.
- **Prisma migrations run from the developer's own machine** (`npx prisma migrate dev`). The assistant sandbox cannot reach the database. Migrations reach the live database only on a production deploy of `main`.
- **Verification loop:** `./node_modules/.bin/tsc --noEmit`, `npx eslint src --quiet`, `npm test`.

## Review Focus

Five conditions the spec implies but does not pin. Each has a test added to the task that owns the code.

1. **The academic-year boundary is undefined in the spec.** "Nothing from the current academic year" makes a practice thin, but an Indian school year runs April–March, so 31 March 2027 and 1 April 2027 fall in different years. Undefined, this silently uses the calendar year and misclassifies every practice each January. Pinned in Task 1.
2. **A tag whose `standardKey` is not in the taxonomy.** Keys are static and a later deploy could remove or rename one, orphaning live tags. Coverage must not crash, and the orphans must surface somewhere rather than vanishing into an undercount nobody can explain. Task 2.
3. **`tagEvidence` with a `recordId` that does not exist.** Prisma raises a foreign-key error (`P2003`); unhandled that is a 500 on a click. It must read as an ordinary "that record no longer exists". Task 5.
4. **Two coordinators confirming the same suggested tag.** The second confirm must be idempotent, not an error — otherwise whoever clicks second sees a failure for work that succeeded. Task 5.
5. **The visitor view with zero confirmed tags.** A fresh database shows "0 of 18 well evidenced", which reads as broken software rather than an unstarted process. Needs an explicit empty state. Task 10.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/lib/accreditation/standards.ts` | The static taxonomy: `Practice`, `Category`, `EvidenceKind`, `PRACTICES`, `practicesFor`, `practiceByKey` |
| `src/lib/accreditation/standards.test.ts` | Taxonomy invariants |
| `src/lib/accreditation/coverage.ts` | `classifyCoverage`, `coverageSummary` — pure, no Prisma |
| `src/lib/accreditation/coverage.test.ts` | Classification cases |
| `src/lib/accreditation/source.ts` | `sourceOf` — resolves a tag's one foreign key |
| `src/lib/accreditation/source.test.ts` | Zero / one / many set |
| `src/lib/visiting.ts` | `IB_VISITOR`, portal slug, permitted roles — mirrors `operations.ts` |
| `src/components/accreditation/EvidenceTagger.tsx` | The shared tag control |
| `src/app/(portals)/admin/accreditation/page.tsx` | Coordinator dashboard (server) |
| `src/app/(portals)/admin/accreditation/AccreditationClient.tsx` | Dashboard UI |
| `src/app/(portals)/admin/accreditation/DocumentRegisterClient.tsx` | Document upload + list |
| `src/app/(portals)/admin/accreditation/actions.ts` | `tagEvidence`, `confirmTag`, `rejectTag`, `uploadEvidenceDocument` |
| `src/app/(portals)/visitor/layout.tsx` | Visitor shell |
| `src/app/(portals)/visitor/page.tsx` | Visitor read-only evidence view |
| `src/app/(portals)/visitor/VisitorClient.tsx` | Visitor UI |

**Modified:**

| File | Change |
|---|---|
| `prisma/schema.prisma` | `EvidenceTag`, `EvidenceDocument`, back-relations on 5 models + `User` |
| `src/lib/dates.ts` | Add `academicYearOf` |
| `src/lib/dates.test.ts` | Cover the April boundary |
| `src/lib/authz.ts` | `/admin/accreditation` in `PRINCIPAL_ADMIN_PATHS` |
| `src/lib/portals.ts` | Sixth portal entry |
| `src/middleware.ts` | `/visitor` protection, guard, containment redirect |
| `src/app/(portals)/teacher/planner/PlannerClient.tsx` | Tagger in the expanded card |
| `src/app/(portals)/teacher/planner/page.tsx` | Fetch tags |
| `src/app/(portals)/teacher/students/[id]/page.tsx` | Tagger on portfolio + assessment rows |
| `src/app/(portals)/admin/staff/appraisal/AppraisalClient.tsx` | Tagger on observations |
| `src/app/(portals)/admin/staff/appraisal/page.tsx` | Fetch tags |
| `src/app/(portals)/student/portfolio/PortfolioClient.tsx` | Read-only confirmed chips |
| `src/app/(portals)/student/portfolio/page.tsx` | Fetch confirmed tags |
| `src/app/(portals)/admin/ai-insights/accreditation-evidence/page.tsx` | Replace with redirect |
| `prisma/seed.ts` | Practices evidence, documents, visitor account |

---

## Task 1: Academic year, and the standards taxonomy

**Files:**
- Modify: `src/lib/dates.ts`
- Modify: `src/lib/dates.test.ts`
- Create: `src/lib/accreditation/standards.ts`
- Create: `src/lib/accreditation/standards.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `academicYearOf(date: Date): string` returning `"2026-27"`. `type Category = "PURPOSE" | "ENVIRONMENT" | "CULTURE" | "LEARNING"`. `type EvidenceKind = "LESSON_PLAN" | "PORTFOLIO_ITEM" | "ASSESSMENT_RESULT" | "OBSERVATION" | "DOCUMENT"`. `interface Practice { key, category, title, description, expects }`. `PRACTICES: readonly Practice[]` (18 entries). `practicesFor(kind: EvidenceKind): Practice[]`. `practiceByKey(key: string): Practice | undefined`.

- [ ] **Step 1: Write the failing test for the academic year boundary**

Append to `src/lib/dates.test.ts`:

```ts
describe("academicYearOf", () => {
  it("runs April to March, the Indian school year", () => {
    assert.equal(academicYearOf(new Date("2026-04-01T00:00:00+05:30")), "2026-27");
    assert.equal(academicYearOf(new Date("2026-12-31T00:00:00+05:30")), "2026-27");
    assert.equal(academicYearOf(new Date("2027-03-31T00:00:00+05:30")), "2026-27");
  });

  it("rolls over on 1 April, not 1 January", () => {
    // The whole point. A calendar-year reading would call these the same year
    // and would reclassify every practice's coverage each January.
    assert.equal(academicYearOf(new Date("2027-03-31T00:00:00+05:30")), "2026-27");
    assert.equal(academicYearOf(new Date("2027-04-01T00:00:00+05:30")), "2027-28");
  });

  it("reads the date in Asia/Kolkata, not the server's zone", () => {
    // 31 March 2027 at 21:00 UTC is already 1 April in Bengaluru.
    assert.equal(academicYearOf(new Date("2027-03-31T21:00:00Z")), "2027-28");
  });
});
```

Add `academicYearOf` to the existing import at the top of the file.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx tsx --test src/lib/dates.test.ts`
Expected: FAIL — `academicYearOf is not a function` / TypeScript cannot find the export.

- [ ] **Step 3: Implement `academicYearOf`**

Append to `src/lib/dates.ts`:

```ts
/**
 * The academic year a date falls in, as the school writes it: "2026-27".
 *
 * The year runs April to March, so 31 March 2027 is still 2026-27 and 1 April
 * 2027 begins 2027-28. Reading the calendar year instead would reclassify
 * every accreditation practice's coverage each January, which is why this is a
 * function with a test rather than `date.getFullYear()` at three call sites.
 *
 * Resolved in Asia/Kolkata, because the boundary is a date in Bengaluru, not
 * wherever the server happens to run.
 */
export function academicYearOf(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  }).formatToParts(at);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx tsx --test src/lib/dates.test.ts`
Expected: PASS, including the pre-existing cases in that file.

- [ ] **Step 5: Write the failing taxonomy test**

Create `src/lib/accreditation/standards.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PRACTICES, practiceByKey, practicesFor, type Category } from "./standards";

/**
 * The taxonomy is static reference data, so these tests guard the invariants a
 * typo would break: keys are what every tag in the database stores, so a
 * duplicate or a renamed key silently detaches evidence from its practice.
 */

describe("PRACTICES", () => {
  it("holds eighteen practices", () => {
    assert.equal(PRACTICES.length, 18);
  });

  it("gives every practice a unique key", () => {
    const keys = PRACTICES.map((p) => p.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("covers all four IB categories", () => {
    const seen = new Set<Category>(PRACTICES.map((p) => p.category));
    assert.deepEqual([...seen].sort(), ["CULTURE", "ENVIRONMENT", "LEARNING", "PURPOSE"]);
  });

  it("gives every practice at least one evidence kind that can satisfy it", () => {
    // A practice nothing can evidence is a permanent gap and a bug.
    for (const p of PRACTICES) {
      assert.ok(p.expects.length > 0, `${p.key} expects nothing`);
    }
  });
});

describe("practicesFor", () => {
  it("returns only practices a lesson plan can evidence", () => {
    const found = practicesFor("LESSON_PLAN");
    assert.ok(found.length > 0);
    assert.ok(found.every((p) => p.expects.includes("LESSON_PLAN")));
  });

  it("excludes practices that only documents can evidence", () => {
    const found = practicesFor("LESSON_PLAN").map((p) => p.key);
    const documentOnly = PRACTICES.filter(
      (p) => p.expects.length === 1 && p.expects[0] === "DOCUMENT",
    );
    assert.ok(documentOnly.length > 0, "taxonomy should have document-only practices");
    for (const p of documentOnly) assert.ok(!found.includes(p.key));
  });
});

describe("practiceByKey", () => {
  it("finds a known key and returns undefined for an unknown one", () => {
    assert.equal(practiceByKey(PRACTICES[0].key)?.key, PRACTICES[0].key);
    assert.equal(practiceByKey("nope-9.9"), undefined);
  });
});
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npx tsx --test src/lib/accreditation/standards.test.ts`
Expected: FAIL — cannot resolve `./standards`.

- [ ] **Step 7: Implement the taxonomy**

Create `src/lib/accreditation/standards.ts`:

```ts
/**
 * The IB Programme Standards and Practices (2020), as this school evidences
 * them.
 *
 * Static reference data, not the school's own data, so it lives in the
 * repository rather than a table: both the tag control and the dashboard want
 * it at import time, and it version-controls properly. A school-authored
 * `Standard` table can be added later without changing EvidenceTag.
 *
 * `key` is stored on every tag. NEVER renumber a key — it detaches every tag
 * that already points at it. Retire a practice by removing it and accepting
 * the orphan tags the dashboard will then report.
 *
 * This is a representative set of eighteen, not the exhaustive official list.
 * The four categories are the official ones.
 */

export type Category = "PURPOSE" | "ENVIRONMENT" | "CULTURE" | "LEARNING";

export type EvidenceKind =
  | "LESSON_PLAN"
  | "PORTFOLIO_ITEM"
  | "ASSESSMENT_RESULT"
  | "OBSERVATION"
  | "DOCUMENT";

export const CATEGORY_LABELS: Record<Category, string> = {
  PURPOSE: "Purpose",
  ENVIRONMENT: "Environment",
  CULTURE: "Culture",
  LEARNING: "Learning",
};

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  LESSON_PLAN: "Lesson plan",
  PORTFOLIO_ITEM: "Portfolio item",
  ASSESSMENT_RESULT: "Assessment",
  OBSERVATION: "Lesson observation",
  DOCUMENT: "Document",
};

export interface Practice {
  /** Stored on every tag. Stable forever. */
  key: string;
  category: Category;
  title: string;
  description: string;
  /** Evidence kinds that can plausibly satisfy this practice. Drives the picker. */
  expects: EvidenceKind[];
}

export const PRACTICES: readonly Practice[] = [
  // ── Purpose ───────────────────────────────────────────────────────────────
  // Carried by governance documents. Nothing in a classroom evidences a
  // mission statement, which is why the document register exists at all.
  {
    key: "purpose-0.1",
    category: "PURPOSE",
    title: "Mission and IB philosophy",
    description: "The school's mission aligns with IB philosophy and is published to its community.",
    expects: ["DOCUMENT"],
  },
  {
    key: "purpose-0.2",
    category: "PURPOSE",
    title: "Governance commitment",
    description: "Governing body decisions record a commitment to the programme and its resourcing.",
    expects: ["DOCUMENT"],
  },
  {
    key: "purpose-0.3",
    category: "PURPOSE",
    title: "International-mindedness",
    description: "International-mindedness is visible in stated intent and in what students do.",
    expects: ["DOCUMENT", "LESSON_PLAN", "PORTFOLIO_ITEM"],
  },

  // ── Environment ───────────────────────────────────────────────────────────
  {
    key: "environment-1.1",
    category: "ENVIRONMENT",
    title: "Leadership and structures",
    description: "Pedagogical leadership is defined and programme structures are documented.",
    expects: ["DOCUMENT"],
  },
  {
    key: "environment-1.2",
    category: "ENVIRONMENT",
    title: "Resourcing and facilities",
    description: "Staffing, time and facilities are sufficient for the programme as implemented.",
    expects: ["DOCUMENT"],
  },
  {
    key: "environment-1.3",
    category: "ENVIRONMENT",
    title: "Professional development",
    description: "Staff undertake IB professional development and it informs practice.",
    expects: ["DOCUMENT", "OBSERVATION"],
  },
  {
    key: "environment-1.4",
    category: "ENVIRONMENT",
    title: "Student support structures",
    description: "Structures exist to identify and support students' learning and wellbeing needs.",
    expects: ["DOCUMENT", "OBSERVATION"],
  },

  // ── Culture ───────────────────────────────────────────────────────────────
  {
    key: "culture-2.1",
    category: "CULTURE",
    title: "Language policy",
    description: "A language policy is current, consulted on, and reflected in teaching.",
    expects: ["DOCUMENT", "LESSON_PLAN"],
  },
  {
    key: "culture-2.2",
    category: "CULTURE",
    title: "Inclusion policy",
    description: "An inclusion policy is current and learning is differentiated in practice.",
    expects: ["DOCUMENT", "LESSON_PLAN", "OBSERVATION"],
  },
  {
    key: "culture-2.3",
    category: "CULTURE",
    title: "Assessment policy",
    description: "An assessment policy is current and assessment practice follows it.",
    expects: ["DOCUMENT", "ASSESSMENT_RESULT"],
  },
  {
    key: "culture-2.4",
    category: "CULTURE",
    title: "Academic integrity policy",
    description: "An academic integrity policy is taught, not only published.",
    expects: ["DOCUMENT", "LESSON_PLAN"],
  },
  {
    key: "culture-2.5",
    category: "CULTURE",
    title: "Safeguarding and student wellbeing",
    description: "Safeguarding is documented and pastoral practice evidences it.",
    expects: ["DOCUMENT"],
  },

  // ── Learning ──────────────────────────────────────────────────────────────
  {
    key: "learning-3.1",
    category: "LEARNING",
    title: "Written curriculum",
    description: "The written curriculum is collaboratively planned and documented across years.",
    expects: ["LESSON_PLAN", "DOCUMENT"],
  },
  {
    key: "learning-3.2",
    category: "LEARNING",
    title: "Approaches to teaching",
    description: "Teaching is inquiry-based, conceptual and differentiated, evidenced in plans and in practice.",
    expects: ["LESSON_PLAN", "OBSERVATION", "PORTFOLIO_ITEM"],
  },
  {
    key: "learning-3.3",
    category: "LEARNING",
    title: "Approaches to learning (ATL)",
    description: "ATL skills are explicitly planned for and developed by students.",
    expects: ["LESSON_PLAN", "PORTFOLIO_ITEM"],
  },
  {
    key: "learning-3.4",
    category: "LEARNING",
    title: "Assessment practice",
    description: "Assessment is criterion-related, varied, and reported against IB criteria.",
    expects: ["ASSESSMENT_RESULT", "LESSON_PLAN"],
  },
  {
    key: "learning-3.5",
    category: "LEARNING",
    title: "Feedback to students",
    description: "Students receive feedback that identifies what to do next.",
    expects: ["ASSESSMENT_RESULT", "PORTFOLIO_ITEM"],
  },
  {
    key: "learning-3.6",
    category: "LEARNING",
    title: "Student agency and reflection",
    description: "Students act on their learning and reflect on it in their own voice.",
    expects: ["PORTFOLIO_ITEM"],
  },
] as const;

export function practicesFor(kind: EvidenceKind): Practice[] {
  return PRACTICES.filter((p) => p.expects.includes(kind));
}

export function practiceByKey(key: string): Practice | undefined {
  return PRACTICES.find((p) => p.key === key);
}

export const CATEGORY_ORDER: readonly Category[] = ["PURPOSE", "ENVIRONMENT", "CULTURE", "LEARNING"];
```

- [ ] **Step 8: Run both test files and confirm they pass**

Run: `npm test`
Expected: PASS, all files.

- [ ] **Step 9: Typecheck and lint**

Run: `./node_modules/.bin/tsc --noEmit` then `npx eslint src --quiet`
Expected: no output from either.

- [ ] **Step 10: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts src/lib/accreditation/standards.ts src/lib/accreditation/standards.test.ts
git commit -m "Add the IB standards taxonomy and an April-March academic year"
```

---

## Task 2: Coverage classification

**Files:**
- Create: `src/lib/accreditation/coverage.ts`
- Create: `src/lib/accreditation/coverage.test.ts`

**Interfaces:**
- Consumes: `EvidenceKind`, `PRACTICES`, `practiceByKey` from Task 1; `academicYearOf` from Task 1.
- Produces:
  - `type Tone = "GAP" | "THIN" | "WELL_EVIDENCED"`
  - `interface TagFact { standardKey: string; kind: EvidenceKind; status: string; taggedAt: Date }`
  - `classifyCoverage(tags: TagFact[], now?: Date): Tone`
  - `coverageSummary(tags: TagFact[], now?: Date): { byPractice: Map<string, { tone: Tone; count: number }>; wellEvidenced: number; thin: number; gaps: number; orphanKeys: string[] }`

- [ ] **Step 1: Write the failing test**

Create `src/lib/accreditation/coverage.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { classifyCoverage, coverageSummary, type TagFact } from "./coverage";
import { PRACTICES } from "./standards";
import type { EvidenceKind } from "./standards";

/**
 * The classification rules, which are the whole point of the module: a
 * dashboard that overstates evidence is worse than no dashboard.
 *
 * "Current academic year" is April-March (see academicYearOf), so NOW below is
 * deliberately placed mid-year with STALE in the preceding one.
 */

const NOW = new Date("2026-11-15T10:00:00+05:30");
const CURRENT = new Date("2026-09-01T10:00:00+05:30"); // same academic year as NOW
const STALE = new Date("2025-09-01T10:00:00+05:30");   // previous academic year

function tag(kind: EvidenceKind, status = "CONFIRMED", taggedAt = CURRENT): TagFact {
  return { standardKey: "learning-3.2", kind, status, taggedAt };
}

describe("classifyCoverage", () => {
  it("calls no tags at all a gap", () => {
    assert.equal(classifyCoverage([], NOW), "GAP");
  });

  it("calls one or two confirmed tags thin", () => {
    assert.equal(classifyCoverage([tag("LESSON_PLAN")], NOW), "THIN");
    assert.equal(classifyCoverage([tag("LESSON_PLAN"), tag("OBSERVATION")], NOW), "THIN");
  });

  it("calls three tags from a single kind thin, however many there are", () => {
    // Five lesson plans and nothing else is one teacher's view of their own
    // practice, not evidence that the practice is embedded.
    const five = [1, 2, 3, 4, 5].map(() => tag("LESSON_PLAN"));
    assert.equal(classifyCoverage(five, NOW), "THIN");
  });

  it("calls three tags across kinds thin when none is from this academic year", () => {
    const stale = [
      tag("LESSON_PLAN", "CONFIRMED", STALE),
      tag("OBSERVATION", "CONFIRMED", STALE),
      tag("PORTFOLIO_ITEM", "CONFIRMED", STALE),
    ];
    assert.equal(classifyCoverage(stale, NOW), "THIN");
  });

  it("calls three across two kinds with one current well evidenced", () => {
    const good = [
      tag("LESSON_PLAN", "CONFIRMED", CURRENT),
      tag("OBSERVATION", "CONFIRMED", STALE),
      tag("OBSERVATION", "CONFIRMED", STALE),
    ];
    assert.equal(classifyCoverage(good, NOW), "WELL_EVIDENCED");
  });

  it("ignores suggested tags entirely", () => {
    const suggested = [
      tag("LESSON_PLAN", "SUGGESTED"),
      tag("OBSERVATION", "SUGGESTED"),
      tag("PORTFOLIO_ITEM", "SUGGESTED"),
    ];
    assert.equal(classifyCoverage(suggested, NOW), "GAP");
  });

  it("ignores rejected tags entirely", () => {
    const mixed = [
      tag("LESSON_PLAN", "CONFIRMED"),
      tag("OBSERVATION", "REJECTED"),
      tag("PORTFOLIO_ITEM", "REJECTED"),
    ];
    assert.equal(classifyCoverage(mixed, NOW), "THIN");
  });

  it("straddles the 1 April boundary correctly", () => {
    // 31 March is the previous academic year; 1 April is this one.
    const marchNow = new Date("2027-04-02T10:00:00+05:30");
    const march31 = new Date("2027-03-31T10:00:00+05:30");
    const april1 = new Date("2027-04-01T10:00:00+05:30");

    const beforeRollover = [
      { ...tag("LESSON_PLAN"), taggedAt: march31 },
      { ...tag("OBSERVATION"), taggedAt: march31 },
      { ...tag("PORTFOLIO_ITEM"), taggedAt: march31 },
    ];
    assert.equal(classifyCoverage(beforeRollover, marchNow), "THIN");

    const afterRollover = [
      { ...tag("LESSON_PLAN"), taggedAt: april1 },
      { ...tag("OBSERVATION"), taggedAt: march31 },
      { ...tag("PORTFOLIO_ITEM"), taggedAt: march31 },
    ];
    assert.equal(classifyCoverage(afterRollover, marchNow), "WELL_EVIDENCED");
  });
});

describe("coverageSummary", () => {
  it("reports a tone for every practice in the taxonomy, even untagged ones", () => {
    const summary = coverageSummary([], NOW);
    assert.equal(summary.byPractice.size, PRACTICES.length);
    assert.equal(summary.gaps, PRACTICES.length);
    assert.equal(summary.wellEvidenced, 0);
    assert.equal(summary.thin, 0);
  });

  it("counts the three tones so they always total the taxonomy size", () => {
    const tags: TagFact[] = [
      { standardKey: "learning-3.2", kind: "LESSON_PLAN", status: "CONFIRMED", taggedAt: CURRENT },
      { standardKey: "learning-3.2", kind: "OBSERVATION", status: "CONFIRMED", taggedAt: CURRENT },
      { standardKey: "learning-3.2", kind: "PORTFOLIO_ITEM", status: "CONFIRMED", taggedAt: CURRENT },
      { standardKey: "culture-2.1", kind: "DOCUMENT", status: "CONFIRMED", taggedAt: CURRENT },
    ];
    const summary = coverageSummary(tags, NOW);
    assert.equal(summary.wellEvidenced, 1);
    assert.equal(summary.thin, 1);
    assert.equal(summary.gaps, PRACTICES.length - 2);
    assert.equal(
      summary.wellEvidenced + summary.thin + summary.gaps,
      PRACTICES.length,
    );
  });

  it("reports a tag whose standardKey left the taxonomy instead of dropping it", () => {
    // A key removed in a later deploy orphans live tags. Silently ignoring
    // them is an undercount nobody can explain, so they are named.
    const tags: TagFact[] = [
      { standardKey: "retired-9.9", kind: "DOCUMENT", status: "CONFIRMED", taggedAt: CURRENT },
    ];
    const summary = coverageSummary(tags, NOW);
    assert.deepEqual(summary.orphanKeys, ["retired-9.9"]);
    assert.equal(summary.byPractice.size, PRACTICES.length);
    assert.equal(summary.gaps, PRACTICES.length);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx tsx --test src/lib/accreditation/coverage.test.ts`
Expected: FAIL — cannot resolve `./coverage`.

- [ ] **Step 3: Implement the classifier**

Create `src/lib/accreditation/coverage.ts`:

```ts
import { academicYearOf } from "@/lib/dates";
import { PRACTICES, practiceByKey, type EvidenceKind } from "./standards";

/**
 * How well evidenced a practice is.
 *
 * Deliberately three buckets, not a score. A visiting team asks "show me the
 * evidence for this practice", not "what is your coverage percentage".
 */
export type Tone = "GAP" | "THIN" | "WELL_EVIDENCED";

/**
 * The minimum a tag has to carry for classification. A narrow interface so
 * this module never depends on the Prisma row shape and stays testable with
 * plain objects.
 */
export interface TagFact {
  standardKey: string;
  kind: EvidenceKind;
  status: string;
  taggedAt: Date;
}

const CONFIRMED = "CONFIRMED";

/**
 * GAP           — nothing confirmed.
 * THIN          — one or two confirmed, OR all from a single evidence kind,
 *                 OR nothing from the current academic year.
 * WELL_EVIDENCED— three or more, across two or more kinds, at least one current.
 *
 * The single-kind rule is the one that matters. A practice evidenced five
 * times by five lesson plans and nothing else is one teacher's account of
 * their own room; it is not evidence that the practice is embedded, and the
 * rule says so without anyone writing prose about it.
 */
export function classifyCoverage(tags: TagFact[], now: Date = new Date()): Tone {
  const confirmed = tags.filter((t) => t.status === CONFIRMED);
  if (confirmed.length === 0) return "GAP";
  if (confirmed.length < 3) return "THIN";

  const kinds = new Set(confirmed.map((t) => t.kind));
  if (kinds.size < 2) return "THIN";

  const thisYear = academicYearOf(now);
  const hasCurrent = confirmed.some((t) => academicYearOf(t.taggedAt) === thisYear);
  if (!hasCurrent) return "THIN";

  return "WELL_EVIDENCED";
}

export interface CoverageSummary {
  byPractice: Map<string, { tone: Tone; count: number }>;
  wellEvidenced: number;
  thin: number;
  gaps: number;
  /**
   * Keys found on tags that no longer exist in the taxonomy. Surfaced rather
   * than dropped: a retired or mistyped key would otherwise show up only as an
   * unexplained undercount.
   */
  orphanKeys: string[];
}

export function coverageSummary(tags: TagFact[], now: Date = new Date()): CoverageSummary {
  const grouped = new Map<string, TagFact[]>();
  for (const t of tags) {
    const list = grouped.get(t.standardKey);
    if (list) list.push(t);
    else grouped.set(t.standardKey, [t]);
  }

  const byPractice = new Map<string, { tone: Tone; count: number }>();
  let wellEvidenced = 0;
  let thin = 0;
  let gaps = 0;

  // Every practice gets a row, including untagged ones — a practice missing
  // from the dashboard reads as "fine" when it is the opposite.
  for (const practice of PRACTICES) {
    const own = grouped.get(practice.key) ?? [];
    const tone = classifyCoverage(own, now);
    const count = own.filter((t) => t.status === CONFIRMED).length;
    byPractice.set(practice.key, { tone, count });
    if (tone === "WELL_EVIDENCED") wellEvidenced++;
    else if (tone === "THIN") thin++;
    else gaps++;
  }

  const orphanKeys = [...grouped.keys()].filter((k) => !practiceByKey(k));

  return { byPractice, wellEvidenced, thin, gaps, orphanKeys };
}

export const TONE_META: Record<Tone, { label: string; cls: string }> = {
  WELL_EVIDENCED: {
    label: "Well evidenced",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  THIN: {
    label: "Thin",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  GAP: {
    label: "Gap",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx tsx --test src/lib/accreditation/coverage.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Typecheck, lint, full test run**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet && npm test`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/accreditation/coverage.ts src/lib/accreditation/coverage.test.ts
git commit -m "Classify practice coverage as gap, thin or well evidenced"
```

---

## Task 3: Source resolution

**Files:**
- Create: `src/lib/accreditation/source.ts`
- Create: `src/lib/accreditation/source.test.ts`

**Interfaces:**
- Consumes: `EvidenceKind` from Task 1.
- Produces:
  - `interface TagSourceColumns { lessonPlanId?: string | null; portfolioItemId?: string | null; assessmentResultId?: string | null; observationId?: string | null; documentId?: string | null }`
  - `sourceOf(tag: TagSourceColumns): { kind: EvidenceKind; id: string }` — throws on zero or more than one set
  - `columnFor(kind: EvidenceKind): keyof TagSourceColumns`

- [ ] **Step 1: Write the failing test**

Create `src/lib/accreditation/source.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { columnFor, sourceOf } from "./source";

/**
 * A tag points at exactly one of five records. The database enforces that with
 * a check constraint; this function is how the application reads it back, and
 * it throws rather than guessing, because a tag with two sources set means the
 * constraint was bypassed and the coverage figures are already wrong.
 */

describe("sourceOf", () => {
  it("resolves each of the five kinds", () => {
    assert.deepEqual(sourceOf({ lessonPlanId: "lp1" }), { kind: "LESSON_PLAN", id: "lp1" });
    assert.deepEqual(sourceOf({ portfolioItemId: "pi1" }), { kind: "PORTFOLIO_ITEM", id: "pi1" });
    assert.deepEqual(sourceOf({ assessmentResultId: "ar1" }), { kind: "ASSESSMENT_RESULT", id: "ar1" });
    assert.deepEqual(sourceOf({ observationId: "ob1" }), { kind: "OBSERVATION", id: "ob1" });
    assert.deepEqual(sourceOf({ documentId: "doc1" }), { kind: "DOCUMENT", id: "doc1" });
  });

  it("ignores explicit nulls alongside the one set column", () => {
    assert.deepEqual(
      sourceOf({ lessonPlanId: null, portfolioItemId: "pi1", documentId: null }),
      { kind: "PORTFOLIO_ITEM", id: "pi1" },
    );
  });

  it("throws when nothing is set", () => {
    assert.throws(() => sourceOf({}), /no source/i);
    assert.throws(() => sourceOf({ lessonPlanId: null }), /no source/i);
  });

  it("throws when more than one is set", () => {
    assert.throws(
      () => sourceOf({ lessonPlanId: "lp1", documentId: "doc1" }),
      /more than one source/i,
    );
  });
});

describe("columnFor", () => {
  it("maps every kind back to its column", () => {
    assert.equal(columnFor("LESSON_PLAN"), "lessonPlanId");
    assert.equal(columnFor("DOCUMENT"), "documentId");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx tsx --test src/lib/accreditation/source.test.ts`
Expected: FAIL — cannot resolve `./source`.

- [ ] **Step 3: Implement it**

Create `src/lib/accreditation/source.ts`:

```ts
import type { EvidenceKind } from "./standards";

/**
 * The five nullable foreign keys on EvidenceTag, exactly one of which is set.
 *
 * Structurally compatible with the Prisma row rather than importing its type,
 * so this module stays a pure function with a plain-object test.
 */
export interface TagSourceColumns {
  lessonPlanId?: string | null;
  portfolioItemId?: string | null;
  assessmentResultId?: string | null;
  observationId?: string | null;
  documentId?: string | null;
}

const COLUMNS: readonly [keyof TagSourceColumns, EvidenceKind][] = [
  ["lessonPlanId", "LESSON_PLAN"],
  ["portfolioItemId", "PORTFOLIO_ITEM"],
  ["assessmentResultId", "ASSESSMENT_RESULT"],
  ["observationId", "OBSERVATION"],
  ["documentId", "DOCUMENT"],
];

export function columnFor(kind: EvidenceKind): keyof TagSourceColumns {
  const found = COLUMNS.find(([, k]) => k === kind);
  if (!found) throw new Error(`Unknown evidence kind: ${kind}`);
  return found[0];
}

/**
 * The one record a tag points at.
 *
 * Throws rather than returning null on either failure. A tag with no source,
 * or with two, means the check constraint in the migration was bypassed — so
 * the coverage figures are already wrong and the loud failure is the cheapest
 * way to find out. This is never reachable from user input.
 */
export function sourceOf(tag: TagSourceColumns): { kind: EvidenceKind; id: string } {
  const set = COLUMNS.flatMap(([column, kind]) => {
    const id = tag[column];
    return id ? [{ kind, id }] : [];
  });

  if (set.length === 0) throw new Error("EvidenceTag has no source record set");
  if (set.length > 1) {
    throw new Error(
      `EvidenceTag has more than one source set: ${set.map((s) => s.kind).join(", ")}`,
    );
  }
  return set[0];
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx tsx --test src/lib/accreditation/source.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/accreditation/source.ts src/lib/accreditation/source.test.ts
git commit -m "Resolve an evidence tag to its single source record"
```

---

## Task 4: Schema and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_accreditation_evidence/migration.sql` (generated, then hand-edited)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: Prisma models `EvidenceTag` and `EvidenceDocument`, and the client types `EvidenceTag`, `EvidenceDocument` used by Tasks 5–12.

- [ ] **Step 1: Add both models to the schema**

Append to `prisma/schema.prisma`:

```prisma
/// Evidence for one IB practice, pointing at exactly one record.
///
/// The five nullable foreign keys are deliberate. A polymorphic
/// sourceType/sourceId pair would let a deleted lesson plan leave an orphan
/// tag that still counted toward coverage — and a dashboard that overstates
/// evidence is the exact failure this module exists to prevent. Prisma cannot
/// enforce a polymorphic reference; it enforces these.
///
/// `standardKey` matches Practice.key in src/lib/accreditation/standards.ts.
/// Keys are never renumbered there, because every row here points at one.
model EvidenceTag {
  id            String    @id @default(cuid())
  standardKey   String
  /// SUGGESTED, CONFIRMED, REJECTED. Born CONFIRMED when the tagger is an
  /// administrator — there is nobody above them to confirm it.
  status        String    @default("SUGGESTED")
  /// Why the tagger thinks this evidences the practice.
  note          String?
  taggedById    String
  taggedBy      User      @relation("EvidenceTaggedBy", fields: [taggedById], references: [id])
  taggedAt      DateTime  @default(now())
  confirmedById String?
  confirmedBy   User?     @relation("EvidenceConfirmedBy", fields: [confirmedById], references: [id])
  confirmedAt   DateTime?

  /// Exactly one of the five is non-null; a check constraint in the migration
  /// enforces it, since Prisma has no way to express that.
  lessonPlanId       String?
  lessonPlan         LessonPlan?       @relation(fields: [lessonPlanId], references: [id], onDelete: Cascade)
  portfolioItemId    String?
  portfolioItem      PortfolioItem?    @relation(fields: [portfolioItemId], references: [id], onDelete: Cascade)
  assessmentResultId String?
  assessmentResult   AssessmentResult? @relation(fields: [assessmentResultId], references: [id], onDelete: Cascade)
  observationId      String?
  observation        Observation?      @relation(fields: [observationId], references: [id], onDelete: Cascade)
  documentId         String?
  document           EvidenceDocument? @relation(fields: [documentId], references: [id], onDelete: Cascade)

  /// One tag per record per practice. Postgres treats NULLs as distinct, so
  /// all five coexist: rows with a null in one column never collide there.
  @@unique([standardKey, lessonPlanId])
  @@unique([standardKey, portfolioItemId])
  @@unique([standardKey, assessmentResultId])
  @@unique([standardKey, observationId])
  @@unique([standardKey, documentId])
  @@index([standardKey, status])
  @@index([status, taggedAt])
}

/// A school document offered as accreditation evidence.
///
/// The Purpose and Environment categories are carried by governance documents
/// — the mission statement, board minutes, the staff handbook — not by
/// anything that happens in a classroom. Without this table those standards
/// have nothing to evidence and read as permanent gaps.
model EvidenceDocument {
  id           String    @id @default(cuid())
  title        String
  /// POLICY, MINUTES, HANDBOOK, PLAN, REPORT.
  kind         String
  description  String?
  /// @vercel/blob URL. The row is written only after the upload succeeds, so
  /// the register never lists a dead link.
  fileUrl      String
  fileType     String?
  academicYear String?
  /// When the document was last reviewed. IB asks; "dated within the review
  /// cycle" is a judgement this column makes possible.
  reviewedOn   DateTime?
  uploadedById String
  uploadedBy   User      @relation("EvidenceDocumentUploader", fields: [uploadedById], references: [id])
  createdAt    DateTime  @default(now())

  tags EvidenceTag[]

  @@index([kind])
}
```

- [ ] **Step 2: Add the back-relations to the five existing models**

In `prisma/schema.prisma`, add one line to each:

```prisma
// In model User — three relations, because a user tags, confirms and uploads.
  evidenceTagged    EvidenceTag[]      @relation("EvidenceTaggedBy")
  evidenceConfirmed EvidenceTag[]      @relation("EvidenceConfirmedBy")
  evidenceDocuments EvidenceDocument[] @relation("EvidenceDocumentUploader")

// In model LessonPlan
  evidenceTags EvidenceTag[]

// In model PortfolioItem
  evidenceTags EvidenceTag[]

// In model AssessmentResult
  evidenceTags EvidenceTag[]

// In model Observation
  evidenceTags EvidenceTag[]
```

- [ ] **Step 3: Generate the migration without applying it**

Run: `npx prisma migrate dev --name accreditation_evidence --create-only`
Expected: a new folder under `prisma/migrations/` containing `migration.sql`. Nothing has touched the database yet.

- [ ] **Step 4: Hand-add the check constraint to the generated SQL**

Append to the generated `migration.sql`:

```sql
-- Exactly one source per tag. Prisma cannot express this, and without it a
-- bug could write a tag pointing at two records, which sourceOf() then throws
-- on and which would already have corrupted the coverage figures.
ALTER TABLE "EvidenceTag"
  ADD CONSTRAINT "EvidenceTag_exactly_one_source" CHECK (
    (
      ("lessonPlanId"       IS NOT NULL)::int +
      ("portfolioItemId"    IS NOT NULL)::int +
      ("assessmentResultId" IS NOT NULL)::int +
      ("observationId"      IS NOT NULL)::int +
      ("documentId"         IS NOT NULL)::int
    ) = 1
  );
```

- [ ] **Step 5: Regenerate the Prisma client WITHOUT applying the migration**

Run: `npx prisma generate`
Expected: "Generated Prisma Client". This reads `schema.prisma` and needs no database, so the
`evidenceTag` and `evidenceDocument` client types exist for Tasks 5-12 to typecheck against
before any DDL runs.

**Do not apply the migration.** Do not run `prisma migrate dev`, `prisma migrate deploy`, or
`prisma db push`. The database this project points at is the live Supabase instance holding the
demo dataset (173 students, 10,660 rows), and applying DDL to it is the controller's call, not
this task's. Report the path of the generated `migration.sql` and stop.

`prisma migrate dev` in particular is forbidden here: on detecting drift it offers to RESET the
database, which would destroy that dataset. The controller applies with `prisma migrate deploy`,
which only ever applies pending migrations and has no reset path.

- [ ] **Step 6: (Controller step — not the implementer's) Prove the constraint rejects a bad row**

This runs only after the controller has applied the migration. The implementer skips it and
says so in its report.

Run:

```bash
npx prisma db execute --stdin <<'SQL'
INSERT INTO "EvidenceTag" ("id","standardKey","taggedById","lessonPlanId","observationId")
VALUES ('probe-two-sources','learning-3.2',
  (SELECT id FROM "User" WHERE role='PRINCIPAL' LIMIT 1),
  (SELECT id FROM "LessonPlan" LIMIT 1),
  (SELECT id FROM "Observation" LIMIT 1));
SQL
```

Expected: FAIL with `new row for relation "EvidenceTag" violates check constraint "EvidenceTag_exactly_one_source"`.

**Both source ids must be real**, which is why they are subqueries. An earlier version of this step
used the literals `'x'` and `'y'`: those rows fail on the foreign key instead, so the probe passed
while proving nothing about the check constraint.

Then probe the other four behaviours, and delete every probe row afterwards:

- zero sources set → same check-constraint failure
- exactly one real source → succeeds
- the same practice on the same lesson plan twice → `Unique constraint failed on the fields: (standardKey, lessonPlanId)`
- a *different* practice on that same lesson plan → succeeds, because the unique index is per-practice and Postgres treats NULLs as distinct

A row that inserts successfully in the first two cases means the constraint did not land — reapply Step 4 before continuing.

- [ ] **Step 7: Typecheck and commit**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: clean.

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Add EvidenceTag and EvidenceDocument with a one-source check constraint"
```

- [ ] **Step 8: Restart the dev server**

The Prisma client changed, so the running server holds a stale one. Restart it via `start_dev_server.bat`.

---

## Task 5: Server actions

**Files:**
- Create: `src/app/(portals)/admin/accreditation/actions.ts`

**Interfaces:**
- Consumes: `guard`, `ADMIN_ROLES`, `TEACHER_ROLES` from `@/lib/authz`; `columnFor` from Task 3; `practiceByKey`, `EvidenceKind` from Task 1; `classroomIdsForTeacher` from `@/lib/teacherScope`.
- Produces:
  - `tagEvidence(input: { kind: EvidenceKind; recordId: string; standardKey: string; note?: string }): Promise<{ success: true } | { error: string }>`
  - `confirmTag(tagId: string): Promise<{ success: true } | { error: string }>`
  - `rejectTag(tagId: string): Promise<{ success: true } | { error: string }>`
  - `uploadEvidenceDocument(formData: FormData): Promise<{ success: true; id: string } | { error: string }>`

- [ ] **Step 1: Write the actions file**

Create `src/app/(portals)/admin/accreditation/actions.ts`:

```ts
"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { ADMIN_ROLES, STAFF_ROLES, guard } from "@/lib/authz";
import { classroomIdsForTeacher } from "@/lib/teacherScope";
import { columnFor } from "@/lib/accreditation/source";
import { practiceByKey, type EvidenceKind } from "@/lib/accreditation/standards";

/**
 * Tagging, confirming and the document register.
 *
 * This file is imported by five screens across three portals. That is
 * cosmetic: as lib/authz.ts says, every "use server" function is an
 * independently addressable HTTP endpoint reachable with any session or none,
 * regardless of which page imports it. The guards below are the whole defence.
 */

const DOCUMENT_KINDS = ["POLICY", "MINUTES", "HANDBOOK", "PLAN", "REPORT"];

/** Paths whose cached output changes when any tag changes. */
function revalidateEvidence() {
  revalidatePath("/admin/accreditation");
  revalidatePath("/visitor");
}

/**
 * Whether this caller may tag this particular record.
 *
 * A role check alone is not enough. Without the ownership half, any teacher
 * could tag any other teacher's lesson plan, or any of the 173 children's
 * portfolio items, by posting an id — the same hole ownPlan() closes in the
 * planner's own actions.
 */
async function mayTag(
  user: { id: string; role: string },
  kind: EvidenceKind,
  recordId: string,
): Promise<boolean> {
  if ((ADMIN_ROLES as readonly string[]).includes(user.role)) return true;

  // Documents are the coordinator's register; a teacher has no business
  // tagging one even though they may tag their own classroom records.
  if (kind === "DOCUMENT") return false;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!teacher) return false;

  if (kind === "LESSON_PLAN") {
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: recordId },
      select: { teacherId: true },
    });
    return plan?.teacherId === teacher.id;
  }

  if (kind === "OBSERVATION") {
    // Observations are written about a teacher by an observer. A teacher
    // tagging their own observation as evidence of their own practice is the
    // self-assessment the confirm step exists to catch, so it is refused
    // outright rather than queued.
    return false;
  }

  // Portfolio items and assessment results belong to a student, so the test is
  // whether this teacher teaches that student — the same rule the teacher's
  // student profile applies.
  const classroomIds = await classroomIdsForTeacher(user.id);
  if (classroomIds.length === 0) return false;

  const studentId =
    kind === "PORTFOLIO_ITEM"
      ? (await prisma.portfolioItem.findUnique({
          where: { id: recordId },
          select: { studentId: true },
        }))?.studentId
      : (await prisma.assessmentResult.findUnique({
          where: { id: recordId },
          select: { studentId: true },
        }))?.studentId;

  if (!studentId) return false;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classroomId: true },
  });
  return !!student?.classroomId && classroomIds.includes(student.classroomId);
}

export async function tagEvidence(input: {
  kind: EvidenceKind;
  recordId: string;
  standardKey: string;
  note?: string;
}) {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

  // An unknown key would write a tag that no practice ever reads, so it would
  // vanish from the dashboard and reappear only in orphanKeys.
  if (!practiceByKey(input.standardKey)) return { error: "Unknown IB practice." };

  if (!(await mayTag(auth.user, input.kind, input.recordId))) {
    return { error: "That record is not yours to tag." };
  }

  // An administrator's tag is born confirmed: there is nobody above them to
  // confirm it, and asking them to confirm their own is theatre.
  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(auth.user.role);

  try {
    await prisma.evidenceTag.create({
      data: {
        standardKey: input.standardKey,
        status: isAdmin ? "CONFIRMED" : "SUGGESTED",
        note: input.note?.trim() || null,
        taggedById: auth.user.id,
        ...(isAdmin ? { confirmedById: auth.user.id, confirmedAt: new Date() } : {}),
        [columnFor(input.kind)]: input.recordId,
      },
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    // P2002: the unique index caught a second tag for the same record and
    // practice. P2003: the record id does not exist, which happens when
    // somebody deletes a lesson plan in another tab and then clicks here.
    if (code === "P2002") return { error: "That is already tagged against this practice." };
    if (code === "P2003") return { error: "That record no longer exists." };
    throw e;
  }

  revalidateEvidence();
  return { success: true as const };
}

export async function confirmTag(tagId: string) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const tag = await prisma.evidenceTag.findUnique({
    where: { id: tagId },
    select: { status: true },
  });
  if (!tag) return { error: "That tag no longer exists." };

  // Idempotent on purpose. Two coordinators working the queue at once would
  // otherwise show the second one a failure for work that succeeded.
  if (tag.status === "CONFIRMED") return { success: true as const };

  await prisma.evidenceTag.update({
    where: { id: tagId },
    data: { status: "CONFIRMED", confirmedById: auth.user.id, confirmedAt: new Date() },
  });

  revalidateEvidence();
  return { success: true as const };
}

export async function rejectTag(tagId: string) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const tag = await prisma.evidenceTag.findUnique({
    where: { id: tagId },
    select: { status: true },
  });
  if (!tag) return { error: "That tag no longer exists." };
  if (tag.status === "REJECTED") return { success: true as const };

  await prisma.evidenceTag.update({
    where: { id: tagId },
    data: { status: "REJECTED", confirmedById: auth.user.id, confirmedAt: new Date() },
  });

  revalidateEvidence();
  return { success: true as const };
}

export async function uploadEvidenceDocument(formData: FormData) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const title = (formData.get("title") as string)?.trim();
  const kind = formData.get("kind") as string;
  const file = formData.get("file") as File | null;

  if (!title) return { error: "A title is required." };
  if (!DOCUMENT_KINDS.includes(kind)) return { error: "Unknown document kind." };
  if (!file || file.size === 0) return { error: "Choose a file to upload." };

  // Upload first, insert second. The other order leaves the register listing a
  // document whose link is dead whenever the upload fails.
  const blob = await put(`accreditation/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const reviewedOn = formData.get("reviewedOn") as string;
  const created = await prisma.evidenceDocument.create({
    data: {
      title,
      kind,
      description: (formData.get("description") as string)?.trim() || null,
      fileUrl: blob.url,
      fileType: file.type || null,
      academicYear: (formData.get("academicYear") as string) || null,
      reviewedOn: reviewedOn ? new Date(reviewedOn) : null,
      uploadedById: auth.user.id,
    },
    select: { id: true },
  });

  revalidateEvidence();
  return { success: true as const, id: created.id };
}
```

- [ ] **Step 2: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: clean. A complaint about `evidenceTag` not existing on the Prisma client means Task 4 Step 5 did not run.

- [ ] **Step 3: Lint**

Run: `npx eslint src --quiet`
Expected: no output.

- [ ] **Step 4: Verify the two database failure modes**

No UI exists yet (it arrives in Tasks 6–8), so drive these from a throwaway script. Create `scripts/probe-evidence.mjs`:

```js
// Throwaway. Exercises the two cases that cannot have a unit test because they
// need the database: a dangling record id and a duplicate tag. Delete at the
// end of this step.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const admin = await prisma.user.findFirst({ where: { role: "PRINCIPAL" }, select: { id: true } });
const plan = await prisma.lessonPlan.findFirst({ select: { id: true } });
if (!admin || !plan) throw new Error("Seed the database first.");

// 1. Dangling foreign key. Must be P2003, which tagEvidence turns into
//    "That record no longer exists." instead of a 500 on a click.
try {
  await prisma.evidenceTag.create({
    data: { standardKey: "learning-3.2", taggedById: admin.id, lessonPlanId: "does-not-exist" },
  });
  console.log("FAIL: dangling id was accepted");
} catch (e) {
  console.log(e.code === "P2003" ? "PASS: dangling id rejected as P2003" : `FAIL: got ${e.code}`);
}

// 2. Duplicate. Must be P2002, which becomes "already tagged against this practice".
const first = await prisma.evidenceTag.create({
  data: { standardKey: "learning-3.2", taggedById: admin.id, lessonPlanId: plan.id },
});
try {
  await prisma.evidenceTag.create({
    data: { standardKey: "learning-3.2", taggedById: admin.id, lessonPlanId: plan.id },
  });
  console.log("FAIL: duplicate was accepted");
} catch (e) {
  console.log(e.code === "P2002" ? "PASS: duplicate rejected as P2002" : `FAIL: got ${e.code}`);
}

await prisma.evidenceTag.delete({ where: { id: first.id } });
await prisma.$disconnect();
```

Run: `node scripts/probe-evidence.mjs`
Expected: two `PASS` lines. A `FAIL` on the first means the foreign keys did not land in Task 4; a `FAIL` on the second means the unique indexes did not.

- [ ] **Step 5: Confirm the idempotent-confirm branch by inspection**

Double-confirm needs two coordinators clicking at once, which is not reproducible from a script. Verify the branch exists instead: in `confirmTag`, the early `if (tag.status === "CONFIRMED") return { success: true }` must sit **before** the `prisma.evidenceTag.update`. Same for `rejectTag` and `REJECTED`.

Task 7 Step 6 exercises it for real once the queue has buttons.

- [ ] **Step 6: Delete the probe script**

```bash
rm scripts/probe-evidence.mjs
```

The script is not committed — it exists only for Step 4.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(portals)/admin/accreditation/actions.ts"
git commit -m "Add guarded evidence tagging, confirmation and document upload"
```

---

## Task 6: The EvidenceTagger component

**Files:**
- Create: `src/components/accreditation/EvidenceTagger.tsx`

**Interfaces:**
- Consumes: `tagEvidence`, `confirmTag`, `rejectTag` from Task 5; `practicesFor`, `practiceByKey`, `EvidenceKind` from Task 1.
- Produces:
  - `interface TagView { id: string; standardKey: string; status: string; note: string | null }`
  - Default export `EvidenceTagger({ kind, recordId, tags, canConfirm, readOnly }: { kind: EvidenceKind; recordId: string; tags: TagView[]; canConfirm?: boolean; readOnly?: boolean })`

- [ ] **Step 1: Write the component**

Create `src/components/accreditation/EvidenceTagger.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Check, Loader2, Plus, ShieldQuestion, X } from "lucide-react";

import {
  confirmTag,
  rejectTag,
  tagEvidence,
} from "@/app/(portals)/admin/accreditation/actions";
import {
  practiceByKey,
  practicesFor,
  type EvidenceKind,
} from "@/lib/accreditation/standards";

export interface TagView {
  id: string;
  standardKey: string;
  status: string;
  note: string | null;
}

/**
 * Tag one record as evidence for an IB practice.
 *
 * Appears inside five screens that already exist rather than in a page of its
 * own, because the coordinator tagging everything centrally is the manual slog
 * this module removes. The picker offers only the practices this kind of
 * record can plausibly evidence — six on a lesson plan, not all eighteen.
 *
 * `readOnly` is the student's view of their own portfolio: confirmed tags
 * shown, nothing to click. A student asserting that their own work evidences
 * an IB standard is not evidence.
 */
export default function EvidenceTagger({
  kind,
  recordId,
  tags,
  canConfirm = false,
  readOnly = false,
}: {
  kind: EvidenceKind;
  recordId: string;
  tags: TagView[];
  canConfirm?: boolean;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = practicesFor(kind);
  const alreadyTagged = new Set(tags.filter((t) => t.status !== "REJECTED").map((t) => t.standardKey));
  const available = options.filter((p) => !alreadyTagged.has(p.key));

  const shown = readOnly ? tags.filter((t) => t.status === "CONFIRMED") : tags.filter((t) => t.status !== "REJECTED");

  function submit() {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const result = await tagEvidence({ kind, recordId, standardKey: chosen, note });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setChosen("");
      setNote("");
      setOpen(false);
    });
  }

  function act(fn: (id: string) => Promise<{ success: true } | { error: string }>, id: string) {
    setError(null);
    startTransition(async () => {
      const result = await fn(id);
      if ("error" in result) setError(result.error);
    });
  }

  if (readOnly && shown.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((t) => {
          const practice = practiceByKey(t.standardKey);
          const confirmed = t.status === "CONFIRMED";
          return (
            <span
              key={t.id}
              title={practice?.description ?? t.standardKey}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                confirmed
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {confirmed ? <BadgeCheck size={11} /> : <ShieldQuestion size={11} />}
              {practice?.title ?? t.standardKey}
              {canConfirm && !confirmed && (
                <>
                  <button
                    onClick={() => act(confirmTag, t.id)}
                    disabled={pending}
                    aria-label={`Confirm ${practice?.title ?? t.standardKey}`}
                    className="ml-0.5 hover:text-emerald-800 disabled:opacity-50"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    onClick={() => act(rejectTag, t.id)}
                    disabled={pending}
                    aria-label={`Reject ${practice?.title ?? t.standardKey}`}
                    className="hover:text-rose-700 disabled:opacity-50"
                  >
                    <X size={11} />
                  </button>
                </>
              )}
            </span>
          );
        })}

        {!readOnly && available.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300"
          >
            <Plus size={11} /> Tag as evidence
          </button>
        )}
      </div>

      {open && !readOnly && (
        <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 space-y-2">
          <select
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          >
            <option value="">Choose an IB practice…</option>
            {available.map((p) => (
              <option key={p.key} value={p.key}>
                {p.title}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Why does this evidence that practice? (optional)"
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={submit}
              disabled={pending || !chosen}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {pending && <Loader2 size={12} className="animate-spin" />} Tag
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/accreditation/EvidenceTagger.tsx
git commit -m "Add the shared evidence tag control"
```

---

## Task 7: Coordinator dashboard

**Files:**
- Modify: `src/lib/authz.ts`
- Create: `src/app/(portals)/admin/accreditation/page.tsx`
- Create: `src/app/(portals)/admin/accreditation/AccreditationClient.tsx`

**Interfaces:**
- Consumes: `coverageSummary`, `TONE_META`, `TagFact`, `Tone` from Task 2; `sourceOf` from Task 3; `PRACTICES`, `CATEGORY_ORDER`, `CATEGORY_LABELS`, `EVIDENCE_KIND_LABELS` from Task 1; `confirmTag`, `rejectTag` from Task 5.
- Produces:
  - `interface QueueRow { id: string; standardKey: string; practiceTitle: string; kind: EvidenceKind; sourceLabel: string; note: string | null; taggedBy: string; taggedAt: string }`
  - `interface PracticeRow { key: string; category: Category; title: string; description: string; tone: Tone; count: number; evidence: { id: string; kind: EvidenceKind; label: string; href: string | null }[] }`

- [ ] **Step 1: Let a Principal reach the new area**

In `src/lib/authz.ts`, add to `PRINCIPAL_ADMIN_PATHS`, in the Academics group beside `/admin/programmes`:

```ts
  "/admin/accreditation",
```

Without this the module is management-only, because that list is an allow-list and a new `/admin` area is refused until named. The Principal usually owns accreditation.

- [ ] **Step 2: Write the server page**

Create `src/app/(portals)/admin/accreditation/page.tsx`:

```tsx
import { redirect } from "next/navigation";

import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/dates";
import { coverageSummary, type TagFact } from "@/lib/accreditation/coverage";
import { sourceOf } from "@/lib/accreditation/source";
import {
  CATEGORY_ORDER,
  EVIDENCE_KIND_LABELS,
  PRACTICES,
  practiceByKey,
  type EvidenceKind,
} from "@/lib/accreditation/standards";
import AccreditationClient from "./AccreditationClient";

export const dynamic = "force-dynamic";

/**
 * The IB coordinator's view of the school's evidence.
 *
 * Coverage is computed here on every load rather than stored. Eighteen
 * practices against a few hundred tags is nothing to query, and a stored count
 * is a thing that can go stale and then lie about how well evidenced the
 * school is — which is the one failure this module cannot afford.
 */
export default async function AccreditationPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const tags = await prisma.evidenceTag.findMany({
    include: {
      taggedBy: { select: { name: true } },
      lessonPlan: { select: { id: true, title: true, subjectName: true } },
      portfolioItem: { select: { id: true, title: true, student: { select: { name: true } } } },
      assessmentResult: { select: { id: true, title: true, student: { select: { name: true } } } },
      // Teacher has no `name` column of its own — it lives on the related User.
      observation: { select: { id: true, focusArea: true, teacher: { select: { user: { select: { name: true } } } } } },
      document: { select: { id: true, title: true, fileUrl: true } },
    },
    orderBy: { taggedAt: "desc" },
  });

  /** One human-readable line per tag, plus where to go to see it. */
  function describe(t: (typeof tags)[number]): { kind: EvidenceKind; label: string; href: string | null } {
    const { kind } = sourceOf(t);
    if (kind === "LESSON_PLAN") {
      return {
        kind,
        label: `${t.lessonPlan!.title} · ${t.lessonPlan!.subjectName}`,
        href: "/teacher/planner",
      };
    }
    if (kind === "PORTFOLIO_ITEM") {
      return {
        kind,
        label: `${t.portfolioItem!.title} · ${t.portfolioItem!.student.name}`,
        href: null,
      };
    }
    if (kind === "ASSESSMENT_RESULT") {
      return {
        kind,
        label: `${t.assessmentResult!.title} · ${t.assessmentResult!.student.name}`,
        href: null,
      };
    }
    if (kind === "OBSERVATION") {
      return {
        kind,
        label: `${t.observation!.focusArea ?? "Lesson observation"} · ${t.observation!.teacher.user.name}`,
        href: "/admin/staff/appraisal",
      };
    }
    return { kind, label: t.document!.title, href: t.document!.fileUrl };
  }

  const facts: TagFact[] = tags.map((t) => ({
    standardKey: t.standardKey,
    kind: sourceOf(t).kind,
    status: t.status,
    taggedAt: t.taggedAt,
  }));
  const summary = coverageSummary(facts);

  const queue = tags
    .filter((t) => t.status === "SUGGESTED")
    .map((t) => {
      const described = describe(t);
      return {
        id: t.id,
        standardKey: t.standardKey,
        practiceTitle: practiceByKey(t.standardKey)?.title ?? t.standardKey,
        kind: described.kind,
        sourceLabel: described.label,
        note: t.note,
        taggedBy: t.taggedBy.name ?? "Unknown",
        taggedAt: formatDate(t.taggedAt, "weekdayDMon"),
      };
    });

  const practices = PRACTICES.map((p) => {
    const cell = summary.byPractice.get(p.key)!;
    return {
      key: p.key,
      category: p.category,
      title: p.title,
      description: p.description,
      tone: cell.tone,
      count: cell.count,
      expects: p.expects.map((k) => EVIDENCE_KIND_LABELS[k]),
      evidence: tags
        .filter((t) => t.standardKey === p.key && t.status === "CONFIRMED")
        .map((t) => {
          const d = describe(t);
          return { id: t.id, kind: d.kind, label: d.label, href: d.href };
        }),
    };
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Accreditation & Evidence"
        description="Evidence for the IB Programme Standards and Practices, tagged by teachers as they work and confirmed here. A practice evidenced only one way still reads as thin."
      />
      <AccreditationClient
        queue={queue}
        practices={practices}
        summary={{
          wellEvidenced: summary.wellEvidenced,
          thin: summary.thin,
          gaps: summary.gaps,
          total: PRACTICES.length,
          orphanKeys: summary.orphanKeys,
        }}
        categoryOrder={[...CATEGORY_ORDER]}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write the client**

Create `src/app/(portals)/admin/accreditation/AccreditationClient.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, ExternalLink, Loader2, X } from "lucide-react";

import { TONE_META, type Tone } from "@/lib/accreditation/coverage";
import {
  CATEGORY_LABELS,
  EVIDENCE_KIND_LABELS,
  type Category,
  type EvidenceKind,
} from "@/lib/accreditation/standards";
import { confirmTag, rejectTag } from "./actions";

interface QueueRow {
  id: string;
  standardKey: string;
  practiceTitle: string;
  kind: EvidenceKind;
  sourceLabel: string;
  note: string | null;
  taggedBy: string;
  taggedAt: string;
}

interface PracticeRow {
  key: string;
  category: Category;
  title: string;
  description: string;
  tone: Tone;
  count: number;
  expects: string[];
  evidence: { id: string; kind: EvidenceKind; label: string; href: string | null }[];
}

export default function AccreditationClient({
  queue,
  practices,
  summary,
  categoryOrder,
}: {
  queue: QueueRow[];
  practices: PracticeRow[];
  summary: { wellEvidenced: number; thin: number; gaps: number; total: number; orphanKeys: string[] };
  categoryOrder: Category[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function act(fn: (id: string) => Promise<{ success: true } | { error: string }>, id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await fn(id);
      if ("error" in result) setError(result.error);
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* The coordinator's actual recurring job, so it leads. */}
      <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">
          Awaiting confirmation
          <span className="ml-2 text-xs font-bold text-slate-400">{queue.length}</span>
        </h2>
        {queue.length === 0 ? (
          <p className="text-sm text-slate-500 mt-2">
            Nothing waiting. Tags teachers add from their own screens appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {queue.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.practiceTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {EVIDENCE_KIND_LABELS[row.kind]}: {row.sourceLabel}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {row.taggedBy} · {row.taggedAt}
                  </p>
                  {row.note && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">“{row.note}”</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => act(confirmTag, row.id)}
                    disabled={pendingId === row.id}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {pendingId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Confirm
                  </button>
                  <button
                    onClick={() => act(rejectTag, row.id)}
                    disabled={pendingId === row.id}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      </section>

      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {summary.wellEvidenced} of {summary.total} well evidenced · {summary.thin} thin · {summary.gaps}{" "}
        {summary.gaps === 1 ? "gap" : "gaps"}
      </p>

      {summary.orphanKeys.length > 0 && (
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          {summary.orphanKeys.length} tag{summary.orphanKeys.length === 1 ? "" : "s"} point at practices that
          are no longer in the taxonomy ({summary.orphanKeys.join(", ")}). They count towards nothing.
        </p>
      )}

      {categoryOrder.map((category) => {
        const rows = practices.filter((p) => p.category === category);
        return (
          <section
            key={category}
            className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5"
          >
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{CATEGORY_LABELS[category]}</h2>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {rows.map((p) => {
                const open = expanded === p.key;
                const meta = TONE_META[p.tone];
                return (
                  <li key={p.key} className="py-3">
                    <button
                      onClick={() => setExpanded(open ? null : p.key)}
                      className="w-full flex items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-400">{p.count}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </div>
                    </button>
                    {open && (
                      <div className="mt-2 pl-1">
                        {p.evidence.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No confirmed evidence. Can be evidenced by: {p.expects.join(", ")}.
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {p.evidence.map((e) => (
                              <li key={e.id} className="text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-semibold">{EVIDENCE_KIND_LABELS[e.kind]}:</span>{" "}
                                {e.href ? (
                                  <Link href={e.href} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                    {e.label} <ExternalLink size={10} />
                                  </Link>
                                ) : (
                                  e.label
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add the sidebar link**

In `src/components/layout/SideNav.tsx`, add to `ADMIN_ACADEMICS.links` after the CAS Tracker entry:

```ts
    { name: "Accreditation", href: "/admin/accreditation", icon: ShieldCheck },
```

Add `ShieldCheck` to the existing `lucide-react` import at the top of that file.

Translation keys in this codebase are the **display name**, not a slug — `SideNav.tsx:355` calls
`t(\`sidenav.links.${link.name}\`, link.name)`, with the English name as the fallback. So the link works
untranslated, and each locale file adds the key `"Accreditation"`:

- `src/i18n/locales/en.json` → `"Accreditation": "Accreditation"`
- `src/i18n/locales/hi.json` → `"Accreditation": "प्रत्यायन"`
- `src/i18n/locales/ta.json` → `"Accreditation": "அங்கீகாரம்"`
- `src/i18n/locales/kn.json` → `"Accreditation": "ಮಾನ್ಯತೆ"`

Each goes inside the `sidenav.links` object, beside `"CAS Tracker"`.

- [ ] **Step 5: Typecheck, lint, test**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet && npm test`
Expected: clean.

- [ ] **Step 6: Check it in the browser**

Sign in as the Principal and open `/admin/accreditation`. Expected: all four category sections render, every practice reads **Gap**, and the header reads "0 of 18 well evidenced · 0 thin · 18 gaps" with an empty queue.

Then insert a suggested tag to work with:

```bash
npx prisma db execute --stdin <<'SQL'
INSERT INTO "EvidenceTag" ("id","standardKey","status","taggedById","lessonPlanId")
VALUES ('queue-probe','learning-3.2','SUGGESTED',
  (SELECT id FROM "User" WHERE role='PRINCIPAL' LIMIT 1),
  (SELECT id FROM "LessonPlan" LIMIT 1));
SQL
```

Reload. Expected: the queue shows one row naming "Approaches to teaching". Click **Confirm**. Expected: the row leaves the queue and the header becomes "0 of 18 well evidenced · 1 thin · 17 gaps" — thin, not well evidenced, because one tag is never enough.

Now the Review Focus idempotency case, for real: insert another suggested tag and double-click **Confirm** fast enough to fire twice.

```bash
npx prisma db execute --stdin <<'SQL'
INSERT INTO "EvidenceTag" ("id","standardKey","status","taggedById","observationId")
VALUES ('idem-probe','learning-3.2','SUGGESTED',
  (SELECT id FROM "User" WHERE role='PRINCIPAL' LIMIT 1),
  (SELECT id FROM "Observation" LIMIT 1));
SQL
```

Expected: no error message either time, and the practice moves to 2 confirmed. An error on the second click means the early return in `confirmTag` is below the `update` rather than above it.

Clean up both probes before moving on:

```bash
npx prisma db execute --stdin <<'SQL'
DELETE FROM "EvidenceTag" WHERE id IN ('queue-probe','idem-probe');
SQL
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/authz.ts "src/app/(portals)/admin/accreditation/page.tsx" "src/app/(portals)/admin/accreditation/AccreditationClient.tsx" src/i18n/locales src/components
git commit -m "Add the coordinator accreditation dashboard with a confirm queue"
```

---

## Task 8: Host the tagger in the four existing screens

**Files:**
- Modify: `src/app/(portals)/teacher/planner/page.tsx`
- Modify: `src/app/(portals)/teacher/planner/PlannerClient.tsx`
- Modify: `src/app/(portals)/teacher/students/[id]/page.tsx`
- Modify: `src/app/(portals)/admin/staff/appraisal/page.tsx`
- Modify: `src/app/(portals)/admin/staff/appraisal/AppraisalClient.tsx`
- Modify: `src/app/(portals)/student/portfolio/page.tsx`
- Modify: `src/app/(portals)/student/portfolio/PortfolioClient.tsx`

**Interfaces:**
- Consumes: `EvidenceTagger`, `TagView` from Task 6.
- Produces: nothing new.

- [ ] **Step 1: Lesson plans — fetch the tags**

In `src/app/(portals)/teacher/planner/page.tsx`, add `evidenceTags` to the `lessonPlan.findMany` select/include:

```ts
      evidenceTags: {
        select: { id: true, standardKey: true, status: true, note: true },
      },
```

Map them onto each plan passed to `PlannerClient`:

```ts
      evidenceTags: p.evidenceTags,
```

- [ ] **Step 2: Lesson plans — render the tagger**

In `PlannerClient.tsx`, add to the `Plan` interface:

```ts
  evidenceTags: { id: string; standardKey: string; status: string; note: string | null }[];
```

Import it and render it inside the expanded card, directly under the ATL/learner-profile chip row:

```tsx
import EvidenceTagger from "@/components/accreditation/EvidenceTagger";
```

```tsx
<EvidenceTagger kind="LESSON_PLAN" recordId={p.id} tags={p.evidenceTags} />
```

- [ ] **Step 3: Verify in the browser**

Sign in as `meena.k@edusphere.com`, open `/teacher/planner`, expand a plan, tag it. Expected: an amber chip appears immediately, and `/admin/accreditation` shows it in the queue.

- [ ] **Step 4: Student profile — portfolio items and assessments**

In `src/app/(portals)/teacher/students/[id]/page.tsx`, add the same `evidenceTags` select to the `portfolioItem` and `assessmentResult` queries, then render one tagger per row:

```tsx
<EvidenceTagger kind="PORTFOLIO_ITEM" recordId={item.id} tags={item.evidenceTags} />
```

```tsx
<EvidenceTagger kind="ASSESSMENT_RESULT" recordId={result.id} tags={result.evidenceTags} />
```

- [ ] **Step 5: Observations — coordinator side, confirm enabled**

In `src/app/(portals)/admin/staff/appraisal/page.tsx`, add `evidenceTags` to the `observation` query. In `AppraisalClient.tsx`, render:

```tsx
<EvidenceTagger kind="OBSERVATION" recordId={o.id} tags={o.evidenceTags} canConfirm />
```

`canConfirm` is set because only administrators reach this screen; their tags are born confirmed anyway, and the control then also lets them clear a mistake.

- [ ] **Step 6: Student portfolio — read-only**

In `src/app/(portals)/student/portfolio/page.tsx`, select only confirmed tags:

```ts
      evidenceTags: {
        where: { status: "CONFIRMED" },
        select: { id: true, standardKey: true, status: true, note: true },
      },
```

In `PortfolioClient.tsx`:

```tsx
<EvidenceTagger kind="PORTFOLIO_ITEM" recordId={item.id} tags={item.evidenceTags} readOnly />
```

A student sees that their work evidences a practice and has nothing to click. The component returns `null` when a read-only item has no confirmed tags, so untagged portfolios look exactly as they do today.

- [ ] **Step 7: Typecheck, lint, test**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet && npm test`
Expected: clean.

- [ ] **Step 8: Verify every host, then commit**

Walk all four: teacher planner, teacher student profile (both kinds), admin appraisal, student portfolio. Expected: teacher tags land amber/SUGGESTED, admin tags land green/CONFIRMED immediately, the student sees green chips only.

```bash
git add "src/app/(portals)/teacher/planner" "src/app/(portals)/teacher/students" "src/app/(portals)/admin/staff/appraisal" "src/app/(portals)/student/portfolio"
git commit -m "Tag evidence from the planner, student profile, appraisal and portfolio"
```

---

## Task 9: Document register

**Files:**
- Create: `src/app/(portals)/admin/accreditation/DocumentRegisterClient.tsx`
- Modify: `src/app/(portals)/admin/accreditation/page.tsx`

**Interfaces:**
- Consumes: `uploadEvidenceDocument` from Task 5; `EvidenceTagger` from Task 6.
- Produces:
  - `interface DocumentRow { id: string; title: string; kind: string; description: string | null; fileUrl: string; academicYear: string | null; reviewedOn: string | null; tags: TagView[] }`

- [ ] **Step 1: Fetch documents in the page**

In `src/app/(portals)/admin/accreditation/page.tsx`, add before the return:

```ts
  const documents = await prisma.evidenceDocument.findMany({
    include: { tags: { select: { id: true, standardKey: true, status: true, note: true } } },
    orderBy: { createdAt: "desc" },
  });

  const documentRows = documents.map((d) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    description: d.description,
    fileUrl: d.fileUrl,
    academicYear: d.academicYear,
    reviewedOn: d.reviewedOn ? formatDate(d.reviewedOn, "weekdayDMon") : null,
    tags: d.tags,
  }));
```

Pass `documents={documentRows}` to a new `<DocumentRegisterClient>` rendered after `<AccreditationClient>`.

- [ ] **Step 2: Write the register client**

Create `src/app/(portals)/admin/accreditation/DocumentRegisterClient.tsx`:

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Upload } from "lucide-react";

import EvidenceTagger, { type TagView } from "@/components/accreditation/EvidenceTagger";
import { uploadEvidenceDocument } from "./actions";

interface DocumentRow {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  fileUrl: string;
  academicYear: string | null;
  reviewedOn: string | null;
  tags: TagView[];
}

const KINDS = [
  { value: "POLICY", label: "Policy" },
  { value: "MINUTES", label: "Minutes" },
  { value: "HANDBOOK", label: "Handbook" },
  { value: "PLAN", label: "Plan" },
  { value: "REPORT", label: "Report" },
];

/**
 * The document half of the evidence base.
 *
 * Purpose and Environment are carried by governance documents, not by
 * classroom records, so without this the dashboard reports those categories as
 * permanent gaps however well the school is actually run.
 */
export default function DocumentRegisterClient({ documents }: { documents: DocumentRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await uploadEvidenceDocument(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5">
      <h2 className="font-bold text-slate-800 dark:text-slate-100">Document register</h2>
      <p className="text-xs text-slate-500 mt-0.5">
        Policies, minutes and handbooks. Tag each one to the practices it evidences.
      </p>

      <form ref={formRef} action={submit} className="mt-4 grid gap-2 sm:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Title, e.g. Language Policy 2026-27"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 sm:col-span-2"
        />
        <select
          name="kind"
          required
          defaultValue="POLICY"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          name="academicYear"
          placeholder="Academic year, e.g. 2026-27"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
        />
        <label className="text-xs text-slate-500 flex flex-col gap-1">
          Last reviewed
          <input
            name="reviewedOn"
            type="date"
            className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">
          File
          <input
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx"
            className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          />
        </label>
        <textarea
          name="description"
          rows={2}
          placeholder="What is it, and what does it evidence? (optional)"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 sm:col-span-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1 w-fit"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Add document
        </button>
      </form>

      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}

      <ul className="mt-5 divide-y divide-slate-100 dark:divide-zinc-800">
        {documents.length === 0 && (
          <li className="py-3 text-sm text-slate-500">
            No documents yet. Purpose and Environment cannot be evidenced without them.
          </li>
        )}
        {documents.map((d) => (
          <li key={d.id} className="py-3">
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  {d.title}
                </a>
                <p className="text-xs text-slate-500 mt-0.5">
                  {d.kind}
                  {d.academicYear ? ` · ${d.academicYear}` : ""}
                  {d.reviewedOn ? ` · reviewed ${d.reviewedOn}` : " · never reviewed"}
                </p>
                {d.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{d.description}</p>}
                <EvidenceTagger kind="DOCUMENT" recordId={d.id} tags={d.tags} canConfirm />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck, lint**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet`
Expected: clean.

- [ ] **Step 4: Verify the upload, including the failure path**

As the Principal, upload a small PDF. Expected: it appears in the list with a working link, and tagging it to `purpose-0.1` turns that practice's count to 1.

Then submit the form with no file. Expected: "Choose a file to upload." and no row added.

`BLOB_READ_WRITE_TOKEN` must be set in `.env` for the upload to succeed. If it is missing, the action throws — note that and set it before continuing.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(portals)/admin/accreditation"
git commit -m "Add the accreditation document register with tagging"
```

---

## Task 10: Visiting-team portal

**Files:**
- Create: `src/lib/visiting.ts`
- Create: `src/app/(portals)/visitor/layout.tsx`
- Create: `src/app/(portals)/visitor/page.tsx`
- Create: `src/app/(portals)/visitor/VisitorClient.tsx`
- Modify: `src/lib/portals.ts`
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `coverageSummary`, `TONE_META` from Task 2; `sourceOf` from Task 3; taxonomy from Task 1.
- Produces: `VISITOR_ROLE`, `VISITOR_SLUG`, `VISITOR_PORTAL_ROLES`, `isVisitorRole` from `src/lib/visiting.ts`.

- [ ] **Step 1: Write the role module**

Create `src/lib/visiting.ts`:

```ts
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
```

- [ ] **Step 2: Add the middleware guard**

In `src/middleware.ts`:

Import it beside the operations import:

```ts
import { VISITOR_PORTAL_ROLES, isVisitorRole } from '@/lib/visiting';
```

Add `/visitor` to `isProtectedRoute`:

```ts
    path.startsWith('/operations') ||
    path.startsWith('/visitor');
```

Add the guard and the containment redirect after the operations block:

```ts
    // The visiting-team portal: the visitor themselves, plus management so the
    // school can preview what it is showing.
    if (path.startsWith('/visitor') && !VISITOR_PORTAL_ROLES.includes(role)) {
      const home = role === 'PRINCIPAL' || role === 'SUPER_ADMIN' ? '/admin' : '/';
      return NextResponse.redirect(new URL(home, request.url));
    }
    // A visitor has no business anywhere else in the app. Everything else is
    // already refused by the allow-list checks above; this turns the resulting
    // blank landing page into their own portal.
    if (isVisitorRole(role) && !path.startsWith('/visitor')) {
      return NextResponse.redirect(new URL('/visitor', request.url));
    }
```

- [ ] **Step 3: Add the login door**

In `src/lib/portals.ts`, add to `PORTALS` after the operations entry:

```ts
  {
    slug: "visitor",
    label: "Visiting Team",
    loginTitle: "IB Visiting Team",
    sampleEmail: "visitor@edusphere.com",
  },
```

- [ ] **Step 4: Write the visitor layout**

Create `src/app/(portals)/visitor/layout.tsx`:

```tsx
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { VISITOR_PORTAL_ROLES } from "@/lib/visiting";

/**
 * Deliberately not AppShell. The visiting team gets one page, so a collapsible
 * sidebar of areas they cannot open would be a menu of locked doors.
 */
export default async function VisitorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !VISITOR_PORTAL_ROLES.includes(session.user.role)) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">EduSphere 360</p>
          <h1 className="font-bold text-slate-800 dark:text-slate-100">IB Evidence — Visiting Team</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Write the visitor page**

Create `src/app/(portals)/visitor/page.tsx`:

```tsx
import prisma from "@/lib/prisma";
import { coverageSummary, type TagFact } from "@/lib/accreditation/coverage";
import { sourceOf } from "@/lib/accreditation/source";
import { CATEGORY_ORDER, EVIDENCE_KIND_LABELS, PRACTICES } from "@/lib/accreditation/standards";
import VisitorClient from "./VisitorClient";

export const dynamic = "force-dynamic";

/**
 * What the visiting team sees: confirmed evidence only.
 *
 * Suggested and rejected tags are filtered out in the query rather than in the
 * component, so the internal triage never reaches the browser at all. A team
 * should see the school's evidence, not its workings.
 */
export default async function VisitorPage() {
  const tags = await prisma.evidenceTag.findMany({
    where: { status: "CONFIRMED" },
    include: {
      lessonPlan: { select: { title: true, subjectName: true } },
      portfolioItem: { select: { title: true, student: { select: { name: true } } } },
      assessmentResult: { select: { title: true, student: { select: { name: true } } } },
      // Teacher has no `name` column of its own — it lives on the related User.
      observation: { select: { focusArea: true, teacher: { select: { user: { select: { name: true } } } } } },
      document: { select: { title: true, fileUrl: true } },
    },
    orderBy: { taggedAt: "desc" },
  });

  const facts: TagFact[] = tags.map((t) => ({
    standardKey: t.standardKey,
    kind: sourceOf(t).kind,
    status: t.status,
    taggedAt: t.taggedAt,
  }));
  const summary = coverageSummary(facts);

  const practices = PRACTICES.map((p) => {
    const cell = summary.byPractice.get(p.key)!;
    return {
      key: p.key,
      category: p.category,
      title: p.title,
      description: p.description,
      tone: cell.tone,
      count: cell.count,
      evidence: tags
        .filter((t) => t.standardKey === p.key)
        .map((t) => {
          const { kind } = sourceOf(t);
          const label =
            kind === "LESSON_PLAN"
              ? `${t.lessonPlan!.title} · ${t.lessonPlan!.subjectName}`
              : kind === "PORTFOLIO_ITEM"
              ? `${t.portfolioItem!.title} · ${t.portfolioItem!.student.name}`
              : kind === "ASSESSMENT_RESULT"
              ? `${t.assessmentResult!.title} · ${t.assessmentResult!.student.name}`
              : kind === "OBSERVATION"
              ? `${t.observation!.focusArea ?? "Lesson observation"} · ${t.observation!.teacher.user.name}`
              : t.document!.title;
          return {
            id: t.id,
            kindLabel: EVIDENCE_KIND_LABELS[kind],
            label,
            href: kind === "DOCUMENT" ? t.document!.fileUrl : null,
            note: t.note,
          };
        }),
    };
  });

  return (
    <VisitorClient
      practices={practices}
      summary={{ wellEvidenced: summary.wellEvidenced, thin: summary.thin, gaps: summary.gaps, total: PRACTICES.length }}
      categoryOrder={[...CATEGORY_ORDER]}
      hasAnyEvidence={tags.length > 0}
    />
  );
}
```

- [ ] **Step 6: Write the visitor client, empty state included**

Create `src/app/(portals)/visitor/VisitorClient.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FolderOpen } from "lucide-react";

import { TONE_META, type Tone } from "@/lib/accreditation/coverage";
import { CATEGORY_LABELS, type Category } from "@/lib/accreditation/standards";

interface PracticeRow {
  key: string;
  category: Category;
  title: string;
  description: string;
  tone: Tone;
  count: number;
  evidence: { id: string; kindLabel: string; label: string; href: string | null; note: string | null }[];
}

export default function VisitorClient({
  practices,
  summary,
  categoryOrder,
  hasAnyEvidence,
}: {
  practices: PracticeRow[];
  summary: { wellEvidenced: number; thin: number; gaps: number; total: number };
  categoryOrder: Category[];
  hasAnyEvidence: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // "0 of 18 well evidenced" on a fresh database reads as broken software
  // rather than as a process nobody has started, so say which it is.
  if (!hasAnyEvidence) {
    return (
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 text-center">
        <FolderOpen size={28} className="mx-auto text-slate-300" />
        <h2 className="mt-3 font-bold text-slate-800 dark:text-slate-100">No evidence published yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          The school has not yet confirmed any evidence against the {summary.total} IB practices. This view
          fills as the IB coordinator confirms what teachers tag.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {summary.wellEvidenced} of {summary.total} practices well evidenced · {summary.thin} thin ·{" "}
        {summary.gaps} {summary.gaps === 1 ? "gap" : "gaps"}
      </p>

      {categoryOrder.map((category) => {
        const rows = practices.filter((p) => p.category === category);
        return (
          <section
            key={category}
            className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5"
          >
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{CATEGORY_LABELS[category]}</h2>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {rows.map((p) => {
                const open = expanded === p.key;
                const meta = TONE_META[p.tone];
                return (
                  <li key={p.key} className="py-3">
                    <button
                      onClick={() => setExpanded(open ? null : p.key)}
                      className="w-full flex items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-400">{p.count}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </div>
                    </button>
                    {open && (
                      <div className="mt-2 pl-1">
                        {p.evidence.length === 0 ? (
                          <p className="text-xs text-slate-500">No evidence published against this practice.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {p.evidence.map((e) => (
                              <li key={e.id} className="text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-semibold">{e.kindLabel}:</span>{" "}
                                {e.href ? (
                                  <a
                                    href={e.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    {e.label} <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  e.label
                                )}
                                {e.note && <span className="block text-slate-400 italic">“{e.note}”</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7: Typecheck, lint, test**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet && npm test`
Expected: clean.

- [ ] **Step 8: Prove the containment both ways**

The visitor account arrives in Task 12; for now create one by hand:

```bash
npx prisma db execute --stdin <<'SQL'
UPDATE "User" SET role = 'IB_VISITOR' WHERE email = 'visitor@edusphere.com';
SQL
```

If that account does not exist yet, temporarily flip any spare account's role, and flip it back after.

Signed in as `IB_VISITOR`, check each of these. Expected in every case: redirected to `/visitor`.

- `/admin`
- `/admin/accreditation`
- `/teacher/planner`
- `/student/grades`
- `/parent/fees`
- `/operations/canteen`

Then sign in as the Principal and open `/visitor`. Expected: redirected to `/admin`, because a Principal has the fuller dashboard.

- [ ] **Step 9: Verify the empty state — the last Review Focus case**

The database has no confirmed tags yet (Task 7's probes were cleaned up, Task 12 has not run), which is exactly the condition to test. Signed in as `IB_VISITOR`, open `/visitor`.

Expected: "No evidence published yet", explaining that the view fills as the coordinator confirms tags. **Not** "0 of 18 practices well evidenced", which reads as broken software rather than an unstarted process.

If any confirmed tag survives from an earlier task, clear it first:

```bash
npx prisma db execute --stdin <<'SQL'
DELETE FROM "EvidenceTag";
SQL
```

- [ ] **Step 10: Commit**

```bash
git add src/lib/visiting.ts src/lib/portals.ts src/middleware.ts "src/app/(portals)/visitor"
git commit -m "Add the read-only visiting-team portal"
```

---

## Task 11: Retire the preview screen

**Files:**
- Modify: `src/app/(portals)/admin/ai-insights/accreditation-evidence/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Replace the mock with a redirect**

Replace the whole contents of `src/app/(portals)/admin/ai-insights/accreditation-evidence/page.tsx`:

```tsx
import { redirect } from "next/navigation";

/**
 * This was the "Accreditation Evidence Finder" preview: a scripted screen that
 * described coverage it had not measured. /admin/accreditation now computes the
 * same judgement from real tags, so the preview is superseded rather than
 * merely duplicated.
 *
 * Kept as a redirect because the AI Insights hub, the sidebar and any
 * bookmark still point here.
 */
export default function AccreditationEvidencePage() {
  redirect("/admin/accreditation");
}
```

- [ ] **Step 2: Repoint both inbound links**

Two files link to the old route. Both must change, or the hub and the IB Programmes page keep routing users through a redirect.

`src/app/(portals)/admin/ai-insights/page.tsx:29` — change the `href` and the wording, since it is no longer a preview:

```ts
  { href: "/admin/accreditation", icon: <FolderSearch size={18} />, title: "Accreditation & Evidence", description: "Evidence for each IB practice, tagged as teachers work. Not a preview.", audience: "both" },
```

`src/app/(portals)/admin/programmes/page.tsx:167` — change the `href`:

```tsx
          href="/admin/accreditation"
```

If the AI Insights hub renders a PREVIEW badge from a shared list rather than per-card, remove this
entry's membership of that list instead of editing a badge prop.

- [ ] **Step 3: Typecheck, lint**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet`
Expected: clean.

- [ ] **Step 4: Verify and commit**

Open `/admin/ai-insights/accreditation-evidence`. Expected: lands on `/admin/accreditation`. Open the AI Insights hub. Expected: the accreditation card goes straight there with no PREVIEW badge.

```bash
git add "src/app/(portals)/admin/ai-insights"
git commit -m "Redirect the accreditation preview to the real module"
```

---

## Task 12: Seed data

**Files:**
- Modify: `prisma/seed.ts`
- Create: `public/evidence/` with six placeholder PDFs

**Interfaces:**
- Consumes: `PRACTICES` from Task 1.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the placeholder documents**

Create `public/evidence/` and put six small PDFs in it, named:

```
language-policy-2026-27.pdf
inclusion-policy-2026-27.pdf
assessment-policy-2026-27.pdf
academic-integrity-policy-2026-27.pdf
governing-body-minutes-2026-04.pdf
curriculum-overview-2026-27.pdf
```

Any valid PDF will do; these stand in for the school's real documents.

- [ ] **Step 2: Seed the visitor account, documents and tags**

Append to the body of `main()` in `prisma/seed.ts`, before its final log:

```ts
  // ── Accreditation evidence ─────────────────────────────────────────────────
  // A deliberately imperfect spread: 4 practices well evidenced, 11 thin, 3
  // gaps. Most practices are evidenced exactly once, which is precisely what
  // THIN means — a full house would look like seeded data, and the thinness is
  // what makes the coordinator dashboard worth opening.
  const visitor = await prisma.user.upsert({
    where: { email: "visitor@edusphere.com" },
    update: { role: "IB_VISITOR" },
    create: {
      email: "visitor@edusphere.com",
      name: "IB Visiting Team",
      role: "IB_VISITOR",
      password: SEED_PASSWORD,
    },
  });
  console.log(`Visiting-team account: ${visitor.email}`);

  const coordinator = await prisma.user.findFirst({
    where: { role: { in: ["PRINCIPAL", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (!coordinator) throw new Error("Seed the admin accounts before accreditation evidence.");

  const documentSeeds = [
    { title: "Language Policy 2026-27", kind: "POLICY", file: "language-policy-2026-27.pdf", keys: ["culture-2.1"] },
    { title: "Inclusion Policy 2026-27", kind: "POLICY", file: "inclusion-policy-2026-27.pdf", keys: ["culture-2.2", "environment-1.4"] },
    { title: "Assessment Policy 2026-27", kind: "POLICY", file: "assessment-policy-2026-27.pdf", keys: ["culture-2.3"] },
    { title: "Academic Integrity Policy 2026-27", kind: "POLICY", file: "academic-integrity-policy-2026-27.pdf", keys: ["culture-2.4"] },
    { title: "Governing Body Minutes, April 2026", kind: "MINUTES", file: "governing-body-minutes-2026-04.pdf", keys: ["purpose-0.1", "purpose-0.2", "environment-1.1", "environment-1.2"] },
    { title: "Curriculum Overview 2026-27", kind: "PLAN", file: "curriculum-overview-2026-27.pdf", keys: ["learning-3.1"] },
  ];

  for (const seed of documentSeeds) {
    const doc = await prisma.evidenceDocument.create({
      data: {
        title: seed.title,
        kind: seed.kind,
        fileUrl: `/evidence/${seed.file}`,
        fileType: "application/pdf",
        academicYear: "2026-27",
        reviewedOn: new Date("2026-04-15"),
        uploadedById: coordinator.id,
      },
    });
    for (const key of seed.keys) {
      await prisma.evidenceTag.create({
        data: {
          standardKey: key,
          status: "CONFIRMED",
          taggedById: coordinator.id,
          confirmedById: coordinator.id,
          confirmedAt: new Date(),
          documentId: doc.id,
        },
      });
    }
  }

  // Classroom evidence. Two kinds per practice where possible, because a
  // practice evidenced only one way classifies as thin however many tags it
  // has — which is exactly what should happen to learning-3.3 below.
  const seedPlans = await prisma.lessonPlan.findMany({ take: 6, select: { id: true, teacher: { select: { userId: true } } } });
  const seedObservations = await prisma.observation.findMany({ take: 4, select: { id: true } });
  const seedPortfolio = await prisma.portfolioItem.findMany({ take: 4, select: { id: true } });
  const seedAssessments = await prisma.assessmentResult.findMany({ take: 4, select: { id: true } });

  async function tag(key: string, data: Record<string, string>, status = "CONFIRMED") {
    await prisma.evidenceTag.create({
      data: {
        standardKey: key,
        status,
        taggedById: coordinator!.id,
        ...(status === "CONFIRMED" ? { confirmedById: coordinator!.id, confirmedAt: new Date() } : {}),
        ...data,
      },
    });
  }

  // learning-3.1's third piece of evidence is the Curriculum Overview document seeded
  // above, NOT an observation: its expects is ["LESSON_PLAN", "DOCUMENT"], so an
  // observation here would be data the tag picker could never have produced.
  if (seedPlans[0]) await tag("learning-3.1", { lessonPlanId: seedPlans[0].id });
  if (seedPlans[1]) await tag("learning-3.1", { lessonPlanId: seedPlans[1].id });

  if (seedPlans[2]) await tag("learning-3.2", { lessonPlanId: seedPlans[2].id });
  if (seedObservations[1]) await tag("learning-3.2", { observationId: seedObservations[1].id });
  if (seedPortfolio[0]) await tag("learning-3.2", { portfolioItemId: seedPortfolio[0].id });

  // Three tags, one kind — thin on purpose, and the clearest demonstration of
  // why the single-kind rule exists.
  if (seedPlans[3]) await tag("learning-3.3", { lessonPlanId: seedPlans[3].id });
  if (seedPlans[4]) await tag("learning-3.3", { lessonPlanId: seedPlans[4].id });
  if (seedPlans[5]) await tag("learning-3.3", { lessonPlanId: seedPlans[5].id });

  if (seedAssessments[0]) await tag("learning-3.4", { assessmentResultId: seedAssessments[0].id });
  if (seedAssessments[1]) await tag("learning-3.4", { assessmentResultId: seedAssessments[1].id });
  if (seedPlans[0]) await tag("learning-3.4", { lessonPlanId: seedPlans[0].id });

  if (seedAssessments[2]) await tag("learning-3.5", { assessmentResultId: seedAssessments[2].id });
  if (seedPortfolio[1]) await tag("learning-3.5", { portfolioItemId: seedPortfolio[1].id });
  if (seedPortfolio[2]) await tag("learning-3.5", { portfolioItemId: seedPortfolio[2].id });

  if (seedObservations[2]) await tag("environment-1.3", { observationId: seedObservations[2].id });

  // Two suggestions left waiting, so the confirm queue is not empty on a first
  // look at the dashboard.
  if (seedPortfolio[3]) await tag("learning-3.6", { portfolioItemId: seedPortfolio[3].id }, "SUGGESTED");
  if (seedObservations[3]) await tag("culture-2.2", { observationId: seedObservations[3].id }, "SUGGESTED");

  console.log(`Accreditation: ${documentSeeds.length} documents seeded, evidence tagged across practices.`);
```

- [ ] **Step 3: Apply the accreditation seed ONLY — never `prisma db seed`**

> **Do not run `npx prisma db seed` against a database that already holds data.**
> `prisma/seed.ts` contains 26 plain `.create()` calls against only 7 `.upsert()` calls, so a
> second run duplicates students, attendance and assessment records rather than reconciling them.
> The configured database is the live Supabase instance holding 173 students and ~10,660 rows.
> The seed script is not destructive — it has no `deleteMany`, `TRUNCATE` or `DROP` — but it is
> emphatically not idempotent.
>
> The section added in Step 2 exists so that a **fresh** database gets this evidence. To apply it
> to a database that already exists, run only that section via a standalone script.

Write a one-off script that performs exactly the Step 2 block and nothing else — the visitor
account upsert, the `EvidenceDocument` rows, and the `EvidenceTag` rows — and run it with
`node`. It touches only `User` (one upsert of a new account), `EvidenceDocument` and
`EvidenceTag`. Delete the script afterwards; it is not committed.

Expected: the two new log lines, no errors. A `P2002` means the accreditation seed has already
been applied — clear the two evidence tables and re-run:

```bash
npx prisma db execute --stdin <<'SQL'
DELETE FROM "EvidenceTag";
DELETE FROM "EvidenceDocument";
SQL
```

- [ ] **Step 4: Verify the spread matches the intent**

Open `/admin/accreditation` as the Principal. Expected:

- Header reads **4 of 18 well evidenced · 11 thin · 3 gaps**. Most practices are evidenced exactly once, so THIN is the common case — correct, not a seeding mistake.
- `learning-3.3` is **Thin** despite three tags, because all three are lesson plans. The single-kind rule doing its job, and the clearest thing to point at in a demo.
- `learning-3.1`, `3.2`, `3.4` and `3.5` are the four **Well evidenced** ones.
- The confirm queue holds two suggestions.
- Purpose and Environment are no longer all gaps; `purpose-0.3` and `culture-2.5` remain gaps, along with `learning-3.6` whose only tag is still suggested.

Open `/visitor` as `visitor@edusphere.com`. Expected: confirmed evidence only, the two suggestions absent, and `learning-3.3` still reading Thin.

- [ ] **Step 5: Typecheck, lint, test, commit**

Run: `./node_modules/.bin/tsc --noEmit && npx eslint src --quiet && npm test`
Expected: clean.

```bash
git add prisma/seed.ts public/evidence
git commit -m "Seed accreditation evidence, documents and the visiting-team account"
```

---

## Task 13: Update the project documentation

**Files:**
- Modify: `PROJECT_CONTEXT.md`

**Interfaces:** none.

- [ ] **Step 1: Record the module and the new role**

In `PROJECT_CONTEXT.md` section 3, add to the Admin/Principal list:

```
**Accreditation & Evidence** (IB Programme Standards and Practices — teachers tag lesson plans,
portfolio items, assessments and observations as evidence from inside their own screens; the
coordinator confirms; coverage classifies each of 18 practices as well evidenced / thin / gap, where
a practice evidenced only one way stays thin; document register for policies and minutes)
```

Add a new portal line:

```
**Visiting team** (`IB_VISITOR`, `/visitor`): read-only confirmed evidence, nothing else. Demo login
`visitor@edusphere.com`.
```

In section 4, add `visitor@edusphere.com` to the demo logins.

- [ ] **Step 2: Commit**

```bash
git add PROJECT_CONTEXT.md
git commit -m "Document the accreditation module and the visiting-team role"
```
