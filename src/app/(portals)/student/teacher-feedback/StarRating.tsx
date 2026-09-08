"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/** 1–5 star input. Renders a hidden number input so it posts with the form. */
export default function StarRating({
  name,
  defaultValue = 0,
  disabled,
}: {
  name: string;
  defaultValue?: number;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          disabled={disabled}
          onClick={() => setValue(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 disabled:cursor-not-allowed"
        >
          <Star
            size={20}
            className={n <= shown ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300 dark:text-zinc-700"}
          />
        </button>
      ))}
    </div>
  );
}
