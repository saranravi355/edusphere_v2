import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import TimetableManager from "@/components/timetable/TimetableManager";
import Link from "next/link";
import { Sparkles } from "lucide-react";

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

      <Link href="/admin/academic-setup/timetable/auto-generate" className="group block">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 shadow-sm flex items-center justify-between text-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Sparkles size={20} />
            <div>
              <p className="font-bold">AI Auto-Generator</p>
              <p className="text-xs text-blue-100">Build a conflict-free weekly timetable for any class in under 60 seconds.</p>
            </div>
          </div>
          <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Try it →</span>
        </div>
      </Link>

      <TimetableManager 
        classrooms={classrooms} 
        subjects={subjects} 
        teachers={teachers} 
      />
    </div>
  );
}
