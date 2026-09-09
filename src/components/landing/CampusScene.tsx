/**
 * A flat campus skyline, used as a base band on the mission panel.
 *
 * Sits behind text, so everything here is low-contrast on purpose and the
 * panel keeps its own gradient above it. Drawn wide and short (600x150) and
 * stretched with preserveAspectRatio="none" is deliberately NOT used - the
 * band crops from the sides instead, so the buildings never skew.
 */
export function CampusScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 150"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      focusable="false"
    >
      {/* far trees */}
      <g fill="#FFFFFF" opacity="0.1">
        <circle cx="46" cy="96" r="20" />
        <circle cx="70" cy="104" r="15" />
        <circle cx="556" cy="100" r="18" />
        <circle cx="532" cy="107" r="13" />
      </g>

      {/* main block */}
      <g fill="#FFFFFF" opacity="0.14">
        <rect x="188" y="52" width="150" height="98" rx="3" />
        <rect x="120" y="78" width="70" height="72" rx="3" />
        <rect x="336" y="70" width="86" height="80" rx="3" />
        <path d="M234 52h58l-29-20z" />
      </g>

      {/* windows */}
      <g fill="#FFFFFF" opacity="0.22">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <rect key={`${r}-${c}`} x={202 + c * 27} y={66 + r * 20} width="15" height="11" rx="1.5" />
          )),
        )}
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => (
            <rect key={`l-${r}-${c}`} x={133 + c * 26} y={90 + r * 20} width="14" height="11" rx="1.5" />
          )),
        )}
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`r-${r}-${c}`} x={348 + c * 24} y={84 + r * 20} width="13" height="11" rx="1.5" />
          )),
        )}
      </g>

      {/* entrance */}
      <path d="M248 150v-26a15 15 0 0 1 30 0v26z" fill="#FFFFFF" opacity="0.26" />

      {/* near trees */}
      <g fill="#FFFFFF" opacity="0.18">
        <circle cx="446" cy="112" r="17" />
        <rect x="443" y="124" width="6" height="26" rx="2" />
        <circle cx="96" cy="116" r="14" />
        <rect x="93" y="126" width="6" height="24" rx="2" />
      </g>

      {/* ground line */}
      <rect x="0" y="146" width="600" height="4" fill="#FFFFFF" opacity="0.16" />
    </svg>
  );
}
