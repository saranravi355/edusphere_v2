# EduSphere 360 — Developer Guide

Everything you need to run the project, understand how it's built, and add features confidently.
Read this once end-to-end before you start; it's meant to answer the questions you'd otherwise have to ask.

---

## 1. What this is

**EduSphere 360** is an AI-assisted school-management platform for an **IB World School** (Bengaluru, India).
It has four role-based portals — **Admin/Principal, Teacher, Student, Parent** — sharing one database.

Two rules are permanent (see `AGENTS.md`):

1. **Everything is IB.** Grades are the IB **1–7** scale (never percentages), programmes are **PYP / MYP / DP**,
   MYP uses **criteria A–D (0–8)**, DP uses **HL/SL**, **/45** total, **TOK / EE / CAS**, **ATL** skills and the
   IB learner profile. Never use CBSE/IGCSE language ("percentage", "board exam").
2. **All demo data is Indian.** Indian names, Bengaluru addresses, **₹** currency (`en-IN` formatting), +91 phones.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Server Components, Server Actions, Turbopack) |
| Language | **TypeScript 5**, **React 19** |
| Database | **SQLite** via **Prisma 5.22** (`prisma/dev.db`, committed to git) |
| Auth | Custom JWT cookie sessions with **`jose`** (`src/lib/session.ts`) |
| Styling | **Tailwind CSS 4**, shadcn/ui patterns, `next-themes` (dark mode), **lucide-react** icons |
| Charts / tables | **recharts**, **@tanstack/react-table** |
| Spreadsheets | **xlsx** (SheetJS) — powers bulk import/export |
| i18n | **i18next** + **react-i18next** (EN / HI / TA / KN) |
| Animation | **framer-motion** |
| Deploy | **Vercel** · source on **GitHub** (`saranravi355/edusphere_v2`) |

---

## 3. Getting started (local)

```bash
git clone https://github.com/saranravi355/edusphere_v2.git
cd edusphere_v2
npm install                 # runs `prisma generate` automatically (postinstall)
cp .env.example .env        # DATABASE_URL="file:./dev.db"
npm run dev                 # http://localhost:3000
```

The seeded database (`prisma/dev.db`) is committed, so you get a fully populated school on first run —
**173 students** with grades, attendance, fees, timetables, etc. No separate seed step is needed.

**Scripts** (`package.json`):

- `npm run dev` — dev server
- `npm run build` — `prisma generate && next build`
- `npm run start` — production server
- `npm run lint` — ESLint

**Demo logins** (password `password123` for everyone):

| Role | Email |
|---|---|
| Principal | `principal@edusphere.com` |
| Super Admin | `admin@edusphere.com` |
| Teacher (class teacher of DP1C) | `meena.k@edusphere.com` |
| Student (richest data) | `aarav.p@edusphere.com` |
| Parent (Aarav's) | `rahul.p@edusphere.com` |

---

## 4. Project structure

```
src/
  app/
    (portals)/                 # route group — all authenticated portals
      layout.tsx               # loads session + notifications, wraps AppShell
      loading.tsx / error.tsx / not-found.tsx   # global portal states
      admin/  teacher/  student/  parent/        # one folder per portal
    login/page.tsx             # login screen
    page.tsx                   # public landing / role picker
    actions.ts                 # global server actions (login, logout, notifications)
  components/
    layout/     AppShell, SideNav, TopNav
    ui/         PageHeader, Logo, ExportButton, Modal, card, etc.
    data/       ExportButton
    import/     BulkImportWizard (reusable import wizard)
    timetable/  TimetableGrid, TimetableManager
    dashboard/  SchoolSnapshot
  lib/
    prisma.ts          # Prisma client singleton (+ Vercel /tmp DB copy)
    session.ts         # encrypt / decrypt / getSession (JWT cookie)
    buildTimetable.ts  # builds a weekly timetable from a student's IB subjects
    bulkImport.ts      # shared types/helpers for the import wizard
    utils.ts           # cn() etc.
  i18n/locales/        en.json, hi.json, ta.json, kn.json
prisma/
  schema.prisma        # data model
  dev.db               # committed SQLite database (the seed data lives here)
public/                # static assets (logo.png, images)
```

Routes live under `src/app/(portals)/{admin|teacher|student|parent}/...`.
A feature is usually a folder with `page.tsx` (+ optionally `*Client.tsx` and `actions.ts`).

---

## 5. Core conventions (read this before writing a page)

### The page / Client / actions pattern

Each feature folder typically has:

- **`page.tsx`** — a **Server Component**. Guards the role, fetches data via `@/lib/prisma`, renders UI.
- **`*Client.tsx`** — a `"use client"` component, only when you need interactivity (state, effects).
- **`actions.ts`** — `"use server"` functions for mutations; they write via Prisma and call `revalidatePath(...)`.

Minimal page:

```tsx
import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const rows = await prisma.student.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader title="My Page" description="What this page does." />
      {/* ...render rows... */}
    </div>
  );
}
```

Server action:

```ts
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function doThing(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const value = String(formData.get("value") || "").trim();
  if (!value) return;
  await prisma.someModel.create({ data: { value } });
  revalidatePath("/portal/my-page");
}
```

Wire it directly into a form in a server component: `<form action={doThing}>…</form>`.

### Auth & roles

- Session is a JWT in an httpOnly cookie. `getSession()` decodes it; **no DB hit** for the session itself.
- Roles: `SUPER_ADMIN`, `PRINCIPAL`, `CLASS_TEACHER`, `SUBJECT_TEACHER`, `PARENT`, `STUDENT`.
- **Every page guards its role** at the top and `redirect("/")` if unauthorized.
- **Scope every query to the user.** A parent only sees their children; a teacher only their classes; a student only
  themselves. Derive the scope from the session (`session.user.id`), never from client input.

### Styling

- Tailwind utility classes. Institutional/academic look: **serif display headings** (`font-heading`), flat
  bordered cards (`bg-card border border-border rounded-lg`), one restrained accent (`primary`, a sage green),
  minimal shadows, no gradients/glass.
- Use theme tokens: `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`,
  `text-primary-foreground`. Dark mode is handled by the tokens + `dark:` variants.
- Icons from `lucide-react`. **Currency is always the `IndianRupee` icon and `₹`** (`n.toLocaleString("en-IN")`).

### Dates

- In JSX always format with a **pinned locale**: `new Date(x).toLocaleDateString("en-GB", { ... })`.
  This prevents server/client hydration mismatches. Never render an unpinned `toLocaleString()`.

---

## 6. Data model & how to change it

- Schema: `prisma/schema.prisma`. ~47 models (User, Student, Teacher, Parent, Classroom, Attendance, Grade,
  FeeInvoice, FeeItem, MenuItem, Notification, IBSubjectRecord, …).
- The database is **committed SQLite** (`prisma/dev.db`) — the seed data *is* the file. Changes you make locally
  (and commit) become the data everyone (and Vercel) gets.

**To add or change a model:**

```bash
# 1. edit prisma/schema.prisma
npx prisma db push        # applies schema to dev.db (dev workflow; no migration files)
npx prisma generate       # regenerates the typed client
# 2. restart `npm run dev`
# 3. commit BOTH prisma/schema.prisma AND prisma/dev.db
```

**Seeding data:** there's no single `seed.ts`; data lives in the committed `dev.db`. To add records, either use the
app UI, or write a small script. When inserting **dates via raw SQL**, store **epoch milliseconds**
(`Date.now()`), not date strings — Prisma's SQLite driver expects integer timestamps. (When you insert via the
Prisma client with `new Date(...)`, this is handled for you.)

---

## 7. Reusable building blocks

| Component | Use it for |
|---|---|
| `components/ui/PageHeader` | Page title + description + optional `action` (right-aligned) |
| `components/data/ExportButton` | One-click CSV export — pass `rows` (array of flat objects) + `filename` |
| `components/import/BulkImportWizard` | Config-driven Excel/CSV import (upload → map → validate → commit). Pass `fields`, `templateExample`, and a server-action `importAction`. See `admin/students/import` and `admin/staff/import` for examples |
| `components/timetable/TimetableGrid` | Weekly timetable grid; pass `entries` and optional `subjectLinkBase` (a **string**, not a function) |
| `lib/buildTimetable.ts` | Generates a weekly timetable from a student's IB subject records |
| `components/ui/Logo` | `LogoMark` (small) and `LogoFull` (large), both fall back to text if `/logo.png` is missing |
| Notifications | Create with `prisma.notification.create({ data: { userId, title, message, type } })`; they show automatically in the TopNav bell for that user |

---

## 8. Recipe: add a new feature (end to end)

Example — a "Library returns" page for the teacher portal:

1. **Route:** create `src/app/(portals)/teacher/library-returns/page.tsx` (server component, role guard, fetch data).
2. **Interactivity (if any):** add a `LibraryReturnsClient.tsx` (`"use client"`) and pass it **serializable props only**.
3. **Mutations:** add `actions.ts` with `"use server"` functions that write via Prisma + `revalidatePath`.
4. **Nav:** add a link in `src/components/layout/SideNav.tsx` under the right role's section (import a lucide icon).
5. **New data?** add a model in `schema.prisma`, run `db push` + `generate`, commit `dev.db`.
6. **Verify:** `npx tsc --noEmit` and `npm run lint` must be clean.
7. Commit `prisma/schema.prisma`, `prisma/dev.db` (if changed), and your source files.

---

## 9. Gotchas (the things that will bite you)

- **Never pass a function from a Server Component to a Client Component.** React throws
  "Server Functions cannot be passed…". Pass a **string/data** and build behaviour inside the client component,
  or pass a proper `"use server"` action. (This is why `TimetableGrid` takes `subjectLinkBase: string`, not a callback.)
- **Prisma on Vercel:** the SQLite file is bundled via `outputFileTracingIncludes` in `next.config.ts` and copied to
  `/tmp` at runtime (`src/lib/prisma.ts`) because Vercel's filesystem is read-only except `/tmp`. Do **not** add the
  whole Prisma engine folder to file tracing — it blows past the 250 MB function limit. Keep `next.config.ts` minimal.
- **`DATABASE_URL`** must exist as a Vercel env var (`.env` is git-ignored and does not ship).
- **Currency = ₹** everywhere (`IndianRupee` icon, `en-IN`). No `$`.
- **IB only, Indian demo data** — see section 1.
- Keep the DB scoped per user on every query (privacy; minors are involved).

---

## 10. Deployment

- Hosted on **Vercel**, auto-deploys from `main`.
- Build command: `prisma generate && next build` (already the `build` script).
- Binary targets in `schema.prisma`: `native`, `windows`, `rhel-openssl-3.0.x` (Vercel's Linux runtime).
- Set `DATABASE_URL="file:./dev.db"` in Vercel → Settings → Environment Variables.

---

## 11. Current state & roadmap

- **Real & working:** four portals, IB grading/report cards, timetable generator (constraint solver), secure
  lockdown exams, quizzes + MCQ auto-grading, parent↔teacher messaging, fee loader + invoice generation,
  bulk import/export, canteen meal plan + allergy detection + class-teacher notifications, wallet, inventory.
- **Preview mocks (UI built, no live model):** ~28 "AI" features — see `EduSphere360_AI_RAG_Prep.docx` for the
  plan to make them real with RAG.
- **Not built yet:** payment gateway (Razorpay), email/SMS/WhatsApp, real GPS bus tracking, some ops pages still on
  mock data (Library catalogue, Transport, Hostel), object storage for file uploads.
- **Security is demo-grade:** passwords are plaintext, the JWT secret is hardcoded, no audit trail/2FA. **Harden
  before real users.**

---

## 12. Quick file map

| I want to… | Look in |
|---|---|
| Change navigation | `src/components/layout/SideNav.tsx` |
| Change the top bar / notifications | `src/components/layout/TopNav.tsx` |
| Add/adjust a portal page | `src/app/(portals)/{role}/...` |
| Change the data model | `prisma/schema.prisma` |
| Auth / session logic | `src/lib/session.ts`, `src/app/actions.ts` |
| Theme tokens / global CSS | `src/app/globals.css` |
| Translations | `src/i18n/locales/*.json` |
| Export/import utilities | `src/components/data/ExportButton.tsx`, `src/components/import/BulkImportWizard.tsx` |

Questions this guide didn't answer? Check the existing feature that's closest to what you're building and copy its
pattern — the codebase is consistent by design.
