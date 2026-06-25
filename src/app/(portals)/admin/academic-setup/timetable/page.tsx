import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import TimetableManager from "@/components/timetable/TimetableManager";

export default async function AITimetableOptimizer() {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { name: 'asc' }
  });
  
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' }
  });
  
  const teachers = await prisma.teacher.findMany({
    include: { user: true },
    orderBy: { user: { name: 'asc' } }
  });

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <PageHeader 
        title="Timetable Generator" 
        description="Manage sections, allocate rooms, and prevent scheduling conflicts."
      />
      
      <TimetableManager 
        classrooms={classrooms} 
        subjects={subjects} 
        teachers={teachers} 
      />
    </div>
  );
}
