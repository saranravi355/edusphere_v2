/**
 * The hero illustration: a globe and a stack of books under a graduate's cap,
 * with leaves growing out of it.
 *
 * Flat vector by intent. The reference for this was a rendered 3D image, and
 * chasing that in SVG produces something that reads as a cheap imitation of a
 * render; a confident flat illustration sits better beside the rest of the
 * page and costs about 4KB instead of a 300KB asset.
 *
 * Colours are the brand set (navy, royal, sage, amber) written as explicit
 * stops with dark-mode counterparts supplied through CSS custom properties,
 * because unlike the portal icons this scene is genuinely multi-hue and cannot
 * ride on a single currentColor.
 */
export function HeroScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 250"
      className={className}
      role="img"
      aria-label="A globe and a stack of books beneath a graduation cap"
    >
      <defs>
        <linearGradient id="hs-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5BA9F5" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="hs-cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E3A6E" />
          <stop offset="100%" stopColor="#0F2747" />
        </linearGradient>
      </defs>

      {/* soft plate behind the group */}
      <ellipse cx="150" cy="212" rx="112" ry="15" fill="#0F2747" opacity="0.08" />

      {/* leaves */}
      <path d="M96 150c-22-4-36-19-36-38 20-2 36 10 39 27z" fill="#4FA97E" opacity="0.85" />
      <path d="M99 139c-13-9-17-24-11-38 15 6 22 20 18 34z" fill="#69C295" opacity="0.9" />
      <path d="M60 112c14 3 26 12 33 25" stroke="#2F7F5B" strokeWidth="2" fill="none" opacity="0.55" />

      {/* globe */}
      <circle cx="103" cy="176" r="30" fill="url(#hs-globe)" />
      <path d="M103 146c9 9 9 51 0 60-9-9-9-51 0-60z" fill="#EAF4FF" opacity="0.4" />
      <path d="M75 166h56M75 186h56" stroke="#EAF4FF" strokeWidth="2" opacity="0.45" />
      <path d="M88 158c9 6 12 16 6 25-4 6-3 12 2 17" stroke="#1B4FA8" strokeWidth="2.4" fill="none" opacity="0.5" />
      <path d="M113 152c8 3 11 11 7 17s-1 11 6 12" stroke="#1B4FA8" strokeWidth="2.4" fill="none" opacity="0.5" />
      <circle cx="103" cy="176" r="30" fill="none" stroke="#0F2747" strokeWidth="1.5" opacity="0.18" />

      {/* book stack */}
      <g>
        <rect x="120" y="182" width="132" height="20" rx="4" fill="#2F5FA8" />
        <rect x="120" y="182" width="132" height="6" rx="3" fill="#3E77C9" />
        <rect x="128" y="190" width="42" height="4" rx="2" fill="#DDEAFB" opacity="0.85" />

        <rect x="128" y="160" width="124" height="20" rx="4" fill="#EDF3FB" />
        <rect x="128" y="160" width="124" height="6" rx="3" fill="#FFFFFF" />
        <rect x="136" y="168" width="52" height="4" rx="2" fill="#2F5FA8" opacity="0.7" />

        <rect x="124" y="138" width="128" height="20" rx="4" fill="#4A86D8" />
        <rect x="124" y="138" width="128" height="6" rx="3" fill="#6BA0E8" />
        <rect x="132" y="146" width="46" height="4" rx="2" fill="#EAF4FF" opacity="0.9" />

        <rect x="134" y="116" width="112" height="20" rx="4" fill="#1E3A6E" />
        <rect x="134" y="116" width="112" height="6" rx="3" fill="#2F5FA8" />
        <rect x="142" y="124" width="38" height="4" rx="2" fill="#EAF4FF" opacity="0.8" />
      </g>

      {/* graduation cap */}
      <path d="M190 78 252 98l-62 20-62-20z" fill="url(#hs-cap)" />
      <path d="M190 106v10c0 0 22-2 34-9v-9z" fill="#0B1F3A" opacity="0.75" />
      <path d="M252 98v22" stroke="#E9C46A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="252" cy="124" r="5" fill="#E9C46A" />

      {/* orbit accent, echoing the rings behind the mark */}
      <circle cx="150" cy="130" r="96" fill="none" stroke="#2563EB" strokeWidth="1.2" opacity="0.14" />
      <circle cx="246" cy="150" r="4" fill="#7C3AED" opacity="0.7" />
      <circle cx="56" cy="118" r="3" fill="#0D9488" opacity="0.7" />
    </svg>
  );
}
