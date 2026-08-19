"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES, STAFF_ROLES } from "@/lib/authz";

export async function getTimetable(classroomId: string) {
  // A read that fills a grid: refuse by returning nothing rather than an error
  // object, so every caller keeps one shape. Writes below stay admin-only.
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return [];

  if (!classroomId) return [];
  return prisma.timetableEntry.findMany({
    where: { classroomId },
    include: {
      subject: true,
      teacher: {
        include: { user: true }
      }
    }
  });
}

export async function allocateSlot(formData: FormData) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const classroomId = formData.get("classroomId") as string;
  const subjectId = formData.get("subjectId") as string;
  const teacherId = formData.get("teacherId") as string;
  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string);
  const period = parseInt(formData.get("period") as string);
  const room = formData.get("room") as string;

  // Collision Detection
  // 1. Check if Teacher is already busy in another class
  if (teacherId) {
    const teacherCollision = await prisma.timetableEntry.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        period,
        classroomId: { not: classroomId } // Ignore if updating same class
      },
      include: { classroom: true }
    });

    if (teacherCollision) {
      return { 
        error: `Collision! This teacher is already scheduled for ${teacherCollision.classroom.name} on Day ${dayOfWeek}, Period ${period}.` 
      };
    }
  }

  // 2. Check if Room is already busy
  if (room && room.trim() !== "") {
    const roomCollision = await prisma.timetableEntry.findFirst({
      where: {
        room: { equals: room },
        dayOfWeek,
        period,
        classroomId: { not: classroomId }
      },
      include: { classroom: true }
    });

    if (roomCollision) {
      return { 
        error: `Collision! Room ${room} is already booked for ${roomCollision.classroom.name} on Day ${dayOfWeek}, Period ${period}.` 
      };
    }
  }

  // Define start/end times based on period
  const periodTimes: Record<number, {start: string, end: string}> = {
    1: { start: "08:30", end: "09:30" },
    2: { start: "09:30", end: "10:30" },
    3: { start: "10:45", end: "11:45" },
    4: { start: "11:45", end: "12:45" },
    5: { start: "13:30", end: "14:30" },
    6: { start: "14:30", end: "15:30" }
  };

  const times = periodTimes[period] || { start: "00:00", end: "00:00" };

  // Check if an entry already exists for this class, day, and period to UPDATE it, else CREATE
  const existingEntry = await prisma.timetableEntry.findFirst({
    where: { classroomId, dayOfWeek, period }
  });

  if (existingEntry) {
    await prisma.timetableEntry.update({
      where: { id: existingEntry.id },
      data: {
        subjectId,
        teacherId: teacherId || null,
        room: room || null,
        startTime: times.start,
        endTime: times.end
      }
    });
  } else {
    await prisma.timetableEntry.create({
      data: {
        classroomId,
        subjectId,
        teacherId: teacherId || null,
        dayOfWeek,
        period,
        room: room || null,
        startTime: times.start,
        endTime: times.end
      }
    });
  }

  revalidatePath("/admin/academic-setup/timetable");
  return { success: true };
}

export async function removeSlot(id: string) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  await prisma.timetableEntry.delete({
    where: { id }
  });
  revalidatePath("/admin/academic-setup/timetable");
  return { success: true };
}

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "08:30", end: "09:30" },
  2: { start: "09:30", end: "10:30" },
  3: { start: "10:45", end: "11:45" },
  4: { start: "11:45", end: "12:45" },
  5: { start: "13:30", end: "14:30" },
  6: { start: "14:30", end: "15:30" },
};

export async function autoGenerateSchedule(classroomId: string) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  // Validate BEFORE destroying anything. The previous version deleted the
  // existing timetable first, so a class with no subjects or teachers lost the
  // schedule it already had and got nothing back.
  const [subjects, teachers, classroom] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ orderBy: { id: "asc" } }),
    prisma.classroom.findUnique({ where: { id: classroomId } }),
  ]);

  if (!classroom) return { error: "Class not found." };
  if (subjects.length === 0) return { error: "No subjects configured. Add subjects in Academic Setup first." };
  if (teachers.length === 0) return { error: "No teachers available to schedule." };

  // Teachers booked elsewhere (any other class) at each day/period.
  const otherEntries = await prisma.timetableEntry.findMany({
    where: { classroomId: { not: classroomId } },
    select: { teacherId: true, dayOfWeek: true, period: true },
  });
  const busy = new Set(
    otherEntries.filter((e) => e.teacherId).map((e) => `${e.teacherId}:${e.dayOfWeek}:${e.period}`),
  );

  await prisma.timetableEntry.deleteMany({ where: { classroomId } });

  // Rotate through subjects rather than picking at random, so every subject
  // actually gets taught instead of some appearing five times and others never.
  const rows: {
    classroomId: string; subjectId: string; teacherId: string;
    dayOfWeek: number; period: number; room: string; startTime: string; endTime: string;
  }[] = [];
  let placed = 0, skipped = 0, slotIndex = 0;
  const load = new Map<string, number>();
  const room = `Room ${classroom.name}`;

  for (let day = 1; day <= 5; day++) {
    for (let period = 1; period <= 6; period++) {
      const subject = subjects[slotIndex % subjects.length];
      slotIndex++;

      // Prefer the least-loaded teacher who is free in this slot.
      const free = teachers
        .filter((t) => !busy.has(`${t.id}:${day}:${period}`))
        .sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0));

      if (free.length === 0) { skipped++; continue; }

      const teacher = free[0];
      load.set(teacher.id, (load.get(teacher.id) ?? 0) + 1);
      busy.add(`${teacher.id}:${day}:${period}`);
      rows.push({
        classroomId, subjectId: subject.id, teacherId: teacher.id,
        dayOfWeek: day, period, room,
        startTime: PERIOD_TIMES[period].start, endTime: PERIOD_TIMES[period].end,
      });
      placed++;
    }
  }

  if (rows.length > 0) await prisma.timetableEntry.createMany({ data: rows });

  revalidatePath("/admin/academic-setup/timetable");
  return {
    success: true,
    stats: { filled: placed, total: 30, conflictsAvoided: skipped, teachersUsed: load.size },
  };
}
