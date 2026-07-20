import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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

  // Real count of homework not yet submitted, for the dashboard card.
  const homeworks = studentProfile?.classroomId
    ? await prisma.homework.findMany({
        where: { classroomId: studentProfile.classroomId },
        include: { submissions: { where: { studentId: studentProfile.id } } },
      })
    : [];
  const pendingHomework = homeworks.filter((h) => h.submissions.length === 0).length;

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <SchoolSnapshot />
      <PageHeader
        title={`Welcome back, ${session?.user.name.split(' ')[0]}!`}
        description="Here is your academic progress and daily tasks."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "My Homework", meta: pendingHomework === 0 ? "All caught up" : `${pendingHomework} pending`, href: "/student/homework", icon: BookOpen, cta: "View all" },
          { title: "AI Tutor", meta: "Ask about a concept", href: "/student/tutor", icon: Sparkles, cta: "Open tutor" },
          { title: "Timetable", meta: studentProfile?.classroom?.name || studentProfile?.curriculum || "Not assigned", href: "/student/timetable", icon: Target, cta: "View schedule" },
          { title: "My Progress", meta: "Grades & report card", href: "/student/report-card", icon: Trophy, cta: "View report" },
        ].map((c) => (
          <Card key={c.title}>
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                <c.icon size={20} strokeWidth={1.75} />
              </div>
              <h3 className="font-heading text-base text-foreground mt-4">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{c.meta}</p>
              <Link href={c.href} className="text-sm font-medium text-primary hover:underline mt-3 inline-block">
                {c.cta}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
