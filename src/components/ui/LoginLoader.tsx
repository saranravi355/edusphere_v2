"use client";

import { LogoFull } from "@/components/ui/Logo";

/**
 * Brief "planets orbiting the sun" splash shown while the login page mounts:
 * a glowing sun at the center with two planets circling it on thin orbit
 * paths, reusing the same `landing-orbit` rotation keyframe as the app's
 * other orbit decorations. Orbit durations are short (1.3s/2.1s) since the
 * whole splash is only on screen for about a second — a slower spin would
 * barely be visible before the caller's timer unmounts it.
 */
export default function LoginLoader({ accent }: { accent: string }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Sun */}
        <span
          className="absolute w-6 h-6 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 18px 4px ${accent}99` }}
        />

        {/* Inner orbit + planet */}
        <div className="absolute inset-6 rounded-full border" style={{ borderColor: `${accent}35` }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "1.3s" }}>
            <span
              className="absolute top-0 left-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ backgroundColor: accent }}
            />
          </div>
        </div>

        {/* Outer orbit + planet */}
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${accent}20` }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "2.1s", animationDirection: "reverse" }}>
            <span
              className="absolute top-0 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-70"
              style={{ backgroundColor: accent }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LogoFull className="h-10 w-auto object-contain opacity-90" />
        <p className="text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500 animate-pulse">
          Loading your portal…
        </p>
      </div>
    </div>
  );
}
