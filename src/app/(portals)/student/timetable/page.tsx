import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { mockEntries } from "@/lib/mockTimetable";



export default async function StudentTimetablePage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { classroom: true }
  });

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="My Timetable" 
          description={`Weekly schedule for Class ${student?.classroom?.name || "9A"}`}
        />
      </div>

      <TimetableGrid 
        entries={mockEntries} 
        isEditable={false} 
        subjectLinkBase="/student/subjects"
      />
    </div>
  );
}
