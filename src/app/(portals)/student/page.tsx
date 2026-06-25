import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";



export default async function StudentDashboard() {
  const session = await getSession();
  const studentProfile = await prisma.student.findUnique({
    where: { userId: session?.user.id },
    include: { grades: true, classroom: true }
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <SchoolSnapshot />
      <PageHeader 
        title={`Welcome back, ${session?.user.name.split(' ')[0]}!`}
        description="Here is your academic progress and daily tasks."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">My Homework</h3>
              <p className="text-sm text-slate-500">2 Due Today</p>
            </div>
            <Link href="/student/homework" className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-2">View All →</Link>
          </CardContent>
        </Card>

        <Card className="glass-card bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:shadow-md transition-shadow border-indigo-200 dark:border-indigo-800/50">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">AI Tutor</h3>
              <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80">Stuck on a concept?</p>
            </div>
            <Link href="/student/tutor" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-2">Ask EduBot →</Link>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <Target size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Timetable</h3>
              <p className="text-sm text-slate-500">Class {studentProfile?.classroom?.name || "9A"}</p>
            </div>
            <Link href="/student/timetable" className="text-sm font-medium text-green-600 hover:text-green-700 mt-2">View Schedule →</Link>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">My Progress</h3>
              <p className="text-sm text-slate-500">View your grades</p>
            </div>
            <Link href="/student/progress" className="text-sm font-medium text-orange-600 hover:text-orange-700 mt-2">View Report →</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
