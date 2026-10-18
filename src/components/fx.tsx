"use client";
import type { CSSProperties, ReactNode } from "react";

/** Plain wrapper (the entrance animation was removed for the simple design; kept so call sites stay unchanged). */
export function Reveal({ children, className = "", style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  return <div className={`rv in ${className}`} style={style}>{children}</div>;
}

/** Number shown as-is (no count-up animation). */
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string; duration?: number }) {
  return <span>{to.toLocaleString("ja-JP")}{suffix}</span>;
}

/** Wavy section divider (same idea as the client's shape svgs). */
export function Wave({ from, to, flip }: { from: string; to: string; flip?: boolean }) {
  return (
    <div className="wave" style={{ background: from, transform: flip ? "scaleY(-1)" : undefined }} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0 40 C 180 90, 360 0, 540 30 S 900 90, 1080 40 S 1320 0, 1440 30 V80 H0 Z" fill={to} /></svg>
    </div>
  );
}

export function Skeleton({ h = 20, w = "100%", r = 10, style }: { h?: number; w?: number | string; r?: number; style?: CSSProperties }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} aria-hidden="true" />;
}
