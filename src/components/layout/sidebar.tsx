"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building, GraduationCap, Users, LayoutDashboard, 
  Settings, UserPlus, BookOpen, Clock, FileText,
  MessageSquare, DollarSign, Activity, CheckCircle2, Calendar, Bus,
  ShieldAlert, Wallet, Tent, Pill, Plane, Video, Bell, Monitor, Bed, HelpCircle
} from "lucide-react";

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const roleLinks = {
    SUPER_ADMIN: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: Activity },
      { name: "Schools", href: "/admin/schools", icon: Building },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Transport", href: "/admin/transport", icon: Bus },
      { name: "Behavior", href: "/admin/behavior", icon: ShieldAlert },
      { name: "Clubs", href: "/admin/clubs", icon: Tent },
      { name: "Clinic", href: "/admin/clinic", icon: Pill },
      { name: "IT Assets", href: "/admin/assets", icon: Monitor },
      { name: "Hostel", href: "/admin/hostel", icon: Bed },
    ],
    PRINCIPAL: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: Activity },
      { name: "Schools", href: "/admin/schools", icon: Building },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Transport", href: "/admin/transport", icon: Bus },
      { name: "Behavior", href: "/admin/behavior", icon: ShieldAlert },
      { name: "Clubs", href: "/admin/clubs", icon: Tent },
      { name: "Clinic", href: "/admin/clinic", icon: Pill },
      { name: "IT Assets", href: "/admin/assets", icon: Monitor },
      { name: "Hostel", href: "/admin/hostel", icon: Bed },
    ],
    CLASS_TEACHER: [
      { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { name: "Lesson Planner", href: "/teacher/planner", icon: Calendar },
      { name: "My Classes", href: "/teacher/classes", icon: Users },
      { name: "Attendance", href: "/teacher/attendance", icon: CheckCircle2 },
      { name: "Assignments", href: "/teacher/assignments", icon: FileText },
      { name: "Quizzes", href: "/teacher/quizzes", icon: HelpCircle },
      { name: "Leave Request", href: "/teacher/leave", icon: Plane },
    ],
    SUBJECT_TEACHER: [
      { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { name: "Lesson Planner", href: "/teacher/planner", icon: Calendar },
      { name: "My Classes", href: "/teacher/classes", icon: Users },
      { name: "Attendance", href: "/teacher/attendance", icon: CheckCircle2 },
      { name: "Assignments", href: "/teacher/assignments", icon: FileText },
      { name: "Quizzes", href: "/teacher/quizzes", icon: HelpCircle },
      { name: "Leave Request", href: "/teacher/leave", icon: Plane },
    ],
    PARENT: [
      { name: "Dashboard", href: "/parent", icon: LayoutDashboard },
      { name: "Attendance", href: "/parent/attendance", icon: Clock },
      { name: "Gradebook", href: "/parent/grades", icon: BookOpen },
      { name: "Meetings", href: "/parent/meetings", icon: Video },
      { name: "Fees", href: "/parent/fees", icon: DollarSign },
      { name: "Messages", href: "/parent/messages", icon: MessageSquare },
    ],
    STUDENT: [
      { name: "Dashboard", href: "/student", icon: LayoutDashboard },
      { name: "My Homework", href: "/student/homework", icon: BookOpen },
      { name: "Timetable", href: "/student/timetable", icon: Calendar },
      { name: "E-Library", href: "/student/library", icon: BookOpen },
      { name: "AI Tutor", href: "/student/tutor", icon: MessageSquare },
      { name: "My Wallet", href: "/student/wallet", icon: Wallet },
    ]
  };

  const links = roleLinks[role as keyof typeof roleLinks] || [];

  return (
    <aside className="w-64 flex-shrink-0 bg-ui-card border-r border-ui-border flex flex-col transition-all duration-300 dark:bg-black dark:border-zinc-800">
      <div className="p-6 flex items-center gap-3 border-b border-ui-border dark:border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-royal-600 to-navy-900 flex items-center justify-center text-white font-bold font-heading">
          E
        </div>
        <h2 className="font-heading font-bold text-lg text-navy-900 dark:text-slate-100 tracking-tight">EduSphere 360</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive 
                ? "bg-royal-600/10 text-royal-600 dark:bg-royal-600/20 dark:text-royal-400" 
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {link.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-ui-border dark:border-slate-800">
        <div className="p-4 bg-ai-600/10 rounded-xl border border-ai-600/20">
          <p className="text-xs font-semibold text-ai-600 dark:text-ai-400 mb-1">AI Assistant Enabled</p>
          <p className="text-[10px] text-slate-500">Press Ctrl+K to ask anything.</p>
        </div>
      </div>
    </aside>
  );
}
