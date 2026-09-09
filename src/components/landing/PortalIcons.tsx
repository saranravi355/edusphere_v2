import type { SVGProps } from "react";

/**
 * Flat multi-tone portal icons.
 *
 * Hand-authored rather than pulled from an icon set: the six subjects here
 * (a school, a principal, a teacher at a board, a graduate, a family, a gear)
 * do not exist as a matched set in any one library, and mixing sets shows.
 *
 * Every shape is `currentColor` at a different opacity rather than a different
 * hex. That is what keeps them theme-correct for free: the tile already swaps
 * the ink between light and dark, so the whole icon follows without a second
 * palette to maintain. Four tones carry the illustration.
 *
 * Because the tones are translucent, overlapping shapes ADD. Anything drawn on
 * top of a filled body is therefore given a higher tone, never a lower one -
 * a door over a wall reads darker, which is also how it should look.
 *
 * Drawn on a 24x24 grid to sit on the same optical size as the lucide icons
 * used elsewhere in the app.
 */

const T = { deep: 1, mid: 0.62, soft: 0.34, wash: 0.16 } as const;

type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "size">;

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Management - the institution itself. */
export function SchoolIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* flag */}
      <rect x="11.6" y="2" width="0.9" height="4" rx="0.45" opacity={T.mid} />
      <path d="M12.7 2.4h2.9l-.85 1.05.85 1.05h-2.9z" opacity={T.mid} />
      {/* walls */}
      <path d="M4.4 10.9h15.2v9.5H4.4z" opacity={T.soft} />
      {/* roof */}
      <path d="M2.3 11 12 5.6 21.7 11z" opacity={T.mid} />
      {/* windows and door */}
      <rect x="6.6" y="12.7" width="2.7" height="2.7" rx="0.5" opacity={T.mid} />
      <rect x="14.7" y="12.7" width="2.7" height="2.7" rx="0.5" opacity={T.mid} />
      <path d="M10.2 20.4v-4a1.8 1.8 0 0 1 3.6 0v4z" opacity={T.deep} />
      {/* ground */}
      <rect x="2" y="20.4" width="20" height="1.4" rx="0.7" opacity={T.mid} />
    </Svg>
  );
}

/** Principal - leadership. */
export function PrincipalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* jacket */}
      <path d="M5 21.2c0-3.5 3.1-6.3 7-6.3s7 2.8 7 6.3z" opacity={T.soft} />
      {/* shirt */}
      <path d="M9.7 15.2 12 18.4l2.3-3.2 1.1.5L12 21.2 8.6 15.7z" opacity={T.mid} />
      {/* tie */}
      <path d="M12 18.9l-.95 2.3h1.9z" opacity={T.deep} />
      {/* head */}
      <circle cx="12" cy="7.3" r="3.4" opacity={T.mid} />
      {/* hair */}
      <path d="M8.6 6.9c.3-2.2 1.7-3.5 3.4-3.5s3.1 1.3 3.4 3.5c-.9-1.1-2-1.6-3.4-1.6s-2.5.5-3.4 1.6z" opacity={T.deep} />
    </Svg>
  );
}

/** Teacher - a person at the board. */
export function TeacherIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* board */}
      <rect x="9.6" y="3" width="11.6" height="9.2" rx="1.1" opacity={T.wash} />
      <path d="M9.6 4.1a1.1 1.1 0 0 1 1.1-1.1h9.4a1.1 1.1 0 0 1 1.1 1.1v.9H9.6z" opacity={T.mid} />
      <rect x="11.7" y="6.6" width="7.2" height="1.1" rx="0.55" opacity={T.mid} />
      <rect x="11.7" y="9" width="4.4" height="1.1" rx="0.55" opacity={T.soft} />
      {/* teacher */}
      <path d="M2.2 21.2v-4.6a3.3 3.3 0 0 1 6.6 0v4.6z" opacity={T.soft} />
      <circle cx="5.5" cy="7.6" r="2.6" opacity={T.mid} />
      <path d="M2.9 7.2c.2-1.7 1.3-2.7 2.6-2.7s2.4 1 2.6 2.7c-.7-.8-1.5-1.2-2.6-1.2s-1.9.4-2.6 1.2z" opacity={T.deep} />
      {/* pointing arm */}
      <rect x="7.4" y="12.6" width="4.4" height="1.3" rx="0.65" transform="rotate(-38 7.4 12.6)" opacity={T.deep} />
    </Svg>
  );
}

/** Student - the graduate. */
export function GraduateIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* head under the cap */}
      <path d="M6.6 11.6v4.2c0 1.5 2.4 2.7 5.4 2.7s5.4-1.2 5.4-2.7v-4.2z" opacity={T.soft} />
      {/* mortarboard */}
      <path d="M12 5 22 9.5 12 14 2 9.5z" opacity={T.mid} />
      <path d="M12 10.6 22 6.1v3.4L12 14 2 9.5V6.1z" opacity={T.wash} />
      {/* tassel */}
      <rect x="20.1" y="9.5" width="1" height="5.6" rx="0.5" opacity={T.mid} />
      <circle cx="20.6" cy="16" r="1.4" opacity={T.deep} />
    </Svg>
  );
}

/** Parent - the family group. */
export function FamilyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* left adult */}
      <path d="M2.6 21.2v-4.3a3.7 3.7 0 0 1 7.4 0v4.3z" opacity={T.soft} />
      <circle cx="6.3" cy="6.4" r="2.5" opacity={T.mid} />
      {/* right adult */}
      <path d="M14 21.2v-4.3a3.7 3.7 0 0 1 7.4 0v4.3z" opacity={T.soft} />
      <circle cx="17.7" cy="6.4" r="2.5" opacity={T.mid} />
      {/* child, brought forward */}
      <path d="M8.8 21.2v-3a3.2 3.2 0 0 1 6.4 0v3z" opacity={T.deep} />
      <circle cx="12" cy="13" r="2.2" opacity={T.deep} />
    </Svg>
  );
}

/** Operations - the machinery behind the school. */
export function GearIcon(props: IconProps) {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Svg {...props}>
      {teeth.map((a) => (
        <rect
          key={a}
          x="10.8"
          y="1.4"
          width="2.4"
          height="4.2"
          rx="1.1"
          transform={`rotate(${a} 12 12)`}
          opacity={T.mid}
        />
      ))}
      <circle cx="12" cy="12" r="7.4" opacity={T.soft} />
      {/* ring: the inner subpath is wound to punch a hole */}
      <path
        fillRule="evenodd"
        d="M12 8.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8zm0 1.8a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"
        opacity={T.deep}
      />
    </Svg>
  );
}
