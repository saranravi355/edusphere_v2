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
};

/**
 * A portal tile with a holographic response to the cursor.
 *
 * The two themes need opposite blend modes, which is the whole trick here.
 * On a dark card, `color-dodge` over a white-ish gradient reads as light
 * catching foil. On a pale card the same gradient saturates to flat white
 * almost immediately - the effect vanishes and the label washes out with it -
 * so light mode instead uses `multiply` with saturated chroma, which tints the
 * card toward cyan/violet/pink rather than bleaching it.
 *
 * Text follows suit: each portal carries a high-contrast ink that the label,
 * blurb and icon switch to while the card is lit, so nothing loses legibility
 * under the brightest part of the sweep.
 *
 * The tilt is applied to an inner wrapper rather than the <a>, so the link's
 * own hit area stays a plain rectangle no matter how far the card rotates.
 */
export function PortalCard({ portal, variants }: { portal: Portal; variants: Variants }) {
  const { slug, label, blurb, Icon, tint, tintDark, ink, inkDark, inkHi, inkDarkHi } = portal;
  const { ref, onPointerMove, onPointerLeave } = usePointerGlow<HTMLDivElement>({ tilt: 11 });

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
            "--h1": "190",
            "--h2": "245",
            "--h3": "305",

            // Iridescent field. Translucent colour over the card on normal
            // blending, so it behaves the same on a pale tint as on a dark one
            // - no dodge that bleaches, no multiply that muddies.
            "--iris":
              "radial-gradient(320px circle at var(--mx) var(--my), hsl(var(--h1) 95% 66% / 0.44) 0%, hsl(var(--h2) 92% 62% / 0.30) 34%, hsl(var(--h3) 90% 60% / 0.16) 55%, transparent 76%)",

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
              "radial-gradient(260px circle at var(--mx) var(--my), hsl(var(--h1) 95% 62%) 0%, hsl(var(--h2) 90% 60% / 0.55) 45%, transparent 70%)",

            transform: "rotateX(var(--rx)) rotateY(var(--ry))",
          } as CSSProperties}
          className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--tint)] p-5 shadow-sm transition-[transform,box-shadow] duration-200 ease-out [transform-style:preserve-3d] group-hover:shadow-2xl dark:bg-[var(--tint-dark)] dark:shadow-none dark:group-hover:shadow-black/50"
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

          {/* Static decorative blob, kept from the approved design */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[var(--ink)] opacity-30 blur-[2px] transition-transform duration-500 group-hover:scale-150 dark:bg-[var(--ink-dark)] dark:opacity-15"
          />

          {/* Content sits above the light layers, and is pushed forward in 3D
              so the tilt gives it a little parallax against the card face. */}
          <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-[var(--ink)] shadow-sm transition-[transform,color,background-color] duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:bg-white group-hover:text-[var(--ink-hi)] dark:bg-white/[0.08] dark:text-[var(--ink-dark)] dark:group-hover:bg-white/[0.16] dark:group-hover:text-[var(--ink-dark-hi)] [transform:translateZ(38px)]">
            <Icon size={24} aria-hidden />
          </span>

          <p className="relative mt-6 text-lg font-extrabold tracking-tight text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--ink-hi)] dark:text-[var(--ink-dark)] dark:group-hover:text-[var(--ink-dark-hi)] [transform:translateZ(26px)]">
            {label}
          </p>
          <p className="relative mt-1 flex-1 text-sm leading-snug text-[#4B5563] transition-colors duration-300 group-hover:text-[#111827] dark:text-zinc-400 dark:group-hover:text-zinc-100 [transform:translateZ(16px)]">
            {blurb}
          </p>

          <span className="relative mt-4 inline-flex h-9 w-9 items-center justify-center self-end overflow-hidden rounded-lg bg-[var(--ink)] text-white shadow-sm transition-[transform,background-color] duration-300 group-hover:translate-x-1 group-hover:bg-[var(--ink-hi)] dark:bg-[var(--ink-dark)] dark:text-zinc-900 dark:group-hover:bg-[var(--ink-dark-hi)] [transform:translateZ(30px)]">
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
