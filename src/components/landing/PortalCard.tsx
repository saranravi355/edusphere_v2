"use client";

import type { ComponentType, CSSProperties } from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePointerGlow } from "./usePointerGlow";

export type Portal = {
  slug: string;
  label: string;
  blurb: string;
  Icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  tint: string;
  tintDark: string;
  ink: string;
  inkDark: string;
  /** Higher-contrast inks, used while the card is lit. */
  inkHi: string;
  inkDarkHi: string;
  /** The ink's own hue. The sheen stays within +/-25 degrees of it. */
  hue: number;
};

/**
 * A portal tile with a holographic response to the cursor.
 *
 * What sells it is that the hue tracks the pointer, not just the highlight's
 * position: real foil shifts colour as the angle changes, so a fixed gradient
 * being dragged around reads as a coloured blob instead. usePointerGlow
 * publishes the hues; the four layers below consume them.
 *
 * Deliberately no blend modes. `color-dodge` bleaches a pale card to flat
 * white and `multiply` muddies it, so an earlier version needed a separate
 * treatment per theme and broke in light mode. Translucent colour on normal
 * blending behaves the same over any backdrop, leaving opacity as the only
 * thing the two themes differ on.
 *
 * Text follows suit: each portal carries a high-contrast ink that the label,
 * blurb and icon switch to while the card is lit, so nothing loses legibility
 * under the brightest part of the sweep.
 *
 * The tilt is applied to an inner wrapper rather than the <a>, so the link's
 * own hit area stays a plain rectangle no matter how far the card rotates.
 */
export function PortalCard({ portal, variants }: { portal: Portal; variants: Variants }) {
  const { slug, label, blurb, Icon, tint, tintDark, ink, inkDark, inkHi, inkDarkHi, hue } = portal;
  const { ref, onPointerMove, onPointerLeave } = usePointerGlow<HTMLDivElement>({
    tilt: 11,
    hueStart: hue - 25,
    hueRange: 50,
  });

  return (
    <motion.div variants={variants} className="h-full [perspective:1100px]">
      <Link
        href={`/login?role=${slug}`}
        aria-label={`Sign in to the ${label} portal`}
        className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ink)] dark:focus-visible:ring-[var(--ink-dark)] dark:focus-visible:ring-offset-[#0B0F14]"
        style={{ "--ink": ink, "--ink-dark": inkDark } as CSSProperties}
      >
        <div
          ref={ref}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          style={{
            "--tint": tint,
            "--tint-dark": tintDark,
            "--ink": ink,
            "--ink-dark": inkDark,
            "--ink-hi": inkHi,
            "--ink-dark-hi": inkDarkHi,
            "--mx": "50%",
            "--my": "50%",
            "--glow": "0",
            "--rx": "0deg",
            "--ry": "0deg",
            "--h1": String(hue),
            "--h2": String(hue + 17),
            "--h3": String(hue + 38),

            // Iridescent field. Translucent colour over the card on normal
            // blending, so it behaves the same on a pale tint as on a dark one
            // - no dodge that bleaches, no multiply that muddies.
            "--iris":
              "radial-gradient(320px circle at var(--mx) var(--my), hsl(var(--h1) 82% 62% / 0.38) 0%, hsl(var(--h2) 76% 58% / 0.24) 36%, hsl(var(--h3) 70% 56% / 0.12) 58%, transparent 78%)",

            // Tight specular core - the "glossy surface" cue.
            "--spec":
              "radial-gradient(110px circle at var(--mx) var(--my), rgb(255 255 255 / 0.8) 0%, rgb(255 255 255 / 0.18) 45%, transparent 72%)",

            // Fine diagonal striping, masked to the lit area, which is what
            // separates foil from a plain coloured glow.
            "--foil":
              "repeating-linear-gradient(102deg, rgb(255 255 255 / 0.14) 0px, rgb(255 255 255 / 0.14) 2px, transparent 2px, transparent 7px)",
            "--foil-mask":
              "radial-gradient(240px circle at var(--mx) var(--my), #000 0%, rgb(0 0 0 / 0.45) 45%, transparent 72%)",

            "--rim":
              "radial-gradient(260px circle at var(--mx) var(--my), hsl(var(--h1) 85% 60%) 0%, hsl(var(--h2) 78% 58% / 0.5) 45%, transparent 70%)",

            transform: "rotateX(var(--rx)) rotateY(var(--ry))",
          } as CSSProperties}
          className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--tint)] p-4 shadow-sm transition-[transform,box-shadow] duration-200 ease-out [transform-style:preserve-3d] group-hover:shadow-2xl dark:bg-[var(--tint-dark)] dark:shadow-none dark:group-hover:shadow-black/50"
        >
          {/* 1. Iridescent field - hue follows the cursor */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[image:var(--iris)] opacity-[calc(var(--glow)*0.95)] transition-opacity duration-300 dark:opacity-[var(--glow)]"
          />

          {/* 2. Foil striping, masked to the lit area */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[image:var(--foil)] opacity-[calc(var(--glow)*0.55)] transition-opacity duration-300 dark:opacity-[calc(var(--glow)*0.75)]"
            style={{
              WebkitMaskImage: "var(--foil-mask)",
              maskImage: "var(--foil-mask)",
            }}
          />

          {/* 3. Specular core */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[image:var(--spec)] opacity-[calc(var(--glow)*0.45)] transition-opacity duration-300 dark:opacity-[calc(var(--glow)*0.7)]"
          />

          {/* 4. Lit rim, tinted by the same hue as the field */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[image:var(--rim)] opacity-[calc(var(--glow)*0.85)] transition-opacity duration-300"
            style={{
              padding: "1px",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />

          {/*
            Corner treatment. This was an 80px circle under blur-[2px] - a
            blur radius far too small for the shape, which left a hard edge
            with a haze on it and read as a compression artefact. A radial
            gradient has no edge to give away, and the two hairline arcs echo
            the orbit rings in the hero.
          */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -right-8 -top-8 h-32 w-32 bg-[radial-gradient(circle,var(--ink)_0%,transparent_68%)] opacity-[0.22] transition-opacity duration-500 group-hover:opacity-[0.32] dark:bg-[radial-gradient(circle,var(--ink-dark)_0%,transparent_68%)] dark:opacity-[0.14] dark:group-hover:opacity-[0.2]" />
            <svg
              viewBox="0 0 120 120"
              className="absolute -right-7 -top-7 h-28 w-28 text-[var(--ink)] opacity-[0.28] transition-transform duration-700 group-hover:scale-110 dark:text-[var(--ink-dark)] dark:opacity-[0.18]"
              fill="none"
            >
              <circle cx="86" cy="34" r="30" stroke="currentColor" strokeWidth="1" />
              <circle cx="86" cy="34" r="46" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          {/* Content sits above the light layers, and is pushed forward in 3D
              so the tilt gives it a little parallax against the card face. */}
          <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-[var(--ink)] shadow-sm transition-[transform,color,background-color] duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:bg-white group-hover:text-[var(--ink-hi)] dark:bg-white/[0.08] dark:text-[var(--ink-dark)] dark:group-hover:bg-white/[0.16] dark:group-hover:text-[var(--ink-dark-hi)] [transform:translateZ(38px)]">
            <Icon size={24} aria-hidden />
          </span>

          <p className="relative mt-4 text-lg font-extrabold tracking-tight text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--ink-hi)] dark:text-[var(--ink-dark)] dark:group-hover:text-[var(--ink-dark-hi)] [transform:translateZ(26px)]">
            {label}
          </p>
          <p className="relative mt-1 flex-1 text-sm leading-snug text-[#4B5563] transition-colors duration-300 group-hover:text-[#111827] dark:text-zinc-400 dark:group-hover:text-zinc-100 [transform:translateZ(16px)]">
            {blurb}
          </p>

          <span className="relative mt-3 inline-flex h-9 w-9 items-center justify-center self-end overflow-hidden rounded-lg bg-[var(--ink)] text-white shadow-sm transition-[transform,background-color] duration-300 group-hover:translate-x-1 group-hover:bg-[var(--ink-hi)] dark:bg-[var(--ink-dark)] dark:text-zinc-900 dark:group-hover:bg-[var(--ink-dark-hi)] [transform:translateZ(30px)]">
            <ArrowRight size={16} aria-hidden />
            <span
              aria-hidden
              className="absolute inset-y-0 -left-full w-1/2 bg-white/40 opacity-0 group-hover:opacity-100 group-hover:landing-shine"
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
