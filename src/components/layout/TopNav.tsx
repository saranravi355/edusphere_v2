"use client";

import { Bell, Search, LogOut, Building, GraduationCap, Users, LayoutDashboard, Settings, UserPlus, BookOpen, Clock, FileText, MessageSquare, DollarSign, Activity, CheckCircle2, Calendar, Bus, ShieldAlert, Wallet, Tent, Pill, Plane, Video, Monitor, Bed, HelpCircle, Receipt, BrainCircuit, Book, ShieldAlert as ShieldIcon, Navigation, Target, UtensilsCrossed as UtensilsIcon, Package as PackageIcon, Award, ClipboardCheck, HeartHandshake } from "lucide-react";
import { logout } from "@/app/actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

interface TopNavUser {
  role: string;
  name?: string | null;
}

export default function TopNav({ user }: { user: TopNavUser }) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const role = user.role;

  const roleLinks = {
    // Full operational + financial + academic access
    SUPER_ADMIN: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: Activity },
      { name: "Academic Setup", href: "/admin/academic-setup", icon: BookOpen },
      { name: "Timetable", href: "/admin/academic-setup/timetable", icon: Calendar },
      { name: "AI Insights", href: "/admin/ai-insights", icon: BrainCircuit },
      { name: "Staff", href: "/admin/staff", icon: Users },
      { name: "Students", href: "/admin/students", icon: GraduationCap },
      { name: "Behavior", href: "/admin/behavior", icon: ShieldIcon },
      { name: "Exams", href: "/admin/exams", icon: ClipboardCheck },
      { name: "Alumni", href: "/admin/alumni", icon: Award },
      { name: "Clubs", href: "/admin/clubs", icon: Tent },
      { name: "Library", href: "/admin/library", icon: Book },
      { name: "Finance", href: "/admin/finance", icon: DollarSign },
      { name: "Fee Plans", href: "/admin/fees", icon: Receipt },
      { name: "Canteen", href: "/admin/canteen", icon: UtensilsIcon },
      { name: "Transport", href: "/admin/transport", icon: Bus },
      { name: "Hostel", href: "/admin/hostel", icon: Bed },
      { name: "Resources", href: "/admin/resources", icon: Monitor },
      { name: "Assets", href: "/admin/assets", icon: PackageIcon },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Schools", href: "/admin/schools", icon: Building },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
    // Academic + pastoral leadership only — no finance, ops, or system admin
    PRINCIPAL: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: Activity },
      { name: "Academic Setup", href: "/admin/academic-setup", icon: BookOpen },
      { name: "Timetable", href: "/admin/academic-setup/timetable", icon: Calendar },
      { name: "AI Insights", href: "/admin/ai-insights", icon: BrainCircuit },
      { name: "Staff", href: "/admin/staff", icon: Users },
      { name: "Students", href: "/admin/students", icon: GraduationCap },
      { name: "Behavior", href: "/admin/behavior", icon: ShieldIcon },
      { name: "Exams", href: "/admin/exams", icon: ClipboardCheck },
      { name: "Alumni", href: "/admin/alumni", icon: Award },
      { name: "Clubs", href: "/admin/clubs", icon: Tent },
      { name: "Library", href: "/admin/library", icon: Book },
    ],
    CLASS_TEACHER: [
      { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { name: "Directory", href: "/teacher/students", icon: Search },
      { name: "Grading", href: "/teacher/grading", icon: BookOpen },
      { name: "Planner", href: "/teacher/planner", icon: Calendar },
      { name: "My Classes", href: "/teacher/classes", icon: Users },
      { name: "IEP", href: "/teacher/learning-needs", icon: HeartHandshake },
      { name: "AI Tools", href: "/teacher/ai-tools", icon: BrainCircuit },
      { name: "Discipline", href: "/teacher/discipline", icon: ShieldIcon },
      { name: "Attendance", href: "/teacher/attendance", icon: CheckCircle2 },
      { name: "Assignments", href: "/teacher/assignments", icon: FileText },
      { name: "Quizzes", href: "/teacher/quizzes", icon: HelpCircle },
      { name: "Moderation", href: "/teacher/moderation", icon: ClipboardCheck },
      { name: "My PD", href: "/teacher/pd", icon: GraduationCap },
      { name: "Leave", href: "/teacher/leave", icon: Plane },
    ],
    SUBJECT_TEACHER: [
      { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { name: "Directory", href: "/teacher/students", icon: Search },
      { name: "Grading", href: "/teacher/grading", icon: BookOpen },
      { name: "Planner", href: "/teacher/planner", icon: Calendar },
      { name: "My Classes", href: "/teacher/classes", icon: Users },
      { name: "IEP", href: "/teacher/learning-needs", icon: HeartHandshake },
      { name: "AI Tools", href: "/teacher/ai-tools", icon: BrainCircuit },
      { name: "Discipline", href: "/teacher/discipline", icon: ShieldIcon },
      { name: "Attendance", href: "/teacher/attendance", icon: CheckCircle2 },
      { name: "Assignments", href: "/teacher/assignments", icon: FileText },
      { name: "Quizzes", href: "/teacher/quizzes", icon: HelpCircle },
      { name: "Moderation", href: "/teacher/moderation", icon: ClipboardCheck },
      { name: "My PD", href: "/teacher/pd", icon: GraduationCap },
      { name: "Leave", href: "/teacher/leave", icon: Plane },
    ],
    PARENT: [
      { name: "Dashboard", href: "/parent", icon: LayoutDashboard },
      { name: "Timetable", href: "/parent/timetable", icon: Clock },
      { name: "Live Tracker", href: "/parent/transport/live", icon: Navigation },
      { name: "Attendance", href: "/parent/attendance", icon: Clock },
      { name: "Gradebook", href: "/parent/grades", icon: BookOpen },
      { name: "Discipline", href: "/parent/discipline", icon: ShieldIcon },
      { name: "Meetings", href: "/parent/meetings", icon: Video },
      { name: "Fees", href: "/parent/fees", icon: DollarSign },
    ],
    STUDENT: [
      { name: "Dashboard", href: "/student", icon: LayoutDashboard },
      { name: "AI Tools", href: "/student/ai-tools", icon: Target },
      { name: "Report Card", href: "/student/report-card", icon: FileText },
      { name: "My Grades", href: "/student/grades", icon: BookOpen },
      { name: "Schedule", href: "/student/timetable", icon: Clock },
      { name: "Assignments", href: "/student/homework", icon: FileText },
      { name: "Exams", href: "/student/exams", icon: ClipboardCheck },
      { name: "Alumni", href: "/student/alumni-wall", icon: Award },
      { name: "Wallet", href: "/student/wallet", icon: Wallet },
    ],
  };

  const links = roleLinks[role as keyof typeof roleLinks] || [];

  return (
    <div className="flex flex-col bg-white dark:bg-black border-b border-ui-border dark:border-zinc-800 sticky top-0 z-40 transition-all duration-300 shadow-sm">
      {/* Tier 1: Top Bar */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-royal-600 to-navy-900 flex items-center justify-center text-white font-bold font-heading">
              E
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-navy-900 dark:text-white hidden sm:block">
              EduSphere <span className="text-sm font-bold text-blue-500 align-top ml-1">AlphaV1</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium text-slate-500 transition-colors cursor-pointer">
            <Search size={16} />
            <span className="w-32 text-left" suppressHydrationWarning>{t('nav.search_placeholder', 'Search...')}</span>
            <span className="ml-4 text-xs bg-white dark:bg-black px-1.5 py-0.5 rounded shadow-sm" suppressHydrationWarning>{t('nav.search_shortcut', 'Ctrl+K')}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          {/* Language Switcher */}
          <div className="relative group">
            <button className="flex items-center gap-1 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-zinc-800">
              <span className="text-sm font-bold" suppressHydrationWarning>{t('nav.language_label', 'A/अ')}</span>
              <span className="text-xs uppercase font-medium" suppressHydrationWarning>{i18n.language ? (i18n.language === 'en' ? 'EN' : i18n.language === 'hi' ? 'HI' : 'TA') : 'EN'}</span>
            </button>
            <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50 w-40">
              <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-1">
                  <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${i18n.language === 'en' ? 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-zinc-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}>
                    <div className="flex items-center gap-2"><span className="text-lg">🇺🇸</span> <span suppressHydrationWarning>{t('nav.english', 'English')}</span></div>
                    {i18n.language === 'en' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('hi')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${i18n.language === 'hi' ? 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-zinc-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}>
                    <div className="flex items-center gap-2"><span className="text-lg">🇮🇳</span> <span suppressHydrationWarning>{t('nav.hindi', 'Hindi')}</span></div>
                    {i18n.language === 'hi' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('ta')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${i18n.language === 'ta' ? 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-zinc-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}>
                    <div className="flex items-center gap-2"><span className="text-lg">🇮🇳</span> <span suppressHydrationWarning>{t('nav.tamil', 'Tamil')}</span></div>
                    {i18n.language === 'ta' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ThemeToggle />

          {/* Notifications */}
          <div className="relative group">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-400 dark:hover:bg-zinc-800 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
            </button>
            <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50 w-80">
              <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200" suppressHydrationWarning>{t('nav.notifications', 'Notifications')}</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" suppressHydrationWarning>{t('nav.mark_all_read', 'Mark all read')}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-3 border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Bell size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Emergency Drill</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fire drill scheduled at 11:00 AM.</p>
                    <p className="text-[10px] text-slate-400 mt-1">10 mins ago</p>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-900/50 text-center">
                <span className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer" suppressHydrationWarning>{t('nav.view_all', 'View all')}</span>
              </div>
            </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-navy-900 dark:text-slate-100 leading-none">{user.name || "User"}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              {(user.name || "U")[0]}
            </div>

            <form action={logout}>
              <button type="submit" className="ml-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tier 2: Horizontal Navigation */}
      <nav className="h-14 px-6 lg:px-10 flex items-center gap-6 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-black/50">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
