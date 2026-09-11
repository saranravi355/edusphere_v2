"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import {
  SUBJECTS,
  ATL_GROUPS,
  LEARNER_PROFILE,
  UOI_CRITERIA,
  UOI_COUNT,
  RATING_VALUES,
  emptyProgressReportData,
  type ProgressReportData,
} from "@/lib/progressReport";
import { renderProgressReportPdf } from "@/lib/progressReportPdf";
import { put } from "@vercel/blob";

async function homeroomTeacherFor(userId: string, studentId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true, classes: { select: { id: true } } } });
  if (!teacher) return { error: "Your staff record is missing." } as const;

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classroomId: true } });
  if (!student) return { error: "That student no longer exists." } as const;

  const classroomIds = new Set(teacher.classes.map((c) => c.id));
  if (!student.classroomId || !classroomIds.has(student.classroomId)) {
    return { error: "You are not the homeroom teacher for this student." } as const;
  }
  return { teacherId: teacher.id } as const;
}

export async function createDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const studentId = String(formData.get("studentId") ?? "");
  const check = await homeroomTeacherFor(auth.user.id, studentId);
  if ("error" in check) return { error: check.error };

  const term = String(formData.get("term") ?? "").trim();
  const academicYear = String(formData.get("academicYear") ?? "").trim();
  if (!term) return { error: "Choose a term." };
  if (!academicYear) return { error: "Enter an academic year." };

  const grade = String(formData.get("grade") ?? "").trim() || null;

  const existing = await prisma.progressReport.findUnique({
    where: { studentId_academicYear_term: { studentId, academicYear, term } },
    select: { id: true },
  });

  let id: string;
  if (existing) {
    id = existing.id;
  } else {
    const created = await prisma.progressReport.create({
      data: {
        studentId,
        teacherId: check.teacherId,
        academicYear,
        term,
        grade,
        data: emptyProgressReportData() as object,
      },
      select: { id: true },
    });
    id = created.id;
  }

  redirect(`/teacher/progress-reports/${id}`);
}

function collectRatings(formData: FormData, prefix: string, count: number): (string)[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const v = String(formData.get(`${prefix}_${i}`) ?? "");
    out.push(RATING_VALUES.includes(v) ? v : "");
  }
  return out;
}

function parseFormIntoData(formData: FormData): ProgressReportData {
  const homeroomTeacherName = String(formData.get("homeroomTeacherName") ?? "").trim();
  const introLetter = String(formData.get("introLetter") ?? "").trim();

  const unitsOfInquiry = Array.from({ length: UOI_COUNT }, (_, i) => ({
    theme: String(formData.get(`unit_${i}_theme`) ?? "").trim(),
    centralIdea: String(formData.get(`unit_${i}_centralIdea`) ?? "").trim(),
    inquiryPoints: String(formData.get(`unit_${i}_inquiryPoints`) ?? "")
      .split("\n").map((s) => s.trim()).filter(Boolean),
    ratings: collectRatings(formData, `unit_${i}_rating`, UOI_CRITERIA.length),
    comment: String(formData.get(`unit_${i}_comment`) ?? "").trim(),
  })) as ProgressReportData["unitsOfInquiry"];

  const subjects: ProgressReportData["subjects"] = {};
  for (const s of SUBJECTS) {
    const itemCount = s.strands.flatMap((st) => st.items).length;
    subjects[s.key] = {
      itemRatings: collectRatings(formData, `subject_${s.key}_item`, itemCount) as ProgressReportData["subjects"][string]["itemRatings"],
      overall: (collectRatings(formData, `subject_${s.key}_overall_single`, 1)[0] ?? "") as ProgressReportData["subjects"][string]["overall"],
      comment: String(formData.get(`subject_${s.key}_comment`) ?? "").trim(),
    };
  }

  const atl: ProgressReportData["atl"] = {};
  for (const g of ATL_GROUPS) {
    atl[g.name] = collectRatings(formData, `atl_${g.name}_item`, g.items.length) as ProgressReportData["atl"][string];
  }

  const learnerProfile: ProgressReportData["learnerProfile"] = {};
  for (const p of LEARNER_PROFILE) {
    const v = String(formData.get(`lp_${p.name}`) ?? "");
    learnerProfile[p.name] = (RATING_VALUES.includes(v) ? v : "") as ProgressReportData["learnerProfile"][string];
  }

  const booksRead = String(formData.get("booksRead") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  return { homeroomTeacherName, introLetter, unitsOfInquiry, subjects, atl, learnerProfile, booksRead };
}

async function loadReportForTeacher(userId: string, reportId: string) {
  const report = await prisma.progressReport.findUnique({
    where: { id: reportId },
    select: { id: true, studentId: true, teacherId: true },
  });
  if (!report) return { error: "That report no longer exists." } as const;

  const check = await homeroomTeacherFor(userId, report.studentId);
  if ("error" in check) return { error: check.error } as const;
  if (report.teacherId !== check.teacherId) return { error: "That report is not yours." } as const;

  return { report } as const;
}

/**
 * One form, two submit buttons (`intent=save` / `intent=generate`) — a
 * native submit button's name/value pair rides along in FormData only when
 * that button was the one clicked, so this single action can tell which was
 * pressed without needing two separately-bound useActionState hooks on the
 * same 150-odd-field form.
 */
export async function submitReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const intent = String(formData.get("intent") ?? "save");
  if (intent === "generate") return generateReport(formData);
  return saveDraft(formData);
}

async function saveDraft(formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const reportId = String(formData.get("reportId") ?? "");
  const check = await loadReportForTeacher(auth.user.id, reportId);
  if ("error" in check) return { error: check.error };

  const data = parseFormIntoData(formData);
  await prisma.progressReport.update({ where: { id: reportId }, data: { data: data as object } });

  revalidatePath(`/teacher/progress-reports/${reportId}`);
  revalidatePath("/teacher/progress-reports");
  return { success: "Draft saved." };
}

async function generateReport(formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const reportId = String(formData.get("reportId") ?? "");
  const check = await loadReportForTeacher(auth.user.id, reportId);
  if ("error" in check) return { error: check.error };

  const data = parseFormIntoData(formData);
  await prisma.progressReport.update({ where: { id: reportId }, data: { data: data as object } });

  const report = await prisma.progressReport.findUnique({
    where: { id: reportId },
    include: {
      student: { select: { name: true, registrationNo: true, classroom: { select: { name: true } }, userId: true, parent: { select: { userId: true } } } },
    },
  });
  if (!report) return { error: "That report no longer exists." };

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await renderProgressReportPdf({
      studentName: report.student.name,
      registrationNo: report.student.registrationNo,
      classroom: report.student.classroom?.name ?? null,
      academicYear: report.academicYear,
      term: report.term,
      grade: report.grade,
      data: data,
    });
  } catch (err) {
    return { error: `Could not build the PDF: ${(err as Error).message}` };
  }

  let pdfUrl: string;
  try {
    const blob = await put(`progress-reports/${reportId}-${Date.now()}.pdf`, Buffer.from(pdfBytes), {
      access: "public",
      contentType: "application/pdf",
    });
    pdfUrl = blob.url;
  } catch (err) {
    return { error: `Could not upload the PDF: ${(err as Error).message}` };
  }

  await prisma.progressReport.update({
    where: { id: reportId },
    data: { status: "GENERATED", pdfUrl, generatedAt: new Date() },
  });

  const notifyUserIds = [report.student.userId, report.student.parent?.userId].filter((v): v is string => !!v);
  if (notifyUserIds.length) {
    await prisma.notification.createMany({
      data: notifyUserIds.map((userId) => ({
        userId,
        title: "Progress report published",
        message: `${report.term} progress report for ${report.student.name} is now available.`,
        type: "SUCCESS",
      })),
    });
  }

  revalidatePath(`/teacher/progress-reports/${reportId}`);
  revalidatePath("/teacher/progress-reports");
  revalidatePath("/student/progress-report");
  revalidatePath("/parent/progress-report");
  return { success: "Progress report generated." };
}
