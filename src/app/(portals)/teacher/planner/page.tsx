import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { teacherPlannerMockEntries } from "@/lib/mockTimetable";
import PlannerClient from "./PlannerClient";

export const dynamic = "force-dynamic";

export default async function TeacherPlannerPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { lessonPlans: { orderBy: { date: "asc" } } },
  });

  const plans = (teacher?.lessonPlans || []).map((p) => ({
    id: p.id,
    title: p.title,
    subjectName: p.subjectName,
    className: p.className,
    date: p.date.toISOString(),
    durationMinutes: p.durationMinutes,
    ibUnit: p.ibUnit,
    atlSkills: p.atlSkills,
    learnerProfile: p.learnerProfile,
    objectives: p.objectives,
    activities: p.activities,
    resources: p.resources,
    assessment: p.assessment,
    status: p.status,
    subPlan: p.subPlan,
  }));

  return (
    <div className="space-y-8 pb-12 max-w-[1200px] mx-auto">
      <PageHeader
        title="Planner"
        description="Your weekly schedule plus IB-aligned lesson plans — tag units, ATL skills and learner profile attributes, and generate substitute plans in one tap."
      />

      <PlannerClient plans={plans} subjects={teacher?.subjects.split(",").map((s) => s.trim()) || []} />

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">My Weekly Timetable</h3>
        <TimetableGrid entries={teacherPlannerMockEntries} isEditable={false} />
      </div>
    </div>
  );
}
