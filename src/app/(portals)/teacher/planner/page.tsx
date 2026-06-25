import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { teacherPlannerMockEntries } from "@/lib/mockTimetable";

export default async function TeacherPlannerPage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="My Timetable" 
          description="Your weekly teaching schedule and class allocations."
        />
      </div>

      <TimetableGrid 
        entries={teacherPlannerMockEntries} 
        isEditable={false} 
      />
    </div>
  );
}
