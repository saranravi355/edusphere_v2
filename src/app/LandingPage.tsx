"use client";

import type { CSSProperties } from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { CalendarDays, Quote, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoMark } from "@/components/ui/Logo";
import { HeroScene } from "@/components/landing/HeroScene";
import { CampusScene } from "@/components/landing/CampusScene";
import { PortalCard, type Portal } from "@/components/landing/PortalCard";
import {
  SchoolIcon, PrincipalIcon, TeacherIcon, GraduateIcon, FamilyIcon, GearIcon,
} from "@/components/landing/PortalIcons";
import { usePointerGlow } from "@/components/landing/usePointerGlow";

export type PublicNotice = {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
};

/**
 * The public front door.
 *
 * Every colour is a light/dark pair handed to the element as a CSS custom
 * property so `dark:` can swap it. An earlier version hardcoded one light hex
 * per card, which left the hero and the six tiles glowing as a light island on
 * a dark page while everything around them dimmed correctly.
 *
 * The palette is scoped to this file rather than globals.css: the rest of the
 * app still runs on the sage/ivory tokens, and moving those is a separate
 * decision with a much larger blast radius.
 */

/**
 * The six front doors.
 *
 * The slugs match lib/portals.ts, which is what the login form reads to decide
 * the heading and the prefilled address.
 */
const PORTALS: Portal[] = [
  { slug: "admin",      label: "Management", blurb: "Strategic control for better outcomes", Icon: SchoolIcon,    tint: "#F3EEFF", tintDark: "#241B3A", ink: "#7C3AED", inkDark: "#C4B5FD", inkHi: "#5B21B6", inkDarkHi: "#EDE9FE" },
  { slug: "principal",  label: "Principal",  blurb: "Lead with insight and efficiency",      Icon: PrincipalIcon, tint: "#FFEBF3", tintDark: "#3A1A28", ink: "#DB2777", inkDark: "#F9A8D4", inkHi: "#9D174D", inkDarkHi: "#FCE7F3" },
  { slug: "teacher",    label: "Teacher",    blurb: "Inspire. Teach. Make a difference.",    Icon: TeacherIcon,   tint: "#FFF4E0", tintDark: "#3A2A12", ink: "#D97706", inkDark: "#FCD34D", inkHi: "#92400E", inkDarkHi: "#FEF3C7" },
  { slug: "student",    label: "Student",    blurb: "Learn today. Lead tomorrow.",           Icon: GraduateIcon,  tint: "#E8F0FF", tintDark: "#16233F", ink: "#2563EB", inkDark: "#93C5FD", inkHi: "#1E40AF", inkDarkHi: "#DBEAFE" },
  { slug: "parent",     label: "Parent",     blurb: "Stay connected. Be involved.",          Icon: FamilyIcon,    tint: "#E6F7EC", tintDark: "#12301D", ink: "#16A34A", inkDark: "#86EFAC", inkHi: "#14532D", inkDarkHi: "#DCFCE7" },
  { slug: "operations", label: "Operations", blurb: "Ensure smooth and smart operations",    Icon: GearIcon,      tint: "#E0F7F5", tintDark: "#0E2E2C", ink: "#0D9488", inkDark: "#5EEAD4", inkHi: "#115E59", inkDarkHi: "#CCFBF1" },
];

type Tone = { bg: string; fg: string; bgDark: string; fgDark: string };

const NOTICE_TONE: Record<string, Tone> = {
  TERM:             { bg: "#E8F0FF", fg: "#1D4ED8", bgDark: "#16233F", fgDark: "#93C5FD" },
  HOLIDAY:          { bg: "#E6F7EC", fg: "#15803D", bgDark: "#12301D", fgDark: "#86EFAC" },
  NATIONAL_HOLIDAY: { bg: "#E6F7EC", fg: "#15803D", bgDark: "#12301D", fgDark: "#86EFAC" },
  EXAM_WINDOW:      { bg: "#FFE9E5", fg: "#C2410C", bgDark: "#3A1E12", fgDark: "#FDBA74" },
  EVENT:            { bg: "#F1F0EC", fg: "#44403C", bgDark: "#27262B", fgDark: "#D6D3D1" },
};

const PROGRAMMES = ["Primary Years Programme", "Middle Years Programme", "Diploma Programme"];

const HEADLINE = ["Empowering", "Education", "for", "a"];
const HEADLINE_ACCENT = ["Brighter", "Tomorrow"];

/**
 * Orbit rings behind the mark. Each ring carries one node, coloured from the
 * portal palette so the decoration is drawn from the same six inks as the
 * cards rather than introducing a seventh colour.
 */
const ORBITS = [
  { inset: "0",     dur: "42s", dot: "#7C3AED", top: "6%",  left: "50%" },
  { inset: "13%",   dur: "31s", dot: "#2563EB", top: "50%", left: "2%"  },
  { inset: "26%",   dur: "23s", dot: "#0D9488", top: "88%", left: "62%" },
];

/** The six portal inks, used as a spectrum rule under the header. */
const SPECTRUM = "linear-gradient(90deg,#7C3AED,#DB2777,#D97706,#2563EB,#16A34A,#0D9488)";

/** Reveal a section the first time it scrolls into view. */
const REVEAL = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-90px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export type LearnerAttribute = { value: string; label: string; descriptor: string };

export default function LandingPage({
  notices,
  attribute,
}: {
  notices: PublicNotice[];
  attribute: LearnerAttribute;
}) {
  const stagger: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const rise: Variants = {
    hidden: { opacity: 0, y: 26, rotateX: -8 },
    show: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
  };
  const word: Variants = {
    hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  };

  // The hero is lit by the cursor too, at a much larger radius than the cards
  // and across a narrower slice of the spectrum, so a band this wide drifts in
  // colour rather than running the whole rainbow.
  const hero = usePointerGlow<HTMLElement>({ hueRange: 130, hueStart: 205 });

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-10 dark:bg-[#0B0F14]">
      {/* Page-wide grid texture, very low contrast. */}
      <div aria-hidden className="landing-grid pointer-events-none fixed inset-0 z-0" />

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0B0F14]/80">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between px-6 py-3">
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <LogoMark size={36} />
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Edusphere 360</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">Solution of Rapidfly</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <ThemeToggle />
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.04] active:scale-[0.98] dark:bg-white dark:text-zinc-900"
            >
              <LogIn size={15} aria-hidden />
              Sign in
              <span
                aria-hidden
                className="absolute inset-y-0 -left-full w-1/3 bg-white/30 opacity-0 group-hover:opacity-100 group-hover:landing-shine dark:bg-zinc-900/20"
              />
            </Link>
          </motion.div>
        </div>

        {/*
          A hairline of the six portal inks, in the order the cards appear.
          It ties the header to the palette without adding another surface.
        */}
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
          className="h-px w-full origin-left opacity-70"
          style={{ backgroundImage: SPECTRUM }}
        />
      </header>

      <main className="relative z-10 mx-auto max-w-[88rem] px-6">
        {/* Hero band - drifting gradient, floating orbs, cursor spotlight */}
        <motion.section
          ref={hero.ref}
          onPointerMove={hero.onPointerMove}
          onPointerLeave={hero.onPointerLeave}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            "--hero": "linear-gradient(115deg,#EAF4FF 0%,#F1FBF4 35%,#FFF7E8 65%,#F6EEFF 100%)",
            "--hero-dark": "linear-gradient(115deg,#101A2B 0%,#0F221D 35%,#241E12 65%,#1B1430 100%)",
            "--mx": "50%",
            "--my": "50%",
            "--glow": "0",
            "--h1": "205",
            "--h2": "260",
            "--h3": "320",

            // The cards' treatment at hero scale: translucent hue-tracking
            // colour on normal blending, so it reads the same on the pale hero
            // as on the dark one. Wider radius and lower alpha, because a band
            // this size wants atmosphere rather than a hotspot.
            "--hero-iris":
              "radial-gradient(620px circle at var(--mx) var(--my), hsl(var(--h1) 92% 64% / 0.26) 0%, hsl(var(--h2) 88% 60% / 0.17) 38%, hsl(var(--h3) 86% 58% / 0.09) 58%, transparent 78%)",
            "--hero-spec":
              "radial-gradient(260px circle at var(--mx) var(--my), rgb(255 255 255 / 0.55) 0%, rgb(255 255 255 / 0.12) 50%, transparent 75%)",
          } as CSSProperties}
          className="landing-drift relative mt-4 overflow-hidden rounded-3xl border border-black/5 bg-[image:var(--hero)] dark:border-white/10 dark:bg-[image:var(--hero-dark)]"
        >
          {/* Cursor light */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[image:var(--hero-iris)] opacity-[var(--glow)] transition-opacity duration-500"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[image:var(--hero-spec)] opacity-[calc(var(--glow)*0.5)] transition-opacity duration-500 dark:opacity-[calc(var(--glow)*0.85)]"
          />

          <div aria-hidden className="landing-float pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/50 blur-2xl dark:bg-white/[0.05]" />
          <div aria-hidden className="landing-float-slow pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#BFE3D0]/40 blur-3xl dark:bg-[#1E4E6B]/30" />

          <div className="relative grid items-center gap-6 p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <motion.h1
                variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
                initial="hidden"
                animate="show"
                className="font-heading text-[2.15rem] font-black leading-[1.06] tracking-tight text-[#0F2747] dark:text-[#F1F5F9] sm:text-[2.6rem] xl:text-[3rem]"
              >
                {HEADLINE.map((w) => (
                  <motion.span key={w} variants={word} className="mr-[0.28em] inline-block">
                    {w}
                  </motion.span>
                ))}
                <br />
                {/*
                  Gradient per word rather than across the line: the words
                  animate in separately, so a line-wide gradient would slide
                  under them as each one lands.
                */}
                {HEADLINE_ACCENT.map((w) => (
                  <motion.span
                    key={w}
                    variants={word}
                    className="mr-[0.28em] inline-block bg-gradient-to-br from-[#2563EB] via-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent dark:from-[#93C5FD] dark:via-[#A5B4FC] dark:to-[#C4B5FD]"
                  >
                    {w}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.62 }}
                className="mt-3 max-w-xl text-base leading-relaxed text-[#3C4A5A] dark:text-[#9FB0C4] md:text-lg"
              >
                Connecting management, teachers, students, parents and operations
                on a single intelligent platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.74 }}
                className="mt-5 flex items-center gap-3 text-sm font-bold tracking-wide text-[#0F2747] dark:text-[#CBD5E1]"
              >
                <span>Learn</span>
                <span className="text-[#9FB3C8] dark:text-[#475569]">|</span>
                <span>Collaborate</span>
                <span className="text-[#9FB3C8] dark:text-[#475569]">|</span>
                <span>Grow</span>
              </motion.div>

              <motion.div
                variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.82 } } }}
                initial="hidden"
                animate="show"
                className="mt-5 flex flex-wrap gap-2"
              >
                {PROGRAMMES.map((p) => (
                  <motion.span
                    key={p}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="cursor-default rounded-full border border-[#0F2747]/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#0F2747] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-[#CBD5E1] dark:hover:bg-white/[0.12]"
                  >
                    {p}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/*
              logo.png carries its own light background, so on a dark hero it
              needs a plate under it rather than being left to float.
            */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="relative hidden items-center justify-center lg:flex"
            >
              {/*
                Concentric orbits with a node riding each ring. The mark is a
                globe wrapped in a network and the product is called 360, so
                rings are the motif the brand already implies - and each node
                takes one of the six portal inks, which is where the rest of
                the page gets its colour from.
              */}
              <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="relative block h-[17rem] w-[17rem] xl:h-[19rem] xl:w-[19rem]">
                  {ORBITS.map(({ inset, dur, dot, top, left }) => (
                    <span
                      key={inset}
                      className="landing-orbit absolute rounded-full border border-[#0F2747]/[0.07] dark:border-white/[0.07]"
                      style={{ inset, animationDuration: dur } as CSSProperties}
                    >
                      <span
                        className="absolute h-1.5 w-1.5 rounded-full"
                        style={{ background: dot, top, left, boxShadow: `0 0 10px 1px ${dot}` }}
                      />
                    </span>
                  ))}
                </span>
              </span>

              {/*
                The illustration stands in for the mark here. The header
                already carries the logo, so repeating it spends the one place
                on the page with room for an image on something already shown.
              */}
              <div className="landing-float relative">
                <span
                  aria-hidden
                  className="landing-pulse-ring absolute inset-0 -z-10 rounded-full bg-[#2563EB]/10 blur-2xl dark:bg-[#93C5FD]/20"
                />
                <HeroScene className="h-[13.5rem] w-auto xl:h-[15rem]" />
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Portal chooser */}
        <section className="mt-6">
          <motion.div {...REVEAL} className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Choose your portal</h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Six front doors, one platform</p>
            </div>
            <p className="hidden text-xs font-medium text-zinc-400 sm:block dark:text-zinc-500">
              Hover a card to light it up
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          >
            {PORTALS.map((p, i) => (
              <PortalCard key={p.slug} portal={p} variants={rise} index={i} />
            ))}
          </motion.div>
        </section>

        {/*
          The calendar board.

          These rows used to be three hardcoded notices from a Registrar Office,
          a Dean of Academics and a Sports Authority - none of which exist here
          - each styled as clickable with no handler. What a visitor can
          legitimately be shown is the school's own published calendar.
        */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <motion.div
            {...REVEAL}
            className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3 border-b border-black/5 px-6 py-4 dark:border-white/10">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F0FF] text-[#2563EB] dark:bg-[#16233F] dark:text-[#93C5FD]">
                <CalendarDays size={18} aria-hidden />
              </span>
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">School Calendar</h2>
            </div>

            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="divide-y divide-black/5 dark:divide-white/10"
            >
              {notices.length === 0 && (
                <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Nothing published at the moment.</p>
              )}
              {notices.map((n) => {
                const tone = NOTICE_TONE[n.type] ?? NOTICE_TONE.EVENT;
                return (
                  <motion.div
                    key={n.id}
                    variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}
                    className="group/row flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[#FAFAF8] dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="h-8 w-1 shrink-0 rounded-full bg-[var(--tone-fg)] opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 dark:bg-[var(--tone-fg-dark)]"
                        style={{ "--tone-fg": tone.fg, "--tone-fg-dark": tone.fgDark } as CSSProperties}
                      />
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {n.endDate && n.endDate !== n.startDate ? `${n.startDate} – ${n.endDate}` : n.startDate}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        "--tone-bg": tone.bg,
                        "--tone-fg": tone.fg,
                        "--tone-bg-dark": tone.bgDark,
                        "--tone-fg-dark": tone.fgDark,
                      } as CSSProperties}
                      className="shrink-0 rounded-md bg-[var(--tone-bg)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--tone-fg)] transition-transform group-hover/row:scale-105 dark:bg-[var(--tone-bg-dark)] dark:text-[var(--tone-fg-dark)]"
                    >
                      {n.type.replace("_", " ").toLowerCase()}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="border-t border-black/5 bg-[#FAFAF8] px-6 py-3 text-center dark:border-white/10 dark:bg-zinc-900/60">
              <Link
                href="/login"
                className="group/link inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] transition-colors hover:text-[#1D4ED8] dark:text-[#93C5FD] dark:hover:text-[#BFDBFE]"
              >
                Sign in for the full calendar
                <span aria-hidden className="transition-transform duration-200 group-hover/link:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            {...REVEAL}
            transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
            className="landing-drift relative overflow-hidden rounded-2xl p-8 pb-24 text-white"
            style={{ backgroundImage: "linear-gradient(150deg,#0F2747 0%,#1E3A6E 45%,#2563EB 75%,#5B3FBF 100%)" }}
          >
            <div aria-hidden className="landing-float-slow pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <CampusScene className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full" />
            <Quote size={40} className="landing-float relative opacity-25" aria-hidden />
            <p className="relative mt-4 font-heading text-2xl font-bold leading-snug">
              A brighter future begins here.
            </p>
            <p className="relative mt-4 text-sm leading-relaxed text-white/75">
              Education is not preparation for life; education is life itself.
            </p>
            <p className="relative mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              John Dewey
            </p>

            <div className="relative mt-7 h-px w-full bg-white/15" />

            {/*
              The IB learner profile attribute for today, rotated on the IST
              calendar day. It fills a panel that otherwise stretched to match
              the calendar card beside it, and it does so with real curriculum
              content rather than decoration.
            */}
            <div className="relative mt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">
                IB Learner Profile &middot; Today
              </p>
              <p className="mt-3 font-heading text-3xl font-bold leading-tight text-white">
                {attribute.label}
              </p>
              <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-white/70">
                {attribute.descriptor}
              </p>
            </div>

            <p className="relative mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              People &middot; Process &middot; Progress &middot; Together
            </p>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto mt-12 max-w-[88rem] border-t border-black/5 px-6 py-6 dark:border-white/10">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Edusphere 360</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {`© ${new Date().getFullYear()} Edusphere 360. All rights reserved.`}
          </p>
        </div>
      </footer>
    </div>
  );
}
