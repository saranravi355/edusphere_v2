"use client";

import { useState } from "react";

// Brand logo. Renders /logo.png when present; falls back to a clean text/icon
// wordmark so nothing looks broken before the image file is added to /public.

export function LogoMark({ size = 32 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <span
        style={{ width: size, height: size }}
        className="rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading flex-shrink-0"
      >
        E
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="EduSphere 360"
      width={size}
      height={size}
      onError={() => setOk(false)}
      style={{ width: size, height: size }}
      className="object-contain flex-shrink-0"
    />
  );
}

export function LogoFull({ className = "" }: { className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div className="flex flex-col text-left leading-none">
        <span className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-wide">EDU</span>
        <span className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-wide">
          SPHERE<sup className="text-sm font-bold ml-1 text-blue-500">Alpha2</sup>
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="EduSphere 360" onError={() => setOk(false)} className={className} />
  );
}
