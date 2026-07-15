# EduSphere 360 — Project Context & Session Handoff

Paste this file (or point the assistant to `PROJECT_CONTEXT.md` in the repo) at the start of any new chat to restore full context.

---

## 1. What this project is

**EduSphere 360** — AI-powered school management platform for an **IB World School** (Bangalore, India). Built against `EduSphere360_PRD_V2.1.pdf` (in repo root). Originally started in Google Antigravity, continued in Claude Cowork.

- **Repo**: https://github.com/saranravi355/edusphere_v2 (branch `main`)
- **Stack**: Next.js 16 (App Router, Turbopack) · Prisma 5.22 + SQLite (`prisma/dev.db`, committed to git) · Tailwind · react-i18next · framer-motion · lucide-react
- **Deploy**: Vercel (builds `prisma generate && next build`; binaryTargets include `native`, `windows`, `rhel-openssl-3.0.x`)
- **Curriculum rule (permanent, see AGENTS.md)**: everything is IB — grades 1–7 (never percentages), PYP/MYP/DP programmes, MYP criteria A–D (0–8), HL/SL, TOK/EE/CAS, /45 diploma points, ATL skills, IB learner profile. All demo data must be Indian (names, venues, ₹, +91 phones, Bengaluru addresses).

## 2. Architecture conventions

- Routes under `src/app/(portals)/{admin|teacher|parent|student}/...`; each feature folder has `page.tsx` (server, fetches via `@/lib/prisma`), a `*Client.tsx` (client UI), and `actions.ts` (server actions with `revalidatePath`).
- Auth: JWT cookie session (`@/lib/session`, `getSession()`); roles: SUPER_ADMIN, PRINCIPAL, CLASS_TEACHER, SUBJECT_TEACHER, PARENT, STUDENT. Pages guard with role checks + `redirect("/")`.
- Layout: `AppShell` (client) = collapsible grouped left `SideNav` + slim `TopNav` (search, EN/HI/TA/KN language switcher, theme, notifications, profile). Nav labels translate via `src/i18n/locales/*.json` (`sidenav.links.*`).
- UI style: rounded-2xl white/zinc-900 cards, stat-card grids, blue-600 primary, dark-mode variants everywhere.
- Dates in JSX: always `toLocaleDateString("en-GB", ...)` (pinned locale avoids hydration mismatches).

## 3. What's built (high level)

**Admin/Principal**: Live Ops dashboard (30s auto-refresh), Analytics, AI Insights hub (early warning, anomaly, workload, attrition, etc. — all labelled PREVIEW mocks), Academic Setup + Academic Calendar (national/Karnataka holiday + IB exam-window sync), Timetable manager + **AI auto-generator** (real constraint solver, conflict-free, transaction-safe), IB Programmes dashboards (PYP/MYP/DP tabs), CAS Tracker (strand bars + real notification nudges), Exams, Library, Staff (leave + **PD & Appraisal**: CPD hours, IB 1–7 observations, year-on-year trends), Students hub (**Registry** with filters/CSV/Platform-AI mock, Register, Sentiment AI, **Learning Needs & IEP**), Behavior, Clubs (rosters + past activities with outcomes + upcoming events), Alumni, Finance, Fees, Canteen, Transport, Hostel, Resources, Assets, Users, Schools, Settings.

**Teacher**: Dashboard, My Classes (live data), Planner (**IB lesson-plan builder**: units, ATL chips, learner profile, coverage meter, one-tap substitute-plan generator), Attendance, Assignments, Grading, Quizzes (create → moderate → release), Moderation, Directory, IEP (class-scoped), Discipline, AI Tools, My PD (CPD log vs 30h target + observation feedback), Reports (live class report), Leave.

**Student**: Dashboard, **My Subjects** (all-in-one: per-subject resources, grade-history bar chart, every assessment result), AI Tools (tutor/study plan/learning gap/forecast — scripted previews), Assignments, Schedule, **Exams** (IB session schedule: Paper 1/2/3 mocks, IA deadlines, MYP eAssessments + quiz engine with **secure lockdown mode**: fullscreen, sidebar hidden, copy/right-click blocked, 3 violations = auto-submit), My Grades (DP /45 view, MYP criteria, PYP narrative), Report Card (real IB transcript + print-to-PDF), Clubs, Alumni Wall, Wallet.

**Parent**: Dashboard, Timetable, Live bus tracker (mock), Attendance, Gradebook, Discipline, Meetings, Fees, Messages.

**Floating AI assistant**: role-specific persona with 5 quick actions each (all scripted PREVIEW responses).

## 4. Data state (prisma/dev.db, committed)

173 students — every one has: classroom (15 sections MYP1A–DP2B), portal login, linked parent (Indian name, +91 phone, Bengaluru address), IB subject records with current+predicted grades, assessment history (1,836 results), attendance (3,140 records). Plus: 15 teachers with PD records + 52 observations across 3 academic years, IEP plans, 60 invoices + payments, messages, notifications, 80 subject resources, 20 club activities, seeded calendar, 2 quizzes for the demo class (1 takeable, 1 graded).

**Demo logins** (password `password123` for all):
- Principal: whatever admin account exists (e.g. Dr. Meena Krishnan)
- Student: `aarav.p@edusphere.com` (Aarav Patel, DP — richest data)
- Other students: `stu-26-10x@student.edusphere.com`; new logins `<regno>@student.edusphere.com`
- Parents: `parent.<regno>@edusphere.com`

## 5. ⚠️ CRITICAL environment quirks (Claude Cowork sandbox)

1. **Windows Edit-tool staleness**: files edited via the Windows-side Edit/Write tools can appear TRUNCATED in the Linux sandbox mount (git would commit corrupted files!). **Rule: modify existing files from the sandbox side** (python heredoc via `mcp__workspace__bash`); creating NEW files with the Write tool is safe. After any Windows-side edit, verify with `wc -l` / `tail` from bash before committing.
2. **Prisma engines can't download in the sandbox** (binaries.prisma.sh blocked). To regenerate the client after schema changes, run:
   ```bash
   cd /sessions/<session>/mnt/edusphere360
   export PRISMA_SCHEMA_ENGINE_BINARY=$PWD/node_modules/@prisma/engines/schema-engine-windows.exe \
          PRISMA_QUERY_ENGINE_LIBRARY=$PWD/node_modules/@prisma/engines/query_engine-windows.dll.node \
          PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
   npx prisma generate
   ```
   `prisma db push` does NOT work in the sandbox — create tables with raw SQL via python sqlite3, matching Prisma DDL conventions (TEXT PK, DATETIME, FK constraints).
3. **DATES MUST BE EPOCH MILLISECONDS**: when seeding via raw SQL, never insert date strings — Prisma's SQLite driver throws `Inconsistent column data: Conversion failed`. Always insert `int(datetime.timestamp()*1000)`.
4. **User must restart their dev server** after schema/client changes — `start_dev_server.bat` handles it (regenerates client, clears `.next/dev`, starts dev).
5. Verification loop that works in the sandbox: `./node_modules/.bin/tsc --noEmit` (filter out `.next/` noise) + `npx eslint src --quiet`. `next build` exceeds the 45s command cap; background processes don't survive between calls.
6. Stale `.git/index.lock` / `HEAD.lock` files appear when the Windows side holds git — `rm -f .git/*.lock` (file deletion for the folder has been user-approved before; re-request via `allow_cowork_file_delete` if needed).

## 6. 🔑 HOW TO PUSH TO GITHUB (the special mention)

The sandbox has **no stored GitHub credentials** (the user's Windows credential manager isn't reachable). The working procedure:

1. Ask the user for a **GitHub personal access token**: github.com → Settings → Developer settings → **Personal access tokens (classic)** → Generate new token → tick **`repo`** scope → copy the `ghp_...` string and paste it in chat.
2. Push with the token inline in the URL — **never store it** in git config, remotes, or any file, and **mask it in output**:
   ```bash
   cd /sessions/<session>/mnt/edusphere360
   rm -f .git/index.lock .git/HEAD.lock   # clear stale locks first
   git add -A && git commit -m "..."
   git push https://saranravi355:<TOKEN>@github.com/saranravi355/edusphere_v2.git main 2>&1 | sed 's/ghp_[A-Za-z0-9]*/***/g'
   ```
3. Verify sync: `git fetch <same URL> main && git rev-list --left-right --count main...FETCH_HEAD` (want `0 0`).
4. Remind the user to **delete the token** at github.com/settings/tokens afterwards, since it was pasted in chat.
5. If push fails with "Invalid username or token" → the token expired/was revoked → ask for a fresh one.

## 7. Known gaps / sensible next steps

- All 25 PRD AI features except auto-grading and the timetable generator are **scripted PREVIEW mocks** — wiring them to a real LLM endpoint is the biggest upgrade (UI is ready).
- Not built: payments gateway (Razorpay), WhatsApp/SMS/email channels, payroll statutory outputs (TDS/PF/Form 16), recruitment, events & permission slips, OMR digitisation, real GPS, mobile apps, Excel import.
- Security is demo-grade: plaintext passwords, hardcoded JWT secret, no 2FA/audit trail — must fix before real users.
- Full PRD coverage audit lives in `EduSphere360_PRD_Coverage_Report.docx` (repo root).
- Console warning "script tag in React component" from next-themes is a known benign React 19 dev-mode notice — ignore.
