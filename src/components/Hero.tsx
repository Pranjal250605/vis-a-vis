"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Main visual – a faithful port of the client site's (vis-a-vis.co.jp) hero:
 *  - 1315×722 stage, every illustration absolutely positioned with the client's top/left/right/bottom/width values
 *  - stage scaled by clamp(vw/140, 10, 14)/10, wrapper height = 722 × scale
 *  - below 1315px the stage is drag/flick-scrollable and centred on load
 * Only the illustrations that exist in /public/images are used (star, tv, train, signage and plane are not in the folder).
 */
const ITEMS: { cls: string; src: string }[] = [
  { cls: "planet", src: "planet" }, { cls: "rocket", src: "rocket" }, { cls: "soccer", src: "soccer" }, { cls: "base", src: "base" },
  { cls: "magazine01", src: "magazine01" }, { cls: "magazine02", src: "magazine02" }, { cls: "monitor", src: "monitor" },
  { cls: "exclamation", src: "exclamation" }, { cls: "bmx", src: "bmx" }, { cls: "interview", src: "interview" },
  { cls: "person01", src: "person01" }, { cls: "person02", src: "person02" }, { cls: "person03", src: "person03" },
  { cls: "staff01", src: "staff01" }, { cls: "haremachi", src: "haremachi" }, { cls: "staff02", src: "staff02" }, { cls: "bizen", src: "bizen" },
  { cls: "news", src: "news" }, { cls: "shrine", src: "shrine" }, { cls: "shirt", src: "shirt" }, { cls: "front", src: "front" },
  { cls: "parfait", src: "parfait" }, { cls: "universe01", src: "universe01" }, { cls: "universe02", src: "universe02" },
];

export default function Hero({ marquee }: { marquee: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const layout = () => {
      const vw = window.innerWidth;
      const fontPx = Math.min(14, Math.max(10, vw / 140)); // clamp(1rem, 1vw/1.4, 1.4rem) with 10px root
      const sc = fontPx / 10;
      setScale(sc);
      const w = wrap.current, i = inner.current;
      if (w && i) {
        const left = (i.offsetWidth - vw) / 2;
        if (left >= 0) w.scrollLeft = left;
      }
    };
    layout();
    setActive(true);
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, []);

  // mouse drag scrolling (mousedragscrollable in the client's script)
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let down = false, sx = 0, sl = 0;
    const md = (e: MouseEvent) => { down = true; sx = e.clientX; sl = el.scrollLeft; e.preventDefault(); };
    const mm = (e: MouseEvent) => { if (down) el.scrollLeft = sl + (sx - e.clientX); };
    const mu = () => { down = false; };
    el.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => { el.removeEventListener("mousedown", md); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
  }, []);

  const text = (
    <span>
      {marquee}
      <i>★</i>
      {marquee}
      <i>★</i>
    </span>
  );

  return (
    <div className="top-mainv">
      <div className="loop-text" aria-hidden="true">{text}{text}</div>
      <div
        ref={wrap}
        className={"mainv-illust" + (active ? " is-active" : "")}
        style={{ height: 722 * scale }}
        aria-label="Vinsight メインビジュアル"
      >
        <div ref={inner} className="inner" style={{ ["--scale" as string]: scale }}>
          {ITEMS.map((it) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={it.cls} src={`/images/${it.src}.webp`} alt="" className={`mv ${it.cls}`} />
          ))}
          <div className="mainv-scroll">
            <a href="#sec-beat">Scroll Down<span /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
