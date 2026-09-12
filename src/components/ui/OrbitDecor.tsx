/**
 * The landing page's orbit-ring decoration, brought into each portal's own
 * front dashboard. Colored with `currentColor` via `text-primary`, so it
 * automatically picks up whichever portal's identity color is active
 * (see the `.portal-*` rules in globals.css) with no per-portal prop needed.
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
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div
        className="absolute -top-14 -right-10 w-52 h-52 rounded-full border border-primary/25 landing-orbit"
        style={{ animationDuration: "34s" }}
      >
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary/70" />
      </div>
      <div
        className="absolute -top-14 -right-10 w-36 h-36 m-8 rounded-full border border-primary/15 landing-orbit"
        style={{ animationDuration: "22s", animationDirection: "reverse" }}
      >
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/50" />
      </div>
      <div className="absolute top-8 right-28 w-2.5 h-2.5 rounded-full bg-primary/30 landing-float" />
    </div>
  );
}
