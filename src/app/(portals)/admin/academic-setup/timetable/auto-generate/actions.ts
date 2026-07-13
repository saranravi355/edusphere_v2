"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DAYS = [1, 2, 3, 4, 5];
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "08:30", end: "09:30" },
  2: { start: "09:30", end: "10:30" },
  3: { start: "10:45", end: "11:45" },
  4: { start: "11:45", end: "12:45" },
  5: { start: "13:30", end: "14:30" },
  6: { start: "14:30", end: "15:30" },
};
const PERIODS = [1, 2, 3, 4, 5, 6];

export interface GeneratedSlot {
  dayOfWeek: number;
  period: number;
  subjectName: string;
  teacherName: string;
}

export interface GenerateResult {
  error?: string;
  success?: boolean;
  slots?: GeneratedSlot[];
  stats?: {
    filled: number;
    total: number;
    conflictsAvoided: number;
    teachersUsed: number;
  };
}

/**
 * Conflict-free timetable generation (AI Feature #9).
 * Greedy constraint solver:
 *  - spreads each subject evenly across the week (max once per day until all days used)
 *  - prefers subject-qualified teachers
 *  - never double-books a teacher across any classroom, including existing timetables
 */
export async function autoGenerateTimetable(classroomId: string): Promise<GenerateResult> {
  if (!classroomId) return { error: "Pick a class first." };

  const [classroom, subjects, teachers, otherEntries] = await Promise.all([
    prisma.classroom.findUnique({ where: { id: classroomId } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ include: { user: true } }),
    prisma.timetableEntry.findMany({
      where: { classroomId: { not: classroomId } },
      select: { teacherId: true, dayOfWeek: true, period: true },
    }),
  ]);

  if (!classroom) return { error: "Class not found." };
  if (subjects.length === 0) return { error: "No subjects configured. Add subjects in Academic Setup first." };
  if (teachers.length === 0) return { error: "No teachers available to schedule." };

  // teacher busy map from other classrooms' timetables
  const busy = new Set<string>();
  for (const e of otherEntries) {
    if (e.teacherId) busy.add(`${e.teacherId}:${e.dayOfWeek}:${e.period}`);
  }

  // qualified teachers per subject (teacher.subjects is a comma-separated string)
  const qualified = new Map<string, typeof teachers>();
  for (const s of subjects) {
    qualified.set(
      s.id,
      teachers.filter((t) =>
        t.subjects.toLowerCase().split(",").map((x) => x.trim()).some(
          (sub) => sub.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(sub)
        )
      )
    );
  }

  // even subject distribution across 30 slots
  const totalSlots = DAYS.length * PERIODS.length;
  const sequence: string[] = [];
  let i = 0;
  while (sequence.length < totalSlots) {
    sequence.push(subjects[i % subjects.length].id);
    i++;
  }

  const subjectPerDay = new Map<string, number>(); // `${subjectId}:${day}` -> count
  const teacherLoad = new Map<string, number>();
  const slots: {
    dayOfWeek: number;
    period: number;
    subjectId: string;
    teacherId: string | null;
  }[] = [];
  let conflictsAvoided = 0;
  let cursor = 0;

  for (const day of DAYS) {
    for (const period of PERIODS) {
      // pick next subject that hasn't hit its per-day cap (spread across week)
      const maxPerDay = Math.ceil(totalSlots / subjects.length / DAYS.length);
      let subjectId = sequence[cursor % sequence.length];
      let tries = 0;
      while ((subjectPerDay.get(`${subjectId}:${day}`) || 0) >= maxPerDay && tries < sequence.length) {
        cursor++;
        subjectId = sequence[cursor % sequence.length];
        tries++;
      }
      cursor++;
      subjectPerDay.set(`${subjectId}:${day}`, (subjectPerDay.get(`${subjectId}:${day}`) || 0) + 1);

      // pick teacher: qualified first, least-loaded, not busy at this slot
      const pool = [...(qualified.get(subjectId) || []), ...teachers].filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx);
      let chosen: string | null = null;
      for (const t of pool.sort((a, b) => (teacherLoad.get(a.id) || 0) - (teacherLoad.get(b.id) || 0))) {
        const key = `${t.id}:${day}:${period}`;
        if (busy.has(key)) {
          conflictsAvoided++;
          continue;
        }
        chosen = t.id;
        break;
      }
      if (chosen) {
        busy.add(`${chosen}:${day}:${period}`); // also blocks within this generation
        teacherLoad.set(chosen, (teacherLoad.get(chosen) || 0) + 1);
      }

      slots.push({ dayOfWeek: day, period, subjectId, teacherId: chosen });
    }
  }

  // replace this classroom's timetable atomically
  await prisma.$transaction([
    prisma.timetableEntry.deleteMany({ where: { classroomId } }),
    prisma.timetableEntry.createMany({
      data: slots.map((s) => ({
        classroomId,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        dayOfWeek: s.dayOfWeek,
        period: s.period,
        startTime: PERIOD_TIMES[s.period].start,
        endTime: PERIOD_TIMES[s.period].end,
        room: classroom.name,
      })),
    }),
  ]);

  revalidatePath("/admin/academic-setup/timetable");
  revalidatePath("/admin/academic-setup/timetable/auto-generate");

  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const teacherName = new Map(teachers.map((t) => [t.id, t.user?.name || "Unassigned"]));

  return {
    success: true,
    slots: slots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      period: s.period,
      subjectName: subjectName.get(s.subjectId) || "?",
      teacherName: s.teacherId ? teacherName.get(s.teacherId) || "?" : "Unassigned",
    })),
    stats: {
      filled: slots.filter((s) => s.teacherId).length,
      total: totalSlots,
      conflictsAvoided,
      teachersUsed: teacherLoad.size,
    },
  };
}
