"use client";

/**
 * Fills the open gray space around the login card on wide viewports: soft
 * tinted glows plus a couple of slow-drifting orbit rings, reusing the same
 * landing-page keyframes (landing-float/landing-orbit) so the motion
 * language matches the rest of the app rather than inventing a new one.
 */
export default function LoginBackgroundDecor({ accent }: { accent: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] max-w-[140vw] max-h-[140vw] rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(circle, ${accent}26 0%, transparent 70%)` }}
      />

      <div
        className="landing-float absolute -left-24 -top-24 w-72 h-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${accent}22` }}
      />
      <div className="landing-float-slow absolute -right-20 -bottom-24 w-80 h-80 rounded-full blur-3xl bg-[#7C3AED]/10 dark:bg-[#7C3AED]/[0.08]" />
      <div className="landing-float-slow absolute right-8 top-8 w-48 h-48 rounded-full blur-2xl bg-[#16A34A]/10 dark:bg-[#16A34A]/[0.08]" />
      <div className="landing-float absolute left-10 bottom-10 w-40 h-40 rounded-full blur-2xl bg-[#D97706]/10 dark:bg-[#D97706]/[0.08]" style={{ animationDelay: "-4s" }} />

      <div
        className="absolute -left-16 bottom-16 w-72 h-72 rounded-full border landing-orbit"
        style={{ borderColor: `${accent}30`, animationDuration: "48s" }}
      >
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>
      <div
        className="absolute -right-10 top-1/4 w-52 h-52 rounded-full border landing-orbit"
        style={{ borderColor: `${accent}22`, animationDuration: "34s", animationDirection: "reverse" }}
      />
    </div>
  );
}
