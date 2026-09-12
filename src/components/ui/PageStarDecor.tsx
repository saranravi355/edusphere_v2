import { Star } from "lucide-react";

/**
 * A sparse scatter of small stars/dots in the current portal's own accent
 * color (`currentColor` via `text-primary`), echoing the login page's
 * confetti (LoginConfetti) without its rainbow palette — internal pages stay
 * within their one portal color throughout, same as the sidebar and orbit
 * rings already do. Kept deliberately spare (four pieces, low opacity):
 * these sit behind real content on data-dense pages, so more than a
 * handful would compete with it rather than just filling the margins.
 */
const PIECES: Array<{
  type: "star" | "dot";
  top: string;
  left: string;
  size: number;
  rotate?: number;
  float: "landing-float" | "landing-float-slow";
}> = [
  { type: "star", top: "3%", left: "94%", size: 14, rotate: -10, float: "landing-float" },
  { type: "dot", top: "7%", left: "3%", size: 6, float: "landing-float-slow" },
  { type: "star", top: "95%", left: "5%", size: 11, rotate: 14, float: "landing-float-slow" },
  { type: "dot", top: "90%", left: "96%", size: 7, float: "landing-float" },
];

export default function PageStarDecor() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none text-primary" aria-hidden="true">
      {PIECES.map((p, i) => (
        <div
          key={i}
          className={`absolute opacity-30 ${p.float}`}
          style={{ top: p.top, left: p.left, transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined }}
        >
          {p.type === "star" ? (
            <Star size={p.size} fill="currentColor" strokeWidth={0} />
          ) : (
            <span className="block rounded-full bg-current" style={{ width: p.size, height: p.size }} />
          )}
        </div>
      ))}
    </div>
  );
}
