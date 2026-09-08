import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TeacherFeedbackAdminClient from "./TeacherFeedbackAdminClient";

export const dynamic = "force-dynamic";

/**
 * The Principal's view of student → teacher feedback.
 *
 * Deliberately the one place this is de-anonymized: the student and teacher
 * portals never pair a name with a rating (student/teacher-feedback,
 * teacher/feedback), by design, so students can be candid. This page trades
 * that away on purpose for the school's oversight role — someone has to be
 * able to see a pattern of concerning feedback traced to a specific teacher,
 * or a student submitting bad-faith ratings, and only Admin/Principal reach
 * this route (enforced by canOpenAdminPath, not just the page-level check).
 */
export default async function AdminTeacherFeedbackPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const feedback = await prisma.teacherFeedback.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      student: { select: { id: true, name: true, registrationNo: true, classroom: { select: { name: true } } } },
      teacher: { select: { id: true, user: { select: { name: true } } } },
    },
  });

  const rows = feedback.map((f) => ({
    id: f.id,
    studentName: f.student.name,
    studentRegistrationNo: f.student.registrationNo,
    classroom: f.student.classroom?.name ?? null,
    teacherName: f.teacher.user.name,
    classConductRating: f.classConductRating,
    explanationRating: f.explanationRating,
    communicationRating: f.communicationRating,
    supportRating: f.supportRating,
    comment: f.comment,
    updatedAt: f.updatedAt.toISOString(),
  }));

  const teacherNames = Array.from(new Set(rows.map((r) => r.teacherName))).sort();

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Teacher & Student Feedback"
        description="Every rating a student has submitted about a teacher, with both names attached — the student and teacher portals keep this anonymous by design; this is the one place it isn't."
      />
      <TeacherFeedbackAdminClient rows={rows} teacherNames={teacherNames} />
    </div>
  );
}
