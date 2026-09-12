"use client";

import { Sparkles } from "lucide-react";
import { LogoFull } from "@/components/ui/Logo";

/**
 * Brief "magic circle" splash shown while the login page mounts: two
 * counter-rotating rings around a pulsing sparkle, matching the
 * sparkle-in-a-circle motif already used for the AI assistant button
 * elsewhere in the app. Purely decorative — the caller owns the timer
 * that unmounts it.
 */
export default function LoginLoader({ accent }: { accent: string }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: accent, borderRightColor: accent, animationDuration: "0.9s" }}
        />
        <span
          className="absolute inset-3 rounded-full border-2 border-transparent animate-spin"
          style={{ borderBottomColor: accent, borderLeftColor: accent, animationDuration: "1.4s", animationDirection: "reverse" }}
        />
        <Sparkles className="w-8 h-8 animate-pulse" style={{ color: accent }} />
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
