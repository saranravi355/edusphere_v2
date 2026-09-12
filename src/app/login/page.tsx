"use client";

import { useSearchParams } from "next/navigation";
import { login } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { LogoFull } from "@/components/ui/Logo";
import { portalBySlug } from "@/lib/portals";
import { FORCE_PASSWORD_RESET } from "@/lib/demo";
import { Suspense, useActionState, useEffect, useState, type CSSProperties } from "react";
import OrbitDecor from "@/components/ui/OrbitDecor";
import LoginLoader from "@/components/ui/LoginLoader";
import LoginBackgroundDecor from "@/components/ui/LoginBackgroundDecor";
import LoginConfetti from "@/components/ui/LoginConfetti";

// Same ink colors as each portal's own card on the landing page and its
// internal dashboard (see the .portal-* rules in globals.css) — carried here
// too via a scoped --primary override, so the accent a user is about to sign
// into is visible before they even log in.
const PORTAL_ACCENTS: Record<string, string> = {
  admin: "#7C3AED",
  principal: "#DB2777",
  teacher: "#D97706",
  student: "#2563EB",
  parent: "#16A34A",
  operations: "#0D9488",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(login, undefined);
  const [loading, setLoading] = useState(true);

  // One table, shared with the landing page, so a new portal cannot appear on
  // the front door and be missing here. An unknown ?role= falls back rather
  // than rendering a blank form.
  const portal = portalBySlug(searchParams.get("role"));
  const defaultEmail = portal.sampleEmail;
  const roleTitle = portal.loginTitle;
  const accent = PORTAL_ACCENTS[portal.slug] ?? PORTAL_ACCENTS.student;
  const accentVar = { "--primary": accent } as CSSProperties;

  // A brief splash rather than an indefinite spinner: nothing here is
  // actually async (portalBySlug is a synchronous lookup), so the loader's
  // only job is a moment of polish before the form fades in.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-200 dark:bg-slate-950 p-4 sm:p-8">
      <LoginBackgroundDecor accent={accent} />
      <LoginConfetti />

      <AnimatePresence>
        {loading && (
          <motion.div
            key="login-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200 dark:bg-slate-950"
          >
            <LoginLoader accent={accent} />
          </motion.div>
        )}
      </AnimatePresence>

      <Link href="/" className="absolute top-8 left-8 flex items-center text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roles
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={accentVar}
        className="relative z-0 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[480px]"
      >
        <OrbitDecor />
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
            <h3 className="text-[1.35rem] font-bold mb-8 text-center" style={{ color: accent }}>
              Login to {roleTitle} Portal
            </h3>

            <form action={formAction} className="flex flex-col gap-5">
              <div>
                <input
                  type="email"
                  name="email"
                  defaultValue={defaultEmail}
                  placeholder="Email Address"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-3 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 rounded-md focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm"
                  required
                />
                {portal.alternatives && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Also {portal.alternatives.join(", ")} — each opens its own department.
                  </p>
                )}
              </div>

              <div className="relative">
                {/* The password is prefilled while this is a demonstration and
                    every account shares one. Setting
                    NEXT_PUBLIC_FORCE_PASSWORD_RESET=true empties it: a login
                    form that types the password for you is a door with the key
                    left in it once real families are behind it.

                    The env var is read here directly rather than through the
                    FORCE_PASSWORD_RESET constant so that Next inlines it as a
                    literal and the minifier folds this whole branch away —
                    otherwise the shared password stays in the public bundle
                    even after the switch is flipped, which would make the
                    switch a lie. Verified: with the flag on, the only
                    remaining occurrence is the "do not reuse it" hint on the
                    change-password form. */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none" aria-hidden="true">
                  <span
                    className="absolute inset-0 rounded-full border border-current animate-spin"
                    style={{ color: accent, opacity: 0.35, animationDuration: "3s" }}
                  />
                  <Lock className="w-3 h-3" style={{ color: accent }} />
                </span>
                <input
                  type="password"
                  name="password"
                  defaultValue={process.env.NEXT_PUBLIC_FORCE_PASSWORD_RESET === "true" ? "" : "password123"}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 rounded-md focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm"
                  required
                />
              </div>

              {state?.error && (
                <p
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2"
                >
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                style={{ backgroundColor: accent }}
                className="w-full py-2.5 mt-2 hover:brightness-90 text-white font-bold rounded-md transition-all text-sm shadow-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending ? "Signing in…" : "Login"}
              </button>

              <div className="flex justify-start mt-1">
                {/* Password reset needs an email provider, which is not wired up.
                    A dead href="#" link is worse than saying so plainly. */}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Forgotten your password? Contact the school office.
                  {FORCE_PASSWORD_RESET && (
                    <> Signing in for the first time since the reset? Use the
                    password you were given and you will be asked to choose your own.</>
                  )}
                </p>
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
