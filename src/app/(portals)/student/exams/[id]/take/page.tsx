import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import ExamTakingClient from "@/components/exam/ExamTakingClient";

async function submitExam(examId: string, studentId: string, formData: FormData) {
  "use server";

  const quiz = await prisma.quiz.findUnique({ where: { id: examId }, include: { questions: true } });
  if (!quiz) return;

  const existing = await prisma.quizAttempt.findFirst({ where: { quizId: examId, studentId } });
  if (existing) return; // already attempted

  const autoSubmitted = formData.get("autoSubmitted") === "true";

  let mcqScore = 0;
  const responseData = quiz.questions.map((q) => {
    if (q.type === "MCQ") {
      const selectedIdx = formData.get(`q_${q.id}`) ? parseInt(formData.get(`q_${q.id}`) as string) : null;
      const marks = selectedIdx === q.correctIdx ? q.points : 0;
      mcqScore += marks;
      return { questionId: q.id, selectedIdx, textAnswer: null, marksAwarded: marks };
    } else {
      const textAnswer = (formData.get(`q_${q.id}`) as string) || null;
      return { questionId: q.id, selectedIdx: null, textAnswer, marksAwarded: null };
    }
  });

  const hasOpenEnded = quiz.questions.some((q) => q.type !== "MCQ");

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: examId,
      studentId,
      score: mcqScore,
      totalScore: quiz.totalMarks,
      autoSubmitted,
      status: hasOpenEnded ? "SUBMITTED" : "SUBMITTED",
      startedAt: new Date(),
    },
  });

  await prisma.quizResponse.createMany({
    data: responseData.map((r) => ({ ...r, attemptId: attempt.id })),
  });

  revalidatePath("/student/exams");
  redirect(`/student/exams/${examId}/result`);
}

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) redirect("/");

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true, subject: true },
  });

  if (!quiz || quiz.classroomId !== student.classroomId) notFound();
  if (!["PUBLISHED", "PENDING_MODERATION", "MODERATED", "GRADES_RELEASED"].includes(quiz.status)) notFound();

  const existingAttempt = await prisma.quizAttempt.findFirst({ where: { quizId: id, studentId: student.id } });
  if (existingAttempt) redirect(`/student/exams/${id}/result`);

  // Randomize question order and MCQ option order for this attempt
  const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5);
  const questions = shuffled.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    points: q.points,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
  }));

  const action = submitExam.bind(null, quiz.id, student.id);

  return (
    <ExamTakingClient
      examTitle={quiz.title}
      examType={quiz.examType}
      subjectName={quiz.subject?.name}
      timeLimitMinutes={quiz.timeLimitMinutes}
      questions={questions}
      submitAction={action}
    />
  );
}
