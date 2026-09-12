"use client";

import { Star } from "lucide-react";

/**
 * Small scattered stars/dots/confetti slivers in the six portal colors,
 * floating gently around the login card. A lighter, more playful companion
 * to LoginBackgroundDecor's blobs and orbit rings — same idea (fill the
 * empty space) via a different visual language, drawn from a Canva concept
 * generated as reference.
 */
const PIECES: Array<{
  type: "star" | "dot" | "sliver";
  color: string;
  top: string;
  left: string;
  rotate?: number;
  size?: number;
  float: "landing-float" | "landing-float-slow";
}> = [
  { type: "star", color: "#D97706", top: "10%", left: "64%", rotate: -12, size: 16, float: "landing-float" },
  { type: "star", color: "#DB2777", top: "72%", left: "9%", rotate: 15, size: 13, float: "landing-float-slow" },
  { type: "star", color: "#7C3AED", top: "84%", left: "50%", rotate: 8, size: 11, float: "landing-float" },
  { type: "dot", color: "#0D9488", top: "36%", left: "5%", size: 8, float: "landing-float" },
  { type: "dot", color: "#DB2777", top: "15%", left: "42%", size: 6, float: "landing-float-slow" },
  { type: "dot", color: "#2563EB", top: "7%", left: "88%", size: 6, float: "landing-float-slow" },
  { type: "sliver", color: "#DB2777", top: "20%", left: "22%", rotate: -35, float: "landing-float" },
  { type: "sliver", color: "#0D9488", top: "64%", left: "90%", rotate: 40, float: "landing-float-slow" },
];

export default function LoginConfetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      {PIECES.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: p.top, left: p.left, transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined }}
        >
          <div className={p.float}>
            {p.type === "star" && <Star size={p.size} style={{ color: p.color }} fill={p.color} strokeWidth={0} />}
            {p.type === "dot" && (
              <span className="block rounded-full" style={{ width: p.size, height: p.size, backgroundColor: p.color, opacity: 0.8 }} />
            )}
            {p.type === "sliver" && (
              <span className="block rounded-full" style={{ width: 14, height: 4, backgroundColor: p.color, opacity: 0.7 }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
