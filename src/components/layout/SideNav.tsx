"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Building, GraduationCap, Users, LayoutDashboard, Settings, BookOpen, Clock,
  FileText, DollarSign, Activity, CheckCircle2, Calendar, Bus, Wallet, Tent,
  Plane, Video, Monitor, Bed, HelpCircle, Receipt, BrainCircuit, Book,
  ShieldAlert, Navigation, Target, UtensilsCrossed, Package, Award,
  ClipboardCheck, HeartHandshake, Search, ChevronsLeft, ChevronsRight, X, Globe2, Upload, MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  links: NavLink[];
}

const ADMIN_ACADEMICS: NavSection = {
  label: "Academics",
  links: [
    { name: "Academic Setup", href: "/admin/academic-setup", icon: BookOpen },
    { name: "Timetable", href: "/admin/academic-setup/timetable", icon: Calendar },
    { name: "IB Programmes", href: "/admin/programmes", icon: Globe2 },
    { name: "CAS Tracker", href: "/admin/programmes/cas", icon: HeartHandshake },
    { name: "Exams", href: "/admin/exams", icon: ClipboardCheck },
    { name: "Library", href: "/admin/library", icon: Book },
  ],
};

const ADMIN_PEOPLE: NavSection = {
  label: "People",
  links: [
    { name: "Staff", href: "/admin/staff", icon: Users },
    { name: "Students", href: "/admin/students", icon: GraduationCap },
    { name: "Data Import", href: "/admin/students/import", icon: Upload },
    { name: "Behavior", href: "/admin/behavior", icon: ShieldAlert },
    { name: "Clubs", href: "/admin/clubs", icon: Tent },
    { name: "Alumni", href: "/admin/alumni", icon: Award },
  ],
};

const ADMIN_OVERVIEW: NavSection = {
  label: "Overview",
  links: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Live Ops", href: "/admin/live", icon: Activity },
    { name: "Analytics", href: "/admin/analytics", icon: Activity },
    { name: "AI Insights", href: "/admin/ai-insights", icon: BrainCircuit },
  ],
};

const SECTIONS: Record<string, NavSection[]> = {
  SUPER_ADMIN: [
    ADMIN_OVERVIEW,
    ADMIN_ACADEMICS,
    ADMIN_PEOPLE,
    {
      label: "Finance",
      links: [
        { name: "Finance", href: "/admin/finance", icon: DollarSign },
        { name: "Fee Plans", href: "/admin/fees", icon: Receipt },
      ],
    },
    {
      label: "Operations",
      links: [
        { name: "Canteen", href: "/admin/canteen", icon: UtensilsCrossed },
        { name: "Transport", href: "/admin/transport", icon: Bus },
        { name: "Hostel", href: "/admin/hostel", icon: Bed },
        { name: "Resources", href: "/admin/resources", icon: Monitor },
        { name: "Assets", href: "/admin/assets", icon: Package },
      ],
    },
    {
      label: "System",
      links: [
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Schools", href: "/admin/schools", icon: Building },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ],
  PRINCIPAL: [ADMIN_OVERVIEW, ADMIN_ACADEMICS, ADMIN_PEOPLE],
  CLASS_TEACHER: [],
  SUBJECT_TEACHER: [],
  PARENT: [
    {
      label: "Overview",
      links: [{ name: "Dashboard", href: "/parent", icon: LayoutDashboard }],
    },
    {
      label: "My Child",
      links: [
        { name: "Timetable", href: "/parent/timetable", icon: Clock },
        { name: "Attendance", href: "/parent/attendance", icon: CheckCircle2 },
        { name: "Gradebook", href: "/parent/grades", icon: BookOpen },
        { name: "Discipline", href: "/parent/discipline", icon: ShieldAlert },
      ],
    },
    {
      label: "School",
      links: [
        { name: "Live Tracker", href: "/parent/transport/live", icon: Navigation },
        { name: "Meetings", href: "/parent/meetings", icon: Video },
        { name: "Messages", href: "/parent/messages", icon: MessageSquare },
        { name: "Fees", href: "/parent/fees", icon: DollarSign },
      ],
    },
  ],
  STUDENT: [
    {
      label: "Overview",
      links: [{ name: "Dashboard", href: "/student", icon: LayoutDashboard }],
    },
    {
      label: "Learning",
      links: [
        { name: "My Subjects", href: "/student/subjects", icon: BookOpen },
        { name: "AI Tools", href: "/student/ai-tools", icon: Target },
        { name: "Assignments", href: "/student/homework", icon: FileText },
        { name: "Schedule", href: "/student/timetable", icon: Clock },
        { name: "Exams", href: "/student/exams", icon: ClipboardCheck },
      ],
    },
    {
      label: "Results",
      links: [
        { name: "My Grades", href: "/student/grades", icon: BookOpen },
        { name: "Report Card", href: "/student/report-card", icon: FileText },
      ],
    },
    {
      label: "School Life",
      links: [
        { name: "Clubs", href: "/student/clubs", icon: Tent },
        { name: "Alumni", href: "/student/alumni-wall", icon: Award },
        { name: "Wallet", href: "/student/wallet", icon: Wallet },
      ],
    },
  ],
};

const TEACHER_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    links: [{ name: "Dashboard", href: "/teacher", icon: LayoutDashboard }],
  },
  {
    label: "Teaching",
    links: [
      { name: "My Classes", href: "/teacher/classes", icon: Users },
      { name: "Planner", href: "/teacher/planner", icon: Calendar },
      { name: "Attendance", href: "/teacher/attendance", icon: CheckCircle2 },
      { name: "Assignments", href: "/teacher/assignments", icon: FileText },
      { name: "Grading", href: "/teacher/grading", icon: BookOpen },
      { name: "Quizzes", href: "/teacher/quizzes", icon: HelpCircle },
      { name: "Moderation", href: "/teacher/moderation", icon: ClipboardCheck },
    ],
  },
  {
    label: "Students",
    links: [
      { name: "Directory", href: "/teacher/students", icon: Search },
      { name: "IEP", href: "/teacher/learning-needs", icon: HeartHandshake },
      { name: "Discipline", href: "/teacher/discipline", icon: ShieldAlert },
      { name: "Messages", href: "/teacher/messages", icon: MessageSquare },
    ],
  },
  {
    label: "AI",
    links: [{ name: "AI Tools", href: "/teacher/ai-tools", icon: BrainCircuit }],
  },
  {
    label: "Me",
    links: [
      { name: "My PD", href: "/teacher/pd", icon: GraduationCap },
      { name: "Leave", href: "/teacher/leave", icon: Plane },
    ],
  },
];

SECTIONS.CLASS_TEACHER = TEACHER_SECTIONS;
SECTIONS.SUBJECT_TEACHER = TEACHER_SECTIONS;

const ROOT_HREFS = ["/admin", "/teacher", "/parent", "/student"];

export default function SideNav({
  role,
  collapsed,
  mobileOpen,
  onClose,
  onCollapseToggle,
}: {
  role: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onCollapseToggle: () => void;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const sections = SECTIONS[role] || [];

  // Longest-prefix match so nested routes highlight only the most specific link
  const allHrefs = sections.flatMap((s) => s.links.map((l) => l.href));
  const activeHref = allHrefs.reduce<string | null>((best, href) => {
    const matches = pathname === href || (!ROOT_HREFS.includes(href) && pathname.startsWith(href + "/"));
    if (!matches) return best;
    if (!best || href.length > best.length) return href;
    return best;
  }, null);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-black border-r border-slate-200 dark:border-zinc-800 transition-all duration-200
          w-72 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:z-auto ${collapsed ? "lg:w-[76px]" : "lg:w-64"}`}
      >
        {/* Brand */}
        <div className={`h-16 flex items-center border-b border-slate-100 dark:border-zinc-800/50 flex-shrink-0 ${collapsed ? "lg:justify-center lg:px-0 px-5" : "px-5"} justify-between`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-heading flex-shrink-0">
              E
            </div>
            {!collapsed && (
              <span className="font-heading font-extrabold text-lg tracking-tight text-navy-900 dark:text-white truncate">
                EduSphere <span className="text-xs font-bold text-blue-500 align-top ml-0.5">AlphaV1</span>
              </span>
            )}
            {collapsed && (
              <span className="hidden" aria-hidden />
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
          {sections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600" suppressHydrationWarning>
                  {t(`sidenav.sections.${section.label}`, section.label)}
                </p>
              )}
              {collapsed && <div className="mx-2.5 mb-2 border-t border-slate-100 dark:border-zinc-800/70 first:hidden" />}
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const isActive = link.href === activeHref;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      title={collapsed ? t(`sidenav.links.${link.name}`, link.name) : undefined}
                      className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${collapsed ? "lg:justify-center" : ""} ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon size={17} className="flex-shrink-0" />
                      <span className={collapsed ? "lg:hidden" : ""} suppressHydrationWarning>{t(`sidenav.links.${link.name}`, link.name)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:block border-t border-slate-100 dark:border-zinc-800/50 p-3 flex-shrink-0">
          <button
            onClick={onCollapseToggle}
            className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-zinc-900 transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
