import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { mockEntries } from "@/lib/mockTimetable";



export default async function ParentTimetablePage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: { include: { classroom: true } } }
  });

  const student = parent?.students[0];

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Timetable" 
          description={`Weekly schedule for ${student?.name || 'your child'} (Class ${student?.classroom?.name || "9A"})`}
        />
      </div>

      <TimetableGrid 
        entries={mockEntries} 
        isEditable={false} 
      />
    </div>
  );
}
