import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ExamTakingClient from "@/components/exam/ExamTakingClient";
import { beginAttempt, saveAnswer, recordViolation, submitExam } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Time left on a sitting, measured from when the attempt was opened rather than
 * from when this page rendered — refreshing must not hand back a fresh
 * allowance. Kept out of the component body because reading the clock during
 * render is not a pure operation.
 */
function remainingSeconds(limitMinutes: number | null, startedAt: Date | null): number | null {
  if (limitMinutes === null) return null;
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;
  return Math.max(0, limitMinutes * 60 - elapsed);
}

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) redirect("/");

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true, subject: true },
  });

  if (!quiz || quiz.classroomId !== student.classroomId) notFound();

  /*
   * The list offered "Start" for four statuses while the submit handler
   * accepted only two, so sitting an exam that was awaiting moderation ran the
   * whole paper and then discarded it without a word. A student can sit an
   * exam that is PUBLISHED; the moderation statuses are the teacher's, after
   * the fact.
   */
  const attempt = await prisma.quizAttempt.findFirst({
    where: { quizId: id, studentId: student.id },
    select: { id: true, status: true, startedAt: true, violations: true },
  });

  if (attempt && attempt.status !== "IN_PROGRESS") redirect(`/student/exams/${id}/result`);
  if (!attempt && quiz.status !== "PUBLISHED") notFound();

  // Deterministic per-student shuffle (seeded), so the order is randomized
  // between students but stable across refreshes — and pure for React.
  function seededShuffle<T>(arr: T[], seedStr: string): T[] {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  const shuffled = seededShuffle(quiz.questions, `${quiz.id}:${student.id}`);
  const questions = shuffled.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    points: q.points,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
  }));

  // Whatever was already answered, so a resumed paper opens where it was left.
  const savedAnswers: Record<string, string> = {};
  if (attempt) {
    const rows = await prisma.quizResponse.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, selectedIdx: true, textAnswer: true },
    });
    for (const r of rows) {
      const value = r.selectedIdx !== null ? String(r.selectedIdx) : r.textAnswer ?? "";
      if (value !== "") savedAnswers[r.questionId] = value;
    }
  }

  /*
   * Remaining time is derived from when the attempt was opened, not from when
   * the page loaded — otherwise refreshing reset the clock to the full
   * allowance, which is the oldest trick there is.
   */
  const secondsRemaining = remainingSeconds(quiz.timeLimitMinutes, attempt?.startedAt ?? null);

  /*
   * If the allowance ran out while the page was closed, the attempt is
   * finalised here rather than waiting for the student to come back and watch
   * a zero countdown. Closing the laptop is no longer a way to stop the clock.
   */
  if (attempt && secondsRemaining === 0) {
    const expired = new FormData();
    expired.set("autoSubmitted", "true");
    await submitExam(quiz.id, expired);
    redirect(`/student/exams/${quiz.id}/result`);
  }

  return (
    <ExamTakingClient
      examTitle={quiz.title}
      examType={quiz.examType}
      subjectName={quiz.subject?.name}
      timeLimitMinutes={quiz.timeLimitMinutes}
      secondsRemaining={secondsRemaining}
      questions={questions}
      resumedAttemptId={attempt?.id ?? null}
      savedAnswers={savedAnswers}
      priorViolations={attempt?.violations ?? 0}
      beginAction={beginAttempt.bind(null, quiz.id)}
      saveAnswerAction={saveAnswer}
      violationAction={recordViolation}
      submitAction={submitExam.bind(null, quiz.id)}
      resultHref={`/student/exams/${quiz.id}/result`}
    />
  );
}
