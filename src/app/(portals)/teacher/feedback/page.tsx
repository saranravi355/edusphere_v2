import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TeacherFeedbackReceivedClient from "./TeacherFeedbackReceivedClient";

export const dynamic = "force-dynamic";

export default async function TeacherFeedbackReceivedPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) redirect("/teacher");

  // Deliberately not selecting studentId — this view must never be able to
  // show, even by accident, which student left which rating.
  const feedback = await prisma.teacherFeedback.findMany({
    where: { teacherId: teacher.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      classConductRating: true,
      explanationRating: true,
      communicationRating: true,
      supportRating: true,
      comment: true,
      updatedAt: true,
    },
  });

  const n = feedback.length;
  const avg = (key: keyof (typeof feedback)[number]) =>
    n === 0 ? 0 : feedback.reduce((sum, f) => sum + (f[key] as number), 0) / n;

  const summary = {
    count: n,
    classConduct: avg("classConductRating"),
    explanation: avg("explanationRating"),
    communication: avg("communicationRating"),
    support: avg("supportRating"),
  };

  const items = feedback.map((f) => ({
    id: f.id,
    classConductRating: f.classConductRating,
    explanationRating: f.explanationRating,
    communicationRating: f.communicationRating,
    supportRating: f.supportRating,
    comment: f.comment,
    updatedAt: f.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Feedback From Students"
        description="Structured ratings your students have submitted. Responses are anonymous — student identity is never linked to a rating here."
      />
      <TeacherFeedbackReceivedClient summary={summary} items={items} />
    </div>
  );
}
