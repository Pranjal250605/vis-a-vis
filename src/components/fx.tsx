"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Fade/slide-in when scrolled into view (respects prefers-reduced-motion via CSS). */
export function Reveal({ children, delay = 0, className = "", style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`rv${shown ? " in" : ""} ${className}`} style={{ ...style, transitionDelay: shown ? `${delay}ms` : undefined }}>{children}</div>;
}

/** Number that counts up once when visible. */
export function CountUp({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") { setN(to); return; }
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{n.toLocaleString("ja-JP")}{suffix}</span>;
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
