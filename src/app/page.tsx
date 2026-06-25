"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, Users, UserCircle, School, Bell, ChevronRight, Building, Briefcase } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
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
        <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-blue-700 dark:text-blue-500 tracking-tight">
          EduSphere <span className="text-2xl text-blue-500 font-bold align-top">AlphaV1</span>
        </h1>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-[90rem] z-10"
      >
        {/* Management Card */}
        <Link href="/login?role=admin">
          <motion.div variants={itemVariants as any} className="group relative">
            <div className="bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 p-8 flex flex-col items-center justify-center gap-4 border-t-4 border-purple-500 rounded-b-lg">
              <Building size={48} className="text-slate-700 dark:text-slate-300" />
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-purple-600 dark:text-purple-500 text-lg">Management</span>
                <div className="w-8 h-8 rounded bg-purple-600 dark:bg-purple-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Principal Card */}
        <Link href="/login?role=principal">
          <motion.div variants={itemVariants as any} className="group relative">
            <div className="bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 p-8 flex flex-col items-center justify-center gap-4 border-t-4 border-pink-500 rounded-b-lg">
              <Briefcase size={48} className="text-slate-700 dark:text-slate-300" />
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-pink-600 dark:text-pink-500 text-lg">Principal</span>
                <div className="w-8 h-8 rounded bg-pink-600 dark:bg-pink-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Teacher Card */}
        <Link href="/login?role=teacher">
          <motion.div variants={itemVariants as any} className="group relative">
            <div className="bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 p-8 flex flex-col items-center justify-center gap-4 border-t-4 border-yellow-500 rounded-b-lg">
              <Users size={48} className="text-slate-700 dark:text-slate-300" />
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-yellow-600 dark:text-yellow-500 text-lg">Teacher</span>
                <div className="w-8 h-8 rounded bg-yellow-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Student Card */}
        <Link href="/login?role=student">
          <motion.div variants={itemVariants as any} className="group relative">
            <div className="bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 p-8 flex flex-col items-center justify-center gap-4 border-t-4 border-blue-500 rounded-b-lg">
              <GraduationCap size={48} className="text-slate-700 dark:text-slate-300" />
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">Student</span>
                <div className="w-8 h-8 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Parent Card */}
        <Link href="/login?role=parent">
          <motion.div variants={itemVariants as any} className="group relative">
            <div className="bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 p-8 flex flex-col items-center justify-center gap-4 border-t-4 border-green-500 rounded-b-lg">
              <UserCircle size={48} className="text-slate-700 dark:text-slate-300" />
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-green-600 dark:text-green-500 text-lg">Parent</span>
                <div className="w-8 h-8 rounded bg-green-600 dark:bg-green-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
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
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between cursor-pointer group">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Revised Academic Calendar for Fall 2026</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Published by Registrar Office</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md">New</span>
                <span className="text-sm text-slate-400">Oct 24</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
              </div>
            </div>
            
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between cursor-pointer group">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Guidelines for Final Semester Project Submissions</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Published by Dean of Academics</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md">Academic</span>
                <span className="text-sm text-slate-400">Oct 21</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
              </div>
            </div>

            <div className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between cursor-pointer group">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Annual Sports Meet 2026 - Registrations Open</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Published by Sports Authority</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md">Events</span>
                <span className="text-sm text-slate-400">Oct 18</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
              </div>
            </div>
          </div>
          <div className="px-6 py-3 bg-slate-50 dark:bg-zinc-900/50 text-center border-t border-slate-100 dark:border-zinc-800">
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              View All Circulars
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
