"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

/**
 * Sitting an exam, as something the database knows about.
 *
 * Before this, an exam existed only in React state until the moment it was
 * submitted. A flat battery, a closed lid, a browser crash or a stray reload
 * halfway through a two-hour paper lost the entire script with no record that
 * the student had ever started. The full-screen breach counter was shown to the
 * student as if it were being recorded and was thrown away on submit. And the
 * timer restarted from the top on every refresh.
 */

async function me() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "STUDENT") return null;
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, classroomId: true },
  });
  return student;
}

/** The attempt must belong to the caller and still be open. */
async function openAttempt(attemptId: string) {
  const student = await me();
  if (!student) return null;
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, studentId: true, status: true },
  });
  if (!attempt || attempt.studentId !== student.id || attempt.status !== "IN_PROGRESS") return null;
  return attempt;
}

/**
 * Open (or resume) an attempt. Returns the attempt id the client saves answers
 * against. Creating it here rather than on submit is what makes a half-finished
 * paper recoverable.
 */
export async function beginAttempt(quizId: string): Promise<{ attemptId?: string; error?: string }> {
  const student = await me();
  if (!student) return { error: "Sign in as a student to sit this exam." };

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, classroomId: true, status: true, totalMarks: true },
  });
  if (!quiz || quiz.classroomId !== student.classroomId) return { error: "That exam is not set for your class." };
  if (quiz.status !== "PUBLISHED") return { error: "That exam is not open." };

  const existing = await prisma.quizAttempt.findFirst({
    where: { quizId, studentId: student.id },
    select: { id: true, status: true },
  });
  if (existing) {
    if (existing.status !== "IN_PROGRESS") return { error: "You have already submitted this exam." };
    return { attemptId: existing.id };
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId, studentId: student.id, score: 0, totalScore: quiz.totalMarks,
      status: "IN_PROGRESS", startedAt: new Date(),
    },
    select: { id: true },
  });
  return { attemptId: attempt.id };
}

/**
 * Persist one answer as it is typed or chosen.
 *
 * Upsert keyed on the (attemptId, questionId) unique index added in the
 * persistence migration, so repeated edits to the same question overwrite one
 * row instead of accumulating.
 */
export async function saveAnswer(attemptId: string, questionId: string, value: string): Promise<{ ok: boolean }> {
  const attempt = await openAttempt(attemptId);
  if (!attempt) return { ok: false };

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, type: true, quizId: true },
  });
  if (!question) return { ok: false };

  const isMcq = question.type === "MCQ";
  const selectedIdx = isMcq && value !== "" ? Number(value) : null;
  const textAnswer = isMcq ? null : value || null;
  if (isMcq && selectedIdx !== null && !Number.isInteger(selectedIdx)) return { ok: false };

  await prisma.quizResponse.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, selectedIdx, textAnswer },
    update: { selectedIdx, textAnswer },
  });
  return { ok: true };
}

/** Record a lockdown breach. The student is told it is recorded; now it is. */
export async function recordViolation(attemptId: string): Promise<{ violations?: number }> {
  const attempt = await openAttempt(attemptId);
  if (!attempt) return {};
  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { violations: { increment: 1 } },
    select: { violations: true },
  });
  return { violations: updated.violations };
}

/**
 * Finalise the attempt: mark the MCQs, store the total, and close it.
 *
 * Answers are read from the rows already saved during the sitting rather than
 * from the submitted form, so what is marked is what was actually recorded —
 * a submit that races a last keystroke cannot silently drop an answer.
 */
export async function submitExam(quizId: string, formData: FormData): Promise<{ error?: string }> {
  const student = await me();
  if (!student) return { error: "Your session has expired." };

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, classroomId: true, status: true, totalMarks: true, questions: { select: { id: true, type: true, correctIdx: true, points: true } } },
  });
  if (!quiz || quiz.classroomId !== student.classroomId) return { error: "That exam is not set for your class." };

  const attempt = await prisma.quizAttempt.findFirst({
    where: { quizId, studentId: student.id },
    select: { id: true, status: true },
  });
  if (!attempt) return { error: "No attempt to submit — press Begin first." };
  if (attempt.status !== "IN_PROGRESS") return { error: "You have already submitted this exam." };

  const autoSubmitted = formData.get("autoSubmitted") === "true";

  // Last-write-wins for anything the client managed to send with the submit.
  for (const q of quiz.questions) {
    const raw = formData.get(`q_${q.id}`);
    if (raw === null) continue;
    await saveAnswer(attempt.id, q.id, String(raw));
  }

  const saved = await prisma.quizResponse.findMany({
    where: { attemptId: attempt.id },
    select: { id: true, questionId: true, selectedIdx: true },
  });
  const byQuestion = new Map(saved.map((r) => [r.questionId, r]));

  let mcqScore = 0;
  const marks: { id: string; marksAwarded: number }[] = [];
  for (const q of quiz.questions) {
    if (q.type !== "MCQ") continue;
    const r = byQuestion.get(q.id);
    if (!r) continue;
    const awarded = r.selectedIdx === q.correctIdx ? q.points : 0;
    mcqScore += awarded;
    marks.push({ id: r.id, marksAwarded: awarded });
  }

  await prisma.$transaction([
    ...marks.map((m) => prisma.quizResponse.update({ where: { id: m.id }, data: { marksAwarded: m.marksAwarded } })),
    prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: { score: mcqScore, totalScore: quiz.totalMarks, autoSubmitted, status: "SUBMITTED", submittedAt: new Date() },
    }),
  ]);

  revalidatePath("/student/exams");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  return {};
}
