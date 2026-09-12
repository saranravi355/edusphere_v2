"use client";

/**
 * Fills the open gray space around the login card on wide viewports: soft
 * tinted glows plus a couple of slow-drifting orbit rings, reusing the same
 * landing-page keyframes (landing-float/landing-orbit) so the motion
 * language matches the rest of the app rather than inventing a new one.
 */
export default function LoginBackgroundDecor({ accent }: { accent: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true" style={{ perspective: "900px" }}>
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

      {/* Tilted, glowing orbit-system rings — the CSS "Saturn ring" trick: a
          circular border read at an angle via rotateX becomes an ellipse.
          The tilt is static on the outer div; a nested inset child carries
          the landing-orbit spin so each dot travels the visual ellipse. */}
      <div className="absolute -left-20 bottom-8 w-80 h-80">
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${accent}30`, transform: "rotateX(64deg)" }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "48s" }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: accent, opacity: 0.6, boxShadow: `0 0 10px ${accent}` }} />
          </div>
        </div>
        <div className="absolute inset-12 rounded-full border" style={{ borderColor: `${accent}18`, transform: "rotateX(64deg)" }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "30s", animationDirection: "reverse" }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.4, boxShadow: `0 0 6px ${accent}` }} />
          </div>
        </div>
      </div>

      <div className="absolute -right-14 top-1/4 w-56 h-56">
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${accent}22`, transform: "rotateX(60deg)" }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "34s", animationDirection: "reverse" }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.5, boxShadow: `0 0 8px ${accent}` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
