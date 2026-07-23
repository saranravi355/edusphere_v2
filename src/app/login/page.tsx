"use client";

import { useSearchParams } from "next/navigation";
import { login } from "../actions";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoFull } from "@/components/ui/Logo";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "student";

  let defaultEmail = "aarav.p@edusphere.com";
  let roleTitle = "Student";

  if (role === "admin") {
    defaultEmail = "admin@edusphere.com";
    roleTitle = "Administrator";
  } else if (role === "teacher") {
    defaultEmail = "meena.k@edusphere.com";
    roleTitle = "Teacher";
  } else if (role === "parent") {
    defaultEmail = "rahul.p@edusphere.com";
    roleTitle = "Parent";
  } else if (role === "principal") {
    defaultEmail = "principal@edusphere.com";
    roleTitle = "Principal";
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-200 dark:bg-slate-950 p-4 sm:p-8">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roles
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[480px]"
      >
        {/* Left Side - Branding & Quote */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center text-center relative bg-slate-50 dark:bg-slate-900/50">

          <div className="flex items-center justify-center mb-8">
            <LogoFull className="h-44 w-auto object-contain" />
          </div>

          <h2 className="text-2xl md:text-[1.65rem] font-bold text-slate-800 dark:text-white mb-5 leading-tight max-w-[90%]">
            Empowering the next generation of leaders and thinkers
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[85%]">
            An IB World School community fostering excellence, inquiry and compassion, and building a brighter future together.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-4 max-w-[85%]">
            One platform for every student, teacher, parent and coordinator, from PYP portfolios to DP diploma points.
          </p>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="w-full max-w-[340px] mx-auto">
            <h3 className="text-[1.35rem] font-bold text-slate-800 dark:text-white mb-8 text-center">
              Login to {roleTitle} Portal
            </h3>

            <form action={async (formData) => { await login(formData); }} className="flex flex-col gap-5">
              <div>
                <input
                  type="email"
                  name="email"
                  defaultValue={defaultEmail}
                  placeholder="Email Address"
                  className="w-full px-3 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 rounded-md focus:border-slate-800 focus:ring-1 focus:ring-slate-800 dark:focus:border-slate-400 dark:focus:ring-slate-400 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  defaultValue="password123"
                  placeholder="Password"
                  className="w-full px-3 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 rounded-md focus:border-slate-800 focus:ring-1 focus:ring-slate-800 dark:focus:border-slate-400 dark:focus:ring-slate-400 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-md transition-colors text-sm shadow-sm tracking-wide"
              >
                Login
              </button>

              <div className="flex justify-start mt-1">
                <a href="#" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-medium">
                  Forgot Password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center text-slate-800 font-medium">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
