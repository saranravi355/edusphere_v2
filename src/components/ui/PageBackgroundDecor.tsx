import OrbitDecor from "./OrbitDecor";

/**
 * The login page's "fill the empty space" treatment, calibrated down for
 * ordinary content pages: dense tables and forms live here, so this stays
 * to two barely-there color blobs plus OrbitDecor's rings rather than the
 * confetti/large-blob hero treatment used on the login/landing screens.
 * Colored via `bg-primary`/OrbitDecor's `currentColor`, so it automatically
 * follows whichever portal's identity color is active (`.portal-*` in
 * globals.css) with no prop needed.
 *
 * Rendered once by AppShell around every portal page, rather than per-page,
 * so new routes get it for free and never have to repeat the `relative z-0`
 * pairing that negative-z-index decor needs to avoid escaping to the
 * document root (see OrbitDecor's own note on that bug).
 */
export default function PageBackgroundDecor() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="landing-float-slow absolute -left-24 -bottom-24 w-96 h-96 rounded-full blur-3xl bg-primary opacity-[0.05]" />
      <div
        className="landing-float absolute right-1/4 top-1/3 w-64 h-64 rounded-full blur-3xl bg-primary opacity-[0.04]"
        style={{ animationDelay: "-5s" }}
      />
      <OrbitDecor />
    </div>
  );
}
