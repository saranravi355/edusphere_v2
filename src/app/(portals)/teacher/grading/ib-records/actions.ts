"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import {
  CRITERIA, CRITERION_MAX, CRITERION_MIN, GRADE_MAX, GRADE_MIN,
  IB_TERMS, findSubject,
} from "@/lib/ib/subjects";
import { gradeToStore } from "@/lib/ib/mypGrade";

/**
 * Writing the IB subject record.
 *
 * IBSubjectRecord holds the grades an IB school is actually judged on — the
 * current grade, the predicted grade a university offer hangs off, and the four
 * MYP criteria. There are 606 of them on file and, until now, nothing in the
 * application could write one. They existed because the seed script created
 * them: a teacher could not raise a predicted grade after a good mock, and 72
 * of the 173 students had no record at all and no way to be given one.
 *
 * Scoped the same way the rest of the teacher portal is: a teacher may write a
 * record for a student in one of their own classes, and nobody else. The class
 * is re-checked here rather than trusted from the form, because a Server Action
 * is an addressable endpoint and the form is only a suggestion.
 */

async function ctx() {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, classes: { select: { id: true } } },
  });
  if (!teacher) return null;
  return { auth, teacher, classIds: teacher.classes.map((c) => c.id) };
}

/** A grade box left empty means "not graded", which is not the same as zero. */
function intOrNull(raw: FormDataEntryValue | null, min: number, max: number): number | null | "bad" {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return "bad";
  return n;
}

function textOrNull(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t === "" ? null : t;
}

/**
 * The group and level a new record should carry.
 *
 * Copied from the rows the school already has for that subject, so a record
 * created today files itself alongside the 200 created by the seed rather than
 * under a different group — which would split one subject into two columns on
 * the Analytics chart. The catalogue is only the fallback, for a subject nobody
 * has ever recorded.
 */
async function resolveSubjectShape(subjectName: string, level: string | null) {
  const existing = await prisma.iBSubjectRecord.findFirst({
    where: { subjectName },
    select: { subjectGroup: true, level: true },
  });
  const catalogue = findSubject(subjectName);
  return {
    subjectGroup: existing?.subjectGroup ?? catalogue?.group ?? 1,
    level: level ?? existing?.level ?? catalogue?.levels[0] ?? "MYP",
  };
}

export async function saveIbRecords(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: "Your staff record is missing. Ask an administrator to check your profile." };

  const classroomId = String(formData.get("classroomId") ?? "");
  const subjectName = String(formData.get("subjectName") ?? "").trim();
  const term = String(formData.get("term") ?? "");

  if (!c.classIds.includes(classroomId)) return { error: "That is not one of your classes." };
  if (!subjectName) return { error: "Choose a subject first." };
  if (!(IB_TERMS as readonly string[]).includes(term)) return { error: "Choose a term." };

  // The roll is read from the database, not from the form, so a submitted id
  // for a child in another class cannot be graded by way of this one.
  const students = await prisma.student.findMany({
    where: { classroomId, isActive: true },
    select: { id: true, name: true, curriculum: true },
  });
  if (students.length === 0) return { error: "That class has no active students." };

  const existing = await prisma.iBSubjectRecord.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, subjectName, term },
    select: { id: true, studentId: true },
  });
  const existingBy = new Map(existing.map((r) => [r.studentId, r.id]));

  type Write = { studentId: string; recordId?: string; data: Record<string, unknown> };
  const writes: Write[] = [];
  const problems: string[] = [];

  for (const s of students) {
    const current = intOrNull(formData.get(`current.${s.id}`), GRADE_MIN, GRADE_MAX);
    const predicted = intOrNull(formData.get(`predicted.${s.id}`), GRADE_MIN, GRADE_MAX);
    const comment = textOrNull(formData.get(`comment.${s.id}`));
    const level = textOrNull(formData.get(`level.${s.id}`));

    if (current === "bad" || predicted === "bad") {
      problems.push(`${s.name}: grades must be whole numbers from ${GRADE_MIN} to ${GRADE_MAX}.`);
      continue;
    }

    // Criteria are MYP's, and are read only for MYP students so a stray value
    // posted against a DP student cannot land in the record.
    const crit: Record<string, number | null> = {};
    let critBad = false;
    if (s.curriculum === "MYP") {
      for (const k of CRITERIA) {
        const v = intOrNull(formData.get(`crit${k}.${s.id}`), CRITERION_MIN, CRITERION_MAX);
        if (v === "bad") { critBad = true; break; }
        crit[`crit${k}`] = v;
      }
    }
    if (critBad) {
      problems.push(`${s.name}: criteria must be whole numbers from ${CRITERION_MIN} to ${CRITERION_MAX}.`);
      continue;
    }

    const recordId = existingBy.get(s.id);
    const empty = current === null && predicted === null && comment === null &&
      Object.values(crit).every((v) => v === null);

    // Nothing typed and nothing stored: leave it alone rather than creating an
    // empty record for every student in the class the first time this is saved.
    if (!recordId && empty) continue;

    // For a MYP student with all four criteria marked, the grade is the IB
    // table's answer rather than whatever was in the grade box — the two used
    // to be saved as unrelated numbers, which is how 214 records ended up
    // holding a grade their own criteria contradict. Programme comes from the
    // Student row read above, not the form.
    const currentGrade = gradeToStore({
      curriculum: s.curriculum,
      typed: current,
      critA: crit.critA,
      critB: crit.critB,
      critC: crit.critC,
      critD: crit.critD,
    });

    writes.push({
      studentId: s.id,
      recordId,
      data: {
        currentGrade,
        predictedGrade: predicted,
        teacherComment: comment,
        ...crit,
        ...(level ? { level } : {}),
      },
    });
  }

  if (problems.length) return { error: problems.slice(0, 3).join(" ") };
  if (writes.length === 0) return { error: "Nothing to save — no grades were entered." };

  const shape = await resolveSubjectShape(subjectName, null);

  try {
    await prisma.$transaction(
      writes.map((w) =>
        w.recordId
          ? prisma.iBSubjectRecord.update({ where: { id: w.recordId }, data: w.data })
          : prisma.iBSubjectRecord.create({
              data: {
                studentId: w.studentId,
                subjectName,
                term,
                subjectGroup: shape.subjectGroup,
                level: (w.data.level as string) ?? shape.level,
                ...w.data,
              },
            }),
      ),
    );
  } catch (e) {
    console.error("[saveIbRecords]", e);
    return { error: "Could not save the records. Nothing was changed. Please try again." };
  }

  const created = writes.filter((w) => !w.recordId).length;
  const updated = writes.length - created;

  revalidatePath("/teacher/grading/ib-records");
  revalidatePath("/admin/students/registry");
  revalidatePath("/admin/programmes");
  revalidatePath("/student/grades");

  return {
    success:
      `Saved ${subjectName} for ${term}. ` +
      `${updated} record${updated === 1 ? "" : "s"} updated` +
      (created ? `, ${created} created.` : "."),
  };
}
