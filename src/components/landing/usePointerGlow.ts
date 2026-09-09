"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * Tracks the pointer across an element and publishes its position as CSS
 * custom properties, so the holographic effects can be driven entirely in CSS.
 *
 * Writes go straight to the node inside a rAF rather than through React state:
 * a pointermove fires far more often than a frame, and re-rendering six cards
 * on every event would cost more than the effect is worth.
 *
 * Sets on the element:
 *   --mx, --my    pointer position within the element, as a percentage
 *   --glow        0 or 1, for fading the highlight in and out
 *   --h1,-h2,-h3  three spaced hues derived from the pointer position
 *   --rx, --ry    tilt angles, only when `tilt` is non-zero
 *
 * The hues are what make this read as iridescence rather than a coloured blob
 * being dragged around: real foil shifts colour as the viewing angle changes,
 * so the spectrum has to follow the cursor, not just the highlight's position.
 * They are computed here rather than with calc() inside hsl() so the CSS stays
 * plain values, with no reliance on calc-in-color support.
 *
 * When the visitor has asked for reduced motion the tilt is never written, so
 * the card stays flat while the colour treatment still applies.
 */
export function usePointerGlow<T extends HTMLElement>({
  tilt = 0,
  hueRange = 300,
  hueStart = 190,
}: { tilt?: number; hueRange?: number; hueStart?: number } = {}) {
  const ref = useRef<T>(null);
  const frame = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<T>) => {
      const el = ref.current;
      if (!el) return;

      // Read the coordinates now; the event object is pooled-adjacent and the
      // callback below runs a frame later.
      const { clientX, clientY } = e;

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;

        const px = (clientX - r.left) / r.width;
        const py = (clientY - r.top) / r.height;

        el.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
        el.style.setProperty("--glow", "1");

        // Diagonal travel across the card sweeps the spectrum, so moving in
        // any direction shifts the colour.
        const hue = (hueStart + (px * 0.65 + py * 0.35) * hueRange) % 360;
        el.style.setProperty("--h1", hue.toFixed(1));
        el.style.setProperty("--h2", ((hue + 55) % 360).toFixed(1));
        el.style.setProperty("--h3", ((hue + 115) % 360).toFixed(1));

        if (tilt && !reduce) {
          el.style.setProperty("--rx", `${((0.5 - py) * tilt).toFixed(2)}deg`);
          el.style.setProperty("--ry", `${((px - 0.5) * tilt).toFixed(2)}deg`);
        }
      });
    },
    [tilt, reduce, hueRange, hueStart],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty("--glow", "0");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { ref, onPointerMove, onPointerLeave, reduce };
}
