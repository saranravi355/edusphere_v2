import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { timetableForTeacher } from "@/lib/timetable";
import PlannerClient from "./PlannerClient";
import AIFeatureLink from "@/components/ai/AIFeatureLink";
import { BookOpenCheck, Search } from "lucide-react";

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

  // The grid below used to render a hardcoded array from lib/mockTimetable.
  const myWeek = await timetableForTeacher(teacher?.id);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AIFeatureLink
          href="/teacher/lesson-copilot"
          icon={<BookOpenCheck size={15} />}
          title="Lesson Plan Co-Pilot"
          description="Drafts an IB-aligned lesson plan from the unit guide."
        />
        <AIFeatureLink
          href="/teacher/curriculum-qa"
          icon={<Search size={15} />}
          title="Curriculum Q&A"
          description="Answers from the subject guides, quoting where each came from."
        />
      </div>

      <PlannerClient plans={plans} subjects={teacher?.subjects.split(",").map((s) => s.trim()) || []} />

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">My weekly timetable</h3>
        {myWeek.length > 0 ? (
          <TimetableGrid entries={myWeek} isEditable={false} />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
            You are not timetabled for any periods yet. Once the office publishes the schedule in
            Academic Setup, your week appears here.
          </div>
        )}
      </div>
    </div>
  );
}
