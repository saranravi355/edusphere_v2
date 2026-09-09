import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { presenceByStudent } from "@/lib/attendance";
import {
  ATL_RATING_LABELS, atlCategoryLabel, casStrandLabel,
  IB_CORE_ELEMENT_LABELS, learnerProfileLabel, type IBCoreElement,
} from "@/lib/ib";
import {
  ArrowLeft, BrainCircuit, Fingerprint, HeartPulse, Users, GraduationCap,
  Sparkles, FolderOpen, ShieldAlert, Stethoscope, CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

/**
 * The student as their teacher needs to see them.
 *
 * This page used to show four facts — curriculum, attendance, blood group,
 * learning needs — and a "Recent Grades" panel reading the legacy `Grade`
 * table. That table holds percentage-style score/maxScore rows from before the
 * school's records were IB-shaped, and 0 of Aarav Patel's 46 academic records
 * are in it: his 6 IB subject records, 3 core records and 37 assessment results
 * all live elsewhere. So his teacher was told "No grades recorded yet" about a
 * student with a full diploma record, on a page whose whole job is to show it.
 *
 * The growth work added ATL skills, Learner Profile evidence and a portfolio,
 * and this page linked out to the screen that writes them without ever showing
 * what had been written.
 *
 * WHAT A TEACHER GETS, AND WHAT THEY DO NOT
 *
 * Everything here is something a teacher acts on: who the child is, whether
 * they are in class, what will hurt them, who to ring, what they are being
 * graded, how they are growing, and what has happened to them.
 *
 * The office holds more — religion, community, sub-caste, mother's occupation
 * and monthly income, medium, group code. None of it is teaching data and all
 * of it is the kind of thing that shapes expectations of a child before they
 * open their mouth, so it stays on the admin registry profile, which is behind
 * a management-only route. This page deliberately does not select those columns
 * rather than fetching and hiding them.
 */

// ── Access ───────────────────────────────────────────────────────────────────

/**
 * A teacher may open a student in one of their own classrooms, by homeroom or
 * by timetable — the same rule /teacher/growth applies to its picker.
 *
 * The route guard checked the caller's ROLE and nothing else, so any teacher
 * could read any of the 157 children by pasting an id into the address bar,
 * including the medical notes and guardian phone numbers this page now adds. A
 * Principal keeps the whole school, which is their remit.
 */
async function classroomIdsFor(userId: string): Promise<string[]> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      classes: { select: { id: true } },
      timetable: { select: { classroomId: true } },
    },
  });
  if (!teacher) return [];
  return Array.from(new Set([
    ...teacher.classes.map((c) => c.id),
    ...teacher.timetable.map((t) => t.classroomId),
  ]));
}

// ── Small presentational pieces ──────────────────────────────────────────────

const CARD =
  "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm";

function Section({
  title, icon: Icon, meta, children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${CARD} p-6`}>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <Icon size={16} className="text-slate-400" />
          {title}
        </h2>
        {meta && <span className="text-xs text-slate-400">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

/** A label above its value. Renders the fallback rather than vanishing, so a
 *  gap in the record reads as a gap rather than as a field nobody thought of. */
function Field({ label, value, tone }: { label: string; value?: string | null; tone?: "alert" }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className={
        empty ? "text-sm text-slate-400"
          : tone === "alert" ? "text-sm font-medium text-rose-600 dark:text-rose-400"
            : "text-sm text-slate-700 dark:text-slate-300"
      }>
        {empty ? "—" : value}
      </p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

const gradeBand = (g: number) =>
  g >= 6 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : g >= 4 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

/** Age in whole years, for a teacher scanning a class of mixed birthdays. */
function ageFrom(dob: Date | null): string | null {
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const before = now.getMonth() < dob.getMonth()
    || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (before) age--;
  return `${age}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TeacherStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER", "PRINCIPAL"].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true, name: true, registrationNo: true, rollNumber: true, photoUrl: true,
      dateOfBirth: true, gender: true, curriculum: true, section: true,
      academicYear: true, enrollmentDate: true, isActive: true,
      // Health and safety — the reason a teacher opens this page mid-lesson.
      bloodGroup: true, allergies: true, flaggedFoods: true,
      medicalNotes: true, learningNeeds: true,
      emergencyContactName: true, emergencyContactPhone: true,
      // Who to ring.
      fatherName: true, fatherPhone: true, motherName: true, motherPhone: true,
      classroom: { select: { id: true, name: true, gradeLevel: true } },
      parent: { select: { phone: true, user: { select: { name: true } } } },

      ibSubjects: { orderBy: [{ subjectGroup: "asc" }, { subjectName: "asc" }] },
      ibCore: { include: { entries: { orderBy: { createdAt: "desc" }, take: 3 } } },
      assessmentResults: { orderBy: { date: "desc" }, take: 6 },
      atlSkillRecords: { orderBy: { createdAt: "desc" } },
      learnerProfileEvidence: { orderBy: { createdAt: "desc" }, take: 6 },
      portfolioItems: { orderBy: { createdAt: "desc" }, take: 6 },
      behaviorIncidents: { orderBy: { date: "desc" }, take: 5 },
      clinicVisits: { orderBy: { date: "desc" }, take: 3 },
    },
  });

  if (!student) notFound();

  // Scope after loading, so an id for a child in another class 404s the same
  // way a made-up one does rather than confirming the child exists.
  if (session.user.role !== "PRINCIPAL") {
    const allowed = await classroomIdsFor(session.user.id);
    if (!student.classroom || !allowed.includes(student.classroom.id)) notFound();
  }

  const presence = (await presenceByStudent([student.id])).get(student.id);
  const attendanceRate = presence && presence.total > 0
    ? `${((presence.present / presence.total) * 100).toFixed(1)}%`
    : null;

  const isDP = student.curriculum === "DP";
  const isMYP = student.curriculum === "MYP";
  const age = ageFrom(student.dateOfBirth);

  // The latest rating per ATL category — a teacher wants where the child is
  // now, with the history behind it, not five rows for "Research".
  const latestAtl = new Map<string, (typeof student.atlSkillRecords)[number]>();
  for (const r of student.atlSkillRecords) if (!latestAtl.has(r.category)) latestAtl.set(r.category, r);

  const cas = student.ibCore.find((c) => c.element === "CAS");
  const merits = student.behaviorIncidents.filter((b) => b.type === "MERIT").length;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} aria-hidden /> Back to Directory
      </Link>

      <PageHeader
        title={student.name || "Student Profile"}
        description={`Grade ${student.classroom?.gradeLevel ?? "—"} · ${student.classroom?.name || "Unassigned"} · ${student.curriculum}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/teacher/growth?studentId=${student.id}`}>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg transition-colors text-sm">
                <Fingerprint size={16} aria-hidden /> Record Growth
              </button>
            </Link>
            <Link href={`/teacher/students/${student.id}/ai-analysis`}>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-medium rounded-lg transition-colors text-sm">
                <BrainCircuit size={16} aria-hidden /> AI Insights
              </button>
            </Link>
          </div>
        }
      />

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <section className={`${CARD} p-6`}>
        <div className="flex items-center gap-4 mb-6">
          {student.photoUrl ? (
            <Image
              src={student.photoUrl}
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-zinc-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
              {student.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{student.name}</h3>
            <p className="text-sm text-slate-500 font-mono">{student.registrationNo}</p>
            {!student.isActive && (
              <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                Inactive
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Field label="Programme" value={student.curriculum} />
          <Field label="Class" value={student.classroom?.name} />
          <Field label="Roll number" value={student.rollNumber} />
          <Field label="Section" value={student.section} />
          <Field label="Date of birth" value={student.dateOfBirth ? `${fmtDate(student.dateOfBirth)}${age ? ` (${age})` : ""}` : null} />
          <Field label="Gender" value={student.gender} />
          <Field label="Academic year" value={student.academicYear} />
          <Field label="Enrolled" value={fmtDate(student.enrollmentDate)} />
        </div>
      </section>

      {/* ── Attendance and conduct at a glance ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className={`${CARD} p-5`}>
          <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400 flex items-center gap-1.5">
            <CalendarCheck size={13} aria-hidden /> Attendance
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{attendanceRate ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {presence?.total ? `${presence.present} of ${presence.total} sessions` : "No register taken yet"}
          </p>
        </div>
        <div className={`${CARD} p-5`}>
          <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400 flex items-center gap-1.5">
            <GraduationCap size={13} aria-hidden /> IB subjects
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{student.ibSubjects.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {student.ibSubjects.filter((s) => s.currentGrade !== null).length} graded this term
          </p>
        </div>
        <div className={`${CARD} p-5`}>
          <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400 flex items-center gap-1.5">
            <ShieldAlert size={13} aria-hidden /> Conduct
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {student.behaviorIncidents.length === 0 ? "Clear" : `${merits}/${student.behaviorIncidents.length}`}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {student.behaviorIncidents.length === 0 ? "Nothing recorded" : "merits of recent entries"}
          </p>
        </div>
      </div>

      {/* ── Health and safety ──────────────────────────────────────────── */}
      <Section title="Health &amp; safety" icon={HeartPulse}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Field label="Blood group" value={student.bloodGroup} />
          <Field label="Allergies" value={student.allergies} tone={student.allergies ? "alert" : undefined} />
          <Field label="Foods to avoid" value={student.flaggedFoods} tone={student.flaggedFoods ? "alert" : undefined} />
          <Field label="Learning needs" value={student.learningNeeds} />
        </div>
        {student.medicalNotes && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-zinc-800">
            <Field label="Medical notes" value={student.medicalNotes} />
          </div>
        )}
      </Section>

      {/* ── Who to contact ─────────────────────────────────────────────── */}
      <Section title="Contacts" icon={Users}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Field label="Guardian" value={student.parent?.user?.name} />
          <Field label="Guardian phone" value={student.parent?.phone} />
          <Field label="Emergency contact" value={student.emergencyContactName} />
          <Field
            label="Emergency phone"
            value={student.emergencyContactPhone}
            tone={student.emergencyContactPhone ? "alert" : undefined}
          />
          <Field label="Father" value={student.fatherName} />
          <Field label="Father's phone" value={student.fatherPhone} />
          <Field label="Mother" value={student.motherName} />
          <Field label="Mother's phone" value={student.motherPhone} />
        </div>
      </Section>

      {/* ── The IB record ──────────────────────────────────────────────── */}
      <Section
        title="IB subject record"
        icon={GraduationCap}
        meta={student.ibSubjects[0]?.term ?? undefined}
      >
        {student.ibSubjects.length === 0 ? (
          <Empty>No IB subjects on record. Add them from Grading &rarr; IB records.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400 text-left border-b border-slate-200 dark:border-zinc-800">
                  <th scope="col" className="pb-2 pr-3 font-bold">Subject</th>
                  <th scope="col" className="pb-2 px-2 font-bold">Level</th>
                  <th scope="col" className="pb-2 px-2 font-bold text-center">Current</th>
                  <th scope="col" className="pb-2 px-2 font-bold text-center">Predicted</th>
                  {isMYP && (
                    <th scope="col" className="pb-2 px-2 font-bold text-center">Criteria A–D</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {student.ibSubjects.map((s) => {
                  const crit = [s.critA, s.critB, s.critC, s.critD];
                  const marked = crit.every((v) => v !== null);
                  return (
                    <tr key={s.id}>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{s.subjectName}</span>
                        <span className="ml-2 text-[11px] text-slate-400">Group {s.subjectGroup}</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-500">{s.level}</td>
                      <td className="py-2.5 px-2 text-center">
                        {s.currentGrade === null
                          ? <span className="text-slate-300 dark:text-zinc-700">—</span>
                          : <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${gradeBand(s.currentGrade)}`}>{s.currentGrade}</span>}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">{s.predictedGrade ?? "—"}</td>
                      {isMYP && (
                        <td className="py-2.5 px-2 text-center font-mono text-xs text-slate-500">
                          {marked
                            ? `${crit.join(" · ")}  (${crit.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)}/32)`
                            : crit.map((v) => v ?? "–").join(" · ")}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── DP core ────────────────────────────────────────────────────── */}
      {isDP && (
        <Section title="Diploma core" icon={Sparkles}>
          {student.ibCore.length === 0 ? (
            <Empty>No TOK, EE or CAS record yet.</Empty>
          ) : (
            <div className="space-y-4">
              {student.ibCore.map((c) => (
                <div key={c.id} className="pb-4 border-b border-slate-100 dark:border-zinc-800 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {IB_CORE_ELEMENT_LABELS[c.element as IBCoreElement] ?? c.element}
                      {c.title && <span className="ml-2 text-sm font-normal text-slate-500">{c.title}</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                        {c.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                      {c.grade && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
                          {c.grade}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.element === "CAS" && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      {casStrandLabel("CREATIVITY")} {c.creativityHours}h ·{" "}
                      {casStrandLabel("ACTIVITY")} {c.activityHours}h ·{" "}
                      {casStrandLabel("SERVICE")} {c.serviceHours}h · {c.reflections} reflections
                    </p>
                  )}
                  {c.entries.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {c.entries.map((e) => (
                        <li key={e.id} className="text-xs text-slate-500 flex gap-2">
                          <span className="text-slate-400 shrink-0">{fmtDate(e.createdAt)}</span>
                          <span className="line-clamp-2">{e.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Growth: ATL and Learner Profile ────────────────────────────── */}
      <Section
        title="Growth"
        icon={Fingerprint}
        meta={student.atlSkillRecords.length + student.learnerProfileEvidence.length === 0 ? undefined : "most recent first"}
      >
        <h3 className="text-[11px] uppercase font-bold tracking-wide text-slate-400 mb-2">ATL skills</h3>
        {latestAtl.size === 0 ? (
          <Empty>No ATL skill recorded yet.</Empty>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {Array.from(latestAtl.values()).map((r) => (
              <div key={r.id} className="border border-slate-200 dark:border-zinc-800 rounded-lg p-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{atlCategoryLabel(r.category)}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ATL_RATING_LABELS[r.rating] ?? r.rating} · {fmtDate(r.createdAt)}
                </p>
                {r.note && <p className="text-xs text-slate-500 mt-1.5">{r.note}</p>}
              </div>
            ))}
          </div>
        )}

        <h3 className="text-[11px] uppercase font-bold tracking-wide text-slate-400 mb-2">Learner Profile evidence</h3>
        {student.learnerProfileEvidence.length === 0 ? (
          <Empty>No Learner Profile evidence recorded yet.</Empty>
        ) : (
          <ul className="space-y-2">
            {student.learnerProfileEvidence.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-medium mr-2">
                  {learnerProfileLabel(e.attribute)}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{e.evidence}</span>
                <span className="text-xs text-slate-400 ml-2">{fmtDate(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ── Portfolio ──────────────────────────────────────────────────── */}
      <Section title="Portfolio" icon={FolderOpen} meta={student.portfolioItems.length ? `${student.portfolioItems.length} shown` : undefined}>
        {student.portfolioItems.length === 0 ? (
          <Empty>Nothing in the portfolio yet.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {student.portfolioItems.map((p) => (
              <li key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={p.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {p.title}
                  </a>
                  <p className="text-xs text-slate-400">
                    {[p.subject, p.academicYear].filter(Boolean).join(" · ") || "No subject recorded"}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{fmtDate(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ── Recent assessments ─────────────────────────────────────────── */}
      <Section title="Recent assessments" icon={GraduationCap}>
        {student.assessmentResults.length === 0 ? (
          <Empty>No assessment results recorded yet.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {student.assessmentResults.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                  <p className="text-xs text-slate-400">
                    {a.subjectName} · {a.type.replace(/_/g, " ").toLowerCase()} · {fmtDate(a.date)}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${gradeBand(a.grade)}`}>
                  {a.grade}/{a.maxGrade}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ── Pastoral ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Behaviour" icon={ShieldAlert}>
          {student.behaviorIncidents.length === 0 ? (
            <Empty>Nothing recorded.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {student.behaviorIncidents.map((b) => (
                <li key={b.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      b.type === "MERIT"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                    }`}>
                      {b.type.toLowerCase()}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{b.category}</span>
                    <span className="text-xs text-slate-400 ml-auto">{fmtDate(b.date)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{b.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Clinic visits" icon={Stethoscope}>
          {student.clinicVisits.length === 0 ? (
            <Empty>No visits recorded.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {student.clinicVisits.map((v) => (
                <li key={v.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 dark:text-slate-300">{v.reason}</span>
                    <span className="text-xs text-slate-400 ml-auto">{fmtDate(v.date)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{v.treatment}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {cas && cas.reflections === 0 && (
        <p className="text-xs text-slate-400 text-center">
          {student.name.split(" ")[0]} has logged no CAS reflections yet.
        </p>
      )}
    </div>
  );
}
