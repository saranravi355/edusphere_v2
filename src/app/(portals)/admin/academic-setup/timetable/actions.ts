"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTimetable(classroomId: string) {
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
  await prisma.timetableEntry.delete({
    where: { id }
  });
  revalidatePath("/admin/academic-setup/timetable");
  return { success: true };
}

export async function autoGenerateSchedule(classroomId: string) {
  // Clear existing schedule for this class
  await prisma.timetableEntry.deleteMany({
    where: { classroomId }
  });

  // Fetch required data
  const subjects = await prisma.subject.findMany();
  const teachers = await prisma.teacher.findMany();

  if (subjects.length === 0 || teachers.length === 0) {
    return { error: "Cannot generate: Please ensure subjects and teachers exist in the database." };
  }

  // Simple Auto-Generator: Fill each period (1 to 6) for each day (1 to 5)
  for (let day = 1; day <= 5; day++) {
    for (let period = 1; period <= 6; period++) {
      // Pick a random subject and a random teacher for simplicity in the basic generator
      // In a real scenario, this would use a complex constraint satisfaction algorithm
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      
      const periodTimes: Record<number, {start: string, end: string}> = {
        1: { start: "08:30", end: "09:30" },
        2: { start: "09:30", end: "10:30" },
        3: { start: "10:45", end: "11:45" },
        4: { start: "11:45", end: "12:45" },
        5: { start: "13:30", end: "14:30" },
        6: { start: "14:30", end: "15:30" }
      };

      // Ensure no collision for the randomly picked teacher
      const collision = await prisma.timetableEntry.findFirst({
        where: { teacherId: randomTeacher.id, dayOfWeek: day, period }
      });

      if (!collision) {
        await prisma.timetableEntry.create({
          data: {
            classroomId,
            subjectId: randomSubject.id,
            teacherId: randomTeacher.id,
            dayOfWeek: day,
            period,
            room: `Room ${100 + Math.floor(Math.random() * 50)}`, // Random room
            startTime: periodTimes[period].start,
            endTime: periodTimes[period].end
          }
        });
      }
    }
  }

  revalidatePath("/admin/academic-setup/timetable");
  return { success: true };
}
