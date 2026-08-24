"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { GraduationCap, Users, UserCircle, School, Bell, ChevronRight, Building, Briefcase, Boxes, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoFull } from "@/components/ui/Logo";

const NOTICE_TONE: Record<string, string> = {
  TERM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HOLIDAY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  NATIONAL_HOLIDAY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  EXAM_WINDOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  EVENT: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300",
};

export type PublicNotice = {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
};

/**
 * The six front doors.
 *
 * This was five near-identical blocks of JSX, each repeating the same inline
 * arrow SVG. Adding Operations by copying a sixth would have made the next one
 * worse again, so the markup is written once and the differences live here.
 * The slugs match lib/portals.ts, which is what the login form reads to decide
 * the heading and the prefilled address.
 */
const PORTAL_CARDS = [
  { slug: "admin",      label: "Management", Icon: Building,      accent: "border-purple-500", chip: "bg-purple-600 dark:bg-purple-500", text: "text-purple-600 dark:text-purple-500" },
  { slug: "principal",  label: "Principal",  Icon: Briefcase,     accent: "border-pink-500",   chip: "bg-pink-600 dark:bg-pink-500",     text: "text-pink-600 dark:text-pink-500" },
  { slug: "teacher",    label: "Teacher",    Icon: Users,         accent: "border-yellow-500", chip: "bg-yellow-500",                    text: "text-yellow-600 dark:text-yellow-500" },
  { slug: "student",    label: "Student",    Icon: GraduationCap, accent: "border-blue-500",   chip: "bg-blue-600 dark:bg-blue-500",     text: "text-blue-600 dark:text-blue-400" },
  { slug: "parent",     label: "Parent",     Icon: UserCircle,    accent: "border-green-500",  chip: "bg-green-600 dark:bg-green-500",   text: "text-green-600 dark:text-green-500" },
  { slug: "operations", label: "Operations", Icon: Boxes,         accent: "border-teal-500",   chip: "bg-teal-600 dark:bg-teal-500",     text: "text-teal-600 dark:text-teal-400" },
] as const;

export default function LandingPage({ notices }: { notices: PublicNotice[] }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Theme Toggle pinned to top right */}
      <div className="absolute top-6 right-6 z-50 bg-white/80 dark:bg-zinc-900/80 p-1 rounded-full shadow-sm backdrop-blur-sm border border-slate-200 dark:border-zinc-800">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12 z-10 w-full"
      >
        <LogoFull className="h-44 md:h-56 w-auto object-contain mx-auto" />
        <p className="mt-3 text-sm font-bold text-blue-500 tracking-[0.3em] uppercase">Alpha2</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 w-full max-w-[95rem] z-10"
      >
        {PORTAL_CARDS.map(({ slug, label, Icon, accent, chip, text }) => (
          <Link key={slug} href={`/login?role=${slug}`} aria-label={`Sign in to the ${label} portal`}>
            <motion.div variants={itemVariants} className="group relative h-full">
              <div className={`bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 p-8 h-full flex flex-col items-center justify-center gap-4 border-t-4 ${accent} rounded-b-lg`}>
                <Icon size={48} className="text-slate-700 dark:text-slate-300" />
                <div className="flex items-center gap-4 mt-2">
                  <span className={`font-bold text-lg ${text}`}>{label}</span>
                  <span className={`w-8 h-8 rounded ${chip} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <LogIn size={16} aria-hidden />
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* General Notification / Circular Board */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="w-full max-w-4xl mt-12 z-10"
      >
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3 bg-slate-50 dark:bg-zinc-900/50">
            <Bell className="text-blue-600 dark:text-blue-400" size={20} />
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">General Notifications & Circulars</h2>
          </div>
          {/*
            These three rows used to be hardcoded: "Revised Academic Calendar
            for Fall 2026 — Published by Registrar Office", a Dean of Academics
            and a Sports Authority, each with a fixed date and a cursor-pointer
            that led nowhere, above a "View All Circulars" button with no
            handler. None of those offices exist here. What a visitor can
            legitimately be shown is the school's own published calendar.
          */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {notices.length === 0 && (
              <p className="p-6 text-sm text-center text-slate-500 dark:text-slate-400">
                Nothing published at the moment.
              </p>
            )}
            {notices.map((n) => (
              <div key={n.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {n.endDate && n.endDate !== n.startDate ? `${n.startDate} – ${n.endDate}` : n.startDate}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md shrink-0 ${NOTICE_TONE[n.type] ?? NOTICE_TONE.EVENT}`}>
                  {n.type.replace("_", " ").toLowerCase()}
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-slate-50 dark:bg-zinc-900/50 text-center border-t border-slate-100 dark:border-zinc-800">
            <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Sign in for the full calendar
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
