import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, BrainCircuit, ArrowRight, GraduationCap, HeartHandshake } from "lucide-react";

export default async function StudentsHubPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) redirect('/');

  const studentCount = await prisma.student.count();

  const sections = [
    {
      title: "Register Student",
      description: "Enroll a new student and capture family details.",
      href: "/admin/students/register",
      icon: UserPlus,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Sentiment AI",
      description: "Scan teacher notes for early signs of disengagement.",
      href: "/admin/students/sentiment-ai",
      icon: BrainCircuit,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: "Learning Needs & IEP",
      description: "Flag SEN students, track individualised goals and accommodations.",
      href: "/admin/students/learning-needs",
      icon: HeartHandshake,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Students"
        description="Enrollment and AI-assisted student wellbeing tools."
      />

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
          <GraduationCap size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{studentCount}</p>
          <p className="text-xs text-slate-500">Students enrolled &middot; see full directory under Users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <div className="h-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{s.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{s.description}</p>
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                Open <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
