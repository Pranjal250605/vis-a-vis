"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Thin progress bar shown from the moment an internal link is clicked until the URL has changed.
 * (In `next dev` the first visit to a page has to compile it, which can take a few seconds – without
 * feedback that looks like a dead link.)
 */
export default function NavProgress({ color = "linear-gradient(90deg,#fcc800,#ff8900)" }: { color?: string }) {
  const [w, setW] = useState(0);
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const guard = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const finish = () => {
      if (timer.current) clearInterval(timer.current);
      if (guard.current) clearTimeout(guard.current);
      timer.current = null; guard.current = null;
      setW(100);
      hideT.current = setTimeout(() => { setOn(false); setW(0); }, 320);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//") || a.target === "_blank" || a.hasAttribute("download")) return;
      const [pathQuery, hash] = href.split("#");
      if (pathQuery === window.location.pathname + window.location.search || (pathQuery === "" && hash !== undefined)) return;
      if (hideT.current) clearTimeout(hideT.current);
      if (timer.current) clearInterval(timer.current);
      setOn(true); setW(14);
      const target = decodeURIComponent(pathQuery);
      timer.current = setInterval(() => {
        const here = decodeURIComponent(window.location.pathname + window.location.search);
        if (here === target) { finish(); return; }
        setW((x) => Math.min(90, x + (90 - x) * 0.12 + 0.6));
      }, 120);
      guard.current = setTimeout(finish, 20000);
    };
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("click", onClick, true); if (timer.current) clearInterval(timer.current); if (guard.current) clearTimeout(guard.current); if (hideT.current) clearTimeout(hideT.current); };
  }, []);

  return (
    <div aria-hidden="true" style={{ position: "fixed", top: 0, left: 0, zIndex: 99999, height: 3, width: `${w}%`, background: color, opacity: on ? 1 : 0, transition: "width .25s ease, opacity .3s ease", pointerEvents: "none", boxShadow: "0 0 8px rgba(255,137,0,.6)" }} />
  );
}
