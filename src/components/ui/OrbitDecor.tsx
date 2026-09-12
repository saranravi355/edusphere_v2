/**
 * The landing page's orbit-ring decoration, brought into each portal's own
 * front dashboard. Colored with `currentColor` via `text-primary`, so it
 * automatically picks up whichever portal's identity color is active
 * (see the `.portal-*` rules in globals.css) with no per-portal prop needed.
 *
 * Each ring is tilted with `rotateX` (the classic CSS "Saturn ring" trick —
 * a circle border viewed at an angle reads as an ellipse) rather than drawn
 * flat, and its satellite dot glows via `box-shadow`, matching the
 * multi-ring glowing orbit-system look explored as reference in Canva.
 * The tilt lives on a static wrapper; a separate inset child carries the
 * `landing-orbit` spin so the dot travels around the visual ellipse rather
 * than the ring itself warping as it turns.
 *
 * Reuses the `landing-orbit` / `landing-float` keyframes already defined for
 * the landing page rather than introducing new ones. `-z-10` on the decor
 * needs a locally-scoped stacking context on its parent (relative + z-0) or
 * it escapes to the document root and renders behind the whole page instead
 * of just this card - the same bug hit and fixed once already on
 * LandingPage.tsx.
 */
export default function OrbitDecor() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
      style={{ perspective: "500px" }}
    >
      <div className="absolute -top-16 -right-12 w-60 h-60">
        <div className="absolute inset-0 rounded-full border border-primary/15" style={{ transform: "rotateX(62deg)" }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "46s" }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/50" style={{ boxShadow: "0 0 6px var(--primary)" }} />
          </div>
        </div>
        <div className="absolute inset-8 rounded-full border border-primary/25" style={{ transform: "rotateX(62deg)" }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "30s" }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/70" style={{ boxShadow: "0 0 8px var(--primary)" }} />
          </div>
        </div>
        <div className="absolute inset-16 rounded-full border border-primary/20" style={{ transform: "rotateX(62deg)" }}>
          <div className="absolute inset-0 rounded-full landing-orbit" style={{ animationDuration: "18s", animationDirection: "reverse" }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/60" style={{ boxShadow: "0 0 6px var(--primary)" }} />
          </div>
        </div>
      </div>
      <div className="absolute top-6 right-24 w-2 h-2 rounded-full bg-primary/30 landing-float" />
    </div>
  );
}
