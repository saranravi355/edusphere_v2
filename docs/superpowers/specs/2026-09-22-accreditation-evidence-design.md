# Accreditation & Evidence Module — Design

**Date:** 22 September 2026
**Status:** Approved design, awaiting implementation plan
**Origin:** Competitive review of [Toddle](https://www.toddleapp.com/) on 21 September 2026 identified
accreditation management as one of three Tier 1 gaps. Accreditation and eCoursework tracking were
selected as the first two builds.

## 1. Purpose

Let the school evidence its IB Programme Standards and Practices from inside the work teachers already
do, show the IB coordinator where evidence is thin, and give a visiting team a read-only view of it.

Replaces the scripted preview at `/admin/ai-insights/accreditation-evidence` with a working module.

### Intended outcome

A teacher tags a lesson plan as evidence for a practice. The coordinator confirms it. A dashboard
classifies each of eighteen practices as well evidenced, thin, or a gap, computed from confirmed tags.
A visiting-team login browses the confirmed evidence and nothing else.

### Scope of this build

This is a **demonstration deployment**, consistent with the rest of EduSphere 360. That decision sets
three boundaries:

- A **representative** standards set (~18 practices), not the exhaustive official list.
- Visiting-team access as a **demo role** reachable from the login page, not provisioned external accounts.
- **Seeded evidence**, so the dashboard reads convincingly on first open.

The tagging and the coverage arithmetic are real, not scripted. Only the breadth of the taxonomy and the
provenance of the data are demo-scale.

### Decisions taken during design

| Question | Decision |
|---|---|
| Purpose of the build | Demo credibility |
| Evidence types | Tag existing records **and** a document register |
| Who tags | Teachers tag; coordinator confirms before it counts |
| Tag attachment | Explicit nullable foreign keys (approach A), not polymorphic |
| Taxonomy storage | Static TypeScript constant, not a database table |
| Student names in visitor view | Full names |

## 2. Data model

### 2.1 Taxonomy — `src/lib/accreditation/standards.ts`

Static, version-controlled reference data. Not the school's data, and wanted at import time by both the
tag control and the dashboard.

```ts
export type Category = "PURPOSE" | "ENVIRONMENT" | "CULTURE" | "LEARNING";
export type EvidenceKind =
  | "LESSON_PLAN" | "PORTFOLIO_ITEM" | "ASSESSMENT_RESULT" | "OBSERVATION" | "DOCUMENT";

export interface Practice {
  /** Stable key stored on every tag, e.g. "learning-3.2". Never renumber. */
  key: string;
  category: Category;
  title: string;
  description: string;
  /** Evidence kinds that can plausibly satisfy this practice. Drives the picker. */
  expects: EvidenceKind[];
}
```

The four categories follow the IB Programme Standards and Practices (2020): Purpose, Environment,
Culture, Learning. The existing preview page already uses this taxonomy correctly and its labels are the
starting point.

`expects` exists so the tag control on a lesson-plan screen offers the six practices a lesson plan can
evidence rather than all eighteen.

Trade-off accepted: the school cannot add its own practices without a deploy. A `Standard` table can
absorb school-authored practices later without changing `EvidenceTag`.

### 2.2 `EvidenceTag`

```prisma
model EvidenceTag {
  id            String    @id @default(cuid())
  standardKey   String    // matches Practice.key
  status        String    @default("SUGGESTED") // SUGGESTED | CONFIRMED | REJECTED
  note          String?   // why this evidences the practice
  taggedById    String
  taggedBy      User      @relation("TaggedBy", fields: [taggedById], references: [id])
  taggedAt      DateTime  @default(now())
  confirmedById String?
  confirmedBy   User?     @relation("ConfirmedBy", fields: [confirmedById], references: [id])
  confirmedAt   DateTime?

  // Exactly one of the following five is non-null.
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

  @@unique([standardKey, lessonPlanId])
  @@unique([standardKey, portfolioItemId])
  @@unique([standardKey, assessmentResultId])
  @@unique([standardKey, observationId])
  @@unique([standardKey, documentId])
  @@index([standardKey, status])
}
```

**Why explicit foreign keys over `sourceType` + `sourceId`:** Prisma cannot enforce a polymorphic
reference, so a deleted lesson plan would leave an orphan tag that still counts toward coverage. A
dashboard that silently overstates evidence is the exact failure this module exists to prevent. The cost
is one column and one migration per new evidence kind, which will happen rarely. It also matches the
schema's prevailing style: explicit relations throughout, no polymorphism in any of the 69 models.

**Raw SQL required in the migration:** a check constraint that exactly one of the five foreign keys is
non-null. Prisma cannot express it.

Nothing further is needed for uniqueness — the five `@@unique` pairs work as written, because Postgres
treats NULLs as distinct and so permits many rows with a null in any one column.

### 2.3 `EvidenceDocument`

```prisma
model EvidenceDocument {
  id           String   @id @default(cuid())
  title        String
  kind         String   // POLICY | MINUTES | HANDBOOK | PLAN | REPORT
  description  String?
  fileUrl      String   // @vercel/blob
  fileType     String?
  academicYear String?
  reviewedOn   DateTime?
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now())
  tags         EvidenceTag[]
}
```

Without this, the Purpose and Environment categories have nothing to evidence — those standards are
carried by policies, board minutes and handbooks, not classroom artefacts.

`reviewedOn` exists because IB asks when a policy was last reviewed. The preview page's phrase "dated
within the review cycle" depends on this field.

### 2.4 Coverage is computed, never stored

One `groupBy` on `standardKey` where `status = 'CONFIRMED'`. Eighteen practices and a few hundred tags
need no cache, and a stored count is a thing that can go stale and lie.

## 3. The tag control

### 3.1 Component

`src/components/accreditation/EvidenceTagger.tsx`, props `{ kind, recordId, tags, canConfirm }`.

- Existing tags render as chips, reusing the chip idiom in `PlannerClient.tsx` so it looks native.
- A "Tag as evidence" button opens a picker filtered by `practicesFor(kind)`.
- Optional note field.
- When `canConfirm` is true, each chip carries an inline confirm/reject.

### 3.2 Server actions

One file, `src/app/(portals)/admin/accreditation/actions.ts`, imported by all five hosts.

Co-location is cosmetic. As `src/lib/authz.ts` documents, every `"use server"` function is an
independently addressable HTTP endpoint regardless of which page imports it, so the guard inside is what
matters.

| Action | Guard |
|---|---|
| `tagEvidence` | Caller owns the record. `teacherScope.ts` already answers "does this teacher teach this student". Admin roles also permitted. |
| `confirmTag`, `rejectTag` | `ADMIN_ROLES` only. |

### 3.3 Hosts

| Evidence kind | Screen | Who tags | Initial status |
|---|---|---|---|
| Lesson plan | `teacher/planner`, expanded card | Teacher, own plans | SUGGESTED |
| Portfolio item | `teacher/students/[id]` | Teacher | SUGGESTED |
| Assessment result | `teacher/students/[id]` | Teacher | SUGGESTED |
| Observation | `admin/staff/appraisal` | Coordinator | CONFIRMED |
| Document | `admin/accreditation` upload screen | Coordinator | CONFIRMED |

The initial status is not a property of the evidence kind. **One rule produces the column above:** a tag
is born `CONFIRMED` when its creator holds `ADMIN_ROLES`, and `SUGGESTED` otherwise. Observations and
documents are only ever tagged by the coordinator, so they always land confirmed; an admin tagging a
lesson plan also lands confirmed, which is correct — there is nobody above them to confirm it.

**Students do not tag.** A student asserting that their own work evidences an IB standard is not
evidence. `/student/portfolio` instead displays confirmed tags read-only, so a student can see that
their work evidences a practice.

**The suggest-then-confirm flow governs three of the five kinds.** Observations and documents are
created by the coordinator, so their tags are born `CONFIRMED`; asking someone to confirm their own tag
is theatre.

## 4. Coordinator dashboard

Route `src/app/(portals)/admin/accreditation/`.

**`PRINCIPAL_ADMIN_PATHS` in `src/lib/authz.ts` must list `/admin/accreditation`.** The default there is
management-only, so a new `/admin` area is unreachable for a Principal until named deliberately — and
the Principal is usually the person who owns accreditation.

Page contents, in order:

1. **Confirm queue** — suggested tags awaiting the coordinator, newest first: practice, record, tagger,
   note, confirm/reject inline. The coordinator's recurring job, so it leads rather than sitting under a
   summary.
2. **Header line** — "11 of 18 well evidenced · 4 thin · 3 gaps". Plain computed text.
3. **Four category sections** — Purpose, Environment, Culture, Learning. Each a table of its practices:
   practice, confirmed count, tone badge, expanding to the evidence list with links to source records.

**No chart.** Eighteen practices across three states is a table's job. `recharts` is available but a
stacked bar per category would be decoration over numbers already legible.

### 4.1 Classification

`classifyCoverage(tags, currentYear)`:

- **GAP** — zero confirmed tags.
- **THIN** — one or two confirmed tags, **or** every tag from a single evidence kind, **or** nothing from
  the current academic year.
- **WELL_EVIDENCED** — three or more confirmed, spanning at least two evidence kinds, with at least one
  from the current academic year.

The single-kind rule carries the most weight. It is derived from the preview page's own complaint about
Approaches to teaching — "Only the curriculum overview maps to this standard. There is no
lesson-observation record" — so a practice evidenced five times by five lesson plans and nothing else
reads as thin without anyone writing prose about it.

### 4.2 Retiring the preview

`/admin/ai-insights/accreditation-evidence` redirects to `/admin/accreditation` and the preview page is
deleted. The 53 scripted preview screens are otherwise left alone by standing decision; this one is
superseded by the module that replaces it.

### 4.3 Out of scope

PDF export of the evidence file. `pdf-lib` is available, but the visiting team is given the dashboard.

## 5. Visiting-team portal

### 5.1 Role and routing

`src/lib/visiting.ts` mirrors `src/lib/operations.ts` as the single source of truth: role `IB_VISITOR`,
slug `visitor`, and the set permitted to open the portal — `IB_VISITOR` plus `SUPER_ADMIN`, so
management can preview the visiting-team view without a second account. Same reasoning
`OPERATIONS_ADMIN_ROLES` gives for not locking the school out of its own canteen.

Route `src/app/(portals)/visitor/`. A sixth entry in `PORTALS` (`src/lib/portals.ts`) puts it on the
login page, which is the point for a demo.

`src/middleware.ts` needs three additions, all following shapes already present:

1. `/visitor` added to `isProtectedRoute`.
2. A guard bouncing anyone outside the permitted set.
3. A containment redirect sending `IB_VISITOR` to `/visitor` from anywhere else, matching the existing
   `isOperationsRole(role) && !path.startsWith('/operations')` line.

### 5.2 Read-only by construction

Every portal check in middleware is an allow-list (`role !== 'STUDENT'` → redirect), so a new role
reaches nothing it is not named in. The same holds for mutations: `ADMIN_ROLES` and `teacherScope` are
allow-lists, so `IB_VISITOR` fails every server action in the application without a line of new code.

The visitor routes then import no actions at all, making read-only a property of the code rather than a
promise in a comment.

### 5.3 What the visitor sees

The four category sections and the evidence detail, **confirmed tags only**. Not the confirm queue, not
suggested tags, not rejected ones. A visiting team should see the school's evidence, not its internal
triage.

Student names appear in full on portfolio and assessment evidence, which is what a real evaluation
involves and removes the need for a name-masking layer.

### 5.4 Out of scope

Time-boxed visit windows, and an audit of what each visitor viewed. Both are genuine requirements for a
real visit; neither earns its place in a demo build, and both bolt on later without altering this design.

## 6. Error handling

| Case | Handling |
|---|---|
| Duplicate tag | Unique index raises Prisma `P2002`. Caught, returned as "already tagged against this practice". Never a 500. |
| Tagging a record the caller does not own | Guard throws; the action returns an error the tagger sees. |
| Check-constraint violation | Only reachable through a bug, never user input. Let it throw loudly — swallowing it hides the one thing the constraint exists to catch. |
| Blob upload failure | Upload to `@vercel/blob` first, insert the `EvidenceDocument` row only on success, so the register never lists a dead link. |

**Not an error, worth naming:** deleting a lesson plan cascades its tags, so coverage can drop without
anyone opening the module. That is correct, and it is the integrity the explicit-foreign-key model buys.

## 7. Testing

Pure logic lives in `src/lib/accreditation/`, following the pattern of `grading/gradeBands.ts` and
`buildTimetable.ts` — decisions as pure functions with colocated tests, Prisma calls kept outside them.
TDD applies: tests first.

| Module | Under test |
|---|---|
| `coverage.ts` | `classifyCoverage` — no tags; one or two; three from a single kind; three across kinds all stale; three across kinds with one current; suggested ignored; rejected ignored |
| `standards.ts` | `practicesFor(kind)` returns only practices whose `expects` includes that kind; every `key` unique |
| `source.ts` | `sourceOf(tag)` returns the single set foreign key; throws on zero set; throws on more than one set |

Verification loop, per `PROJECT_CONTEXT.md`:

```
./node_modules/.bin/tsc --noEmit
npx eslint src --quiet
npm test
```

## 8. Seed data

Demo credibility depends on this. Seeded into `prisma/seed.ts`:

- Tags across existing lesson plans, observations and portfolio items producing a realistic spread —
  approximately 11 well evidenced, 4 thin, 3 gaps. Not a perfect score; gaps are what make the
  dashboard look real.
- A handful of `EvidenceDocument` rows pointing at placeholder PDFs in `/public`.
- An `IB_VISITOR` account at `visitor@edusphere.com`, consistent with the shared demo password.

## 9. Operational notes

- The schema change needs `npx prisma migrate dev` run from the developer's own machine. The assistant
  sandbox cannot reach the database.
- Migrations reach the live database only on a production deploy of `main`, via
  `scripts/migrate-deploy.mjs`. Apply by hand with `npm run db:migrate`.
- Restart the dev server after the schema change so the Prisma client regenerates.

## 10. Open questions

None. All design decisions listed in §1 are settled.
