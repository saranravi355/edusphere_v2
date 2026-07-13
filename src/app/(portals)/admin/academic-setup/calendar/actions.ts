"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Indian national + Karnataka holidays, AY 2026-27 (gazetted list)
const NATIONAL_HOLIDAYS_2026_27: { title: string; date: string }[] = [
  { title: "Independence Day", date: "2026-08-15" },
  { title: "Ganesh Chaturthi", date: "2026-09-14" },
  { title: "Gandhi Jayanti", date: "2026-10-02" },
  { title: "Dasara (Vijayadashami)", date: "2026-10-20" },
  { title: "Kannada Rajyotsava", date: "2026-11-01" },
  { title: "Deepavali", date: "2026-11-08" },
  { title: "Christmas", date: "2026-12-25" },
  { title: "New Year's Day", date: "2027-01-01" },
  { title: "Makara Sankranti", date: "2027-01-14" },
  { title: "Republic Day", date: "2027-01-26" },
  { title: "Maha Shivaratri", date: "2027-03-05" },
  { title: "Ugadi", date: "2027-03-19" },
  { title: "Good Friday", date: "2027-03-26" },
  { title: "May Day", date: "2027-05-01" },
];

const TERM_STRUCTURE: { title: string; start: string; end: string }[] = [
  { title: "Term 1", start: "2026-08-03", end: "2026-12-18" },
  { title: "Winter Break", start: "2026-12-19", end: "2027-01-05" },
  { title: "Term 2", start: "2027-01-06", end: "2027-06-04" },
];

export async function syncNationalCalendar() {
  let added = 0;
  for (const h of NATIONAL_HOLIDAYS_2026_27) {
    const exists = await prisma.academicEvent.findFirst({
      where: { title: h.title, source: "NATIONAL" },
    });
    if (!exists) {
      await prisma.academicEvent.create({
        data: { title: h.title, type: "NATIONAL_HOLIDAY", startDate: new Date(h.date), source: "NATIONAL", notes: "Synced from national calendar" },
      });
      added++;
    }
  }
  for (const t of TERM_STRUCTURE) {
    const exists = await prisma.academicEvent.findFirst({ where: { title: t.title, type: "TERM" } });
    if (!exists) {
      await prisma.academicEvent.create({
        data: { title: t.title, type: "TERM", startDate: new Date(t.start), endDate: new Date(t.end), source: "SCHOOL" },
      });
      added++;
    }
  }
  revalidatePath("/admin/academic-setup/calendar");
  return { success: true, added };
}

// Pulls IB exam sessions into the calendar as blocked exam windows
export async function syncIBExamWindows() {
  const sessions = await prisma.iBExamSession.findMany();
  const byName = new Map<string, { min: Date; max: Date; programme: string }>();
  for (const s of sessions) {
    const e = byName.get(s.session);
    if (!e) byName.set(s.session, { min: s.date, max: s.date, programme: s.programme });
    else {
      if (s.date < e.min) e.min = s.date;
      if (s.date > e.max) e.max = s.date;
    }
  }
  let added = 0;
  for (const [name, w] of byName) {
    const exists = await prisma.academicEvent.findFirst({ where: { title: name, source: "IB" } });
    if (!exists) {
      await prisma.academicEvent.create({
        data: {
          title: name,
          type: "EXAM_WINDOW",
          startDate: w.min,
          endDate: w.max,
          source: "IB",
          notes: `${w.programme} — timetable auto-blocked during this window`,
        },
      });
      added++;
    }
  }
  revalidatePath("/admin/academic-setup/calendar");
  return { success: true, added };
}

export async function addCalendarEvent(formData: FormData) {
  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!title || !startDate) return { error: "Title and date are required." };

  await prisma.academicEvent.create({
    data: {
      title,
      type: type || "EVENT",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      source: "SCHOOL",
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/admin/academic-setup/calendar");
  return { success: true };
}

export async function deleteCalendarEvent(id: string) {
  await prisma.academicEvent.delete({ where: { id } });
  revalidatePath("/admin/academic-setup/calendar");
  return { success: true };
}
