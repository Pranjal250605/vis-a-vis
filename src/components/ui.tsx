"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api, toast } from "@/lib/client";

const Arrow = () => (
  <svg className="stk-arr" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/** "Sticker" button: chunky outline + offset shadow that echoes the outlined illustrations. */
export function Pill({
  href, onClick, type = "button", variant, left, short, disabled, children, download,
}: {
  href?: string; onClick?: () => void; type?: "button" | "submit"; variant?: "orange" | "blue" | "gray"; left?: boolean; short?: boolean; disabled?: boolean; children: ReactNode; download?: boolean;
}) {
  const wrap = ["stk-wrap", left ? "_left" : ""].join(" ").trim();
  const cls = ["stk", variant ? "_" + variant : "", short ? "_short" : ""].join(" ").trim();
  const inner = (<><span className="stk-t">{children}</span><Arrow /></>);
  return (
    <div className={wrap}>
      {href ? (
        download ? <a className={cls} href={href}>{inner}</a> : <Link className={cls} href={href}>{inner}</Link>
      ) : (
        <button className={cls} type={type} onClick={onClick} disabled={disabled}>{inner}</button>
      )}
    </div>
  );
}

/** Section heading: small coloured eyebrow + large Japanese headline. */
export function SectionTitle({ en, jp, small }: { en: string; jp: string; small?: boolean }) {
  return (
    <h2 className={small ? "sh sh-s" : "sh"}>
      <span className="sh-en"><i aria-hidden="true" />{en}</span>
      <span className="sh-jp">{jp}</span>
    </h2>
  );
}

export function Row({ label, required, optional, hint, error, children }: { label?: ReactNode; required?: boolean; optional?: boolean; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="row">
      {label && <div className="lbl">{label}{required && <span className="req">必須</span>}{optional && <span className="opt">任意</span>}</div>}
      {children}
      {hint && <div className="hint">{hint}</div>}
      {error && <div className="err" role="alert">{error}</div>}
    </div>
  );
}

export function Checks({ options, value, onChange, cols }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; cols?: boolean }) {
  void cols;
  return (
    <div className="checks">
      {options.map((o) => (
        <label key={o} className="check">
          <input type="checkbox" checked={value.includes(o)} onChange={(e) => onChange(e.target.checked ? [...value, o] : value.filter((x) => x !== o))} />
          {o}
        </label>
      ))}
    </div>
  );
}

export function Captcha({ onChange, error, resetKey }: { onChange: (id: string, text: string) => void; error?: string; resetKey?: number }) {
  const [svg, setSvg] = useState("");
  const [id, setId] = useState("");
  const [text, setText] = useState("");
  const refresh = useCallback(async () => {
    const r = await api<{ id: string; svg: string }>("/captcha");
    setSvg(r.svg); setId(r.id); setText(""); onChange(r.id, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { refresh(); }, [refresh, resetKey]);
  return (
    <Row label="画像認証" required error={error} hint="画像に表示されている4桁の数字を半角で入力してください。">
      <div className="captcha">
        <span className="img" dangerouslySetInnerHTML={{ __html: svg }} />
        <input type="text" inputMode="numeric" autoComplete="off" value={text} className={error ? "invalid" : ""} onChange={(e) => { setText(e.target.value); onChange(id, e.target.value); }} aria-label="画像認証の文字" />
        <button type="button" onClick={refresh}>画像を更新</button>
      </div>
    </Row>
  );
}

export function Alert({ kind, children }: { kind: "err" | "ok" | "info"; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef("");
  const [toasted, setToasted] = useState(false);
  // 管理画面では、成功メッセージ（kind="ok"）を右下のトーストに切り替える
  useEffect(() => {
    if (kind !== "ok" || !ref.current || !document.querySelector(".adm")) return;
    const text = (ref.current.textContent ?? "").trim();
    if (text && text !== last.current) { last.current = text; toast(text, "ok"); setToasted(true); }
  });
  return <div ref={ref} className={`alert _${kind}`} role={kind === "err" ? "alert" : "status"} hidden={kind === "ok" && toasted}>{children}</div>;
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="lg" aria-label="Vinsight">
      <span className="lg-mk" aria-hidden="true"><i /><i /></span>
      <span className="lg-wm">Vinsight</span>
    </Link>
  );
}
