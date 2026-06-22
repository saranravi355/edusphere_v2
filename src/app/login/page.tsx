"use client";

import { useSearchParams } from "next/navigation";
import { login } from "../actions";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Building, GraduationCap, Users, KeyRound, Briefcase } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "parent";

  let defaultEmail = "rahul.p@edusphere.com";
  let RoleIcon = Users;
  let roleTitle = "Parent / Student";
  let themeStyles = {
    blur: "bg-orange-500/20",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconText: "text-orange-600 dark:text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/30"
  };

  if (role === "admin") {
    defaultEmail = "admin@edusphere.com";
    RoleIcon = Building;
    roleTitle = "Administrator";
    themeStyles = {
      blur: "bg-purple-500/20",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconText: "text-purple-600 dark:text-purple-400",
      button: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30"
    };
  } else if (role === "teacher") {
    defaultEmail = "meena.k@edusphere.com";
    RoleIcon = GraduationCap;
    roleTitle = "Teacher";
    themeStyles = {
      blur: "bg-blue-500/20",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconText: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
    };
  } else if (role === "student") {
    defaultEmail = "aarav.p@edusphere.com";
    RoleIcon = GraduationCap;
    roleTitle = "Student";
    themeStyles = {
      blur: "bg-indigo-500/20",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconText: "text-indigo-600 dark:text-indigo-400",
      button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30"
    };
  } else if (role === "principal") {
    defaultEmail = "principal@edusphere.com";
    RoleIcon = Briefcase;
    roleTitle = "Principal / Co-ordinator";
    themeStyles = {
      blur: "bg-pink-500/20",
      iconBg: "bg-pink-100 dark:bg-pink-900/30",
      iconText: "text-pink-600 dark:text-pink-400",
      button: "bg-pink-600 hover:bg-pink-700 shadow-pink-500/30"
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roles
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative"
      >
        <div className={`absolute inset-0 ${themeStyles.blur} blur-3xl rounded-[3rem] -z-10`} />
        
        <div className="glass-card p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-16 h-16 ${themeStyles.iconBg} ${themeStyles.iconText} rounded-2xl flex items-center justify-center mb-4`}>
              <RoleIcon size={32} />
            </div>
            <h1 className="text-3xl font-heading font-bold text-slate-800 dark:text-slate-100">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Sign in to your {roleTitle} account</p>
          </div>

          <form action={login} className="flex flex-col gap-5 text-left">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={defaultEmail}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm" 
                  required 
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 ml-1">For this demo, the email is pre-filled.</p>
            </div>
            
            <button 
              type="submit" 
              className={`w-full py-3 mt-4 text-white rounded-xl shadow-lg transition-all font-semibold active:scale-[0.98] ${themeStyles.button}`}
            >
              Secure Login
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
