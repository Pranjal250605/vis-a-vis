"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api, toast } from "@/lib/client";

/** Pill button in the client site's style (.cmn-btn._01) */
export function Pill({
  href, onClick, type = "button", variant, left, short, disabled, children, download,
}: {
  href?: string; onClick?: () => void; type?: "button" | "submit"; variant?: "orange" | "blue" | "gray"; left?: boolean; short?: boolean; disabled?: boolean; children: ReactNode; download?: boolean;
}) {
  const cls = ["cmn-btn", variant ? "_" + variant : "", left ? "_left" : "", short ? "_short" : ""].join(" ").trim();
  const inner = (<><span className="_text">{children}</span><span className="_icon" /></>);
  return (
    <div className={cls}>
      {href ? (
        download ? <a href={href}>{inner}</a> : <Link href={href}>{inner}</Link>
      ) : (
        <button type={type} onClick={onClick} disabled={disabled}>{inner}</button>
      )}
    </div>
  );
}

export function SectionTitle({ en, jp, small }: { en: string; jp: string; small?: boolean }) {
  return (
    <h2 className={small ? "sec-ttl" : "cmn-ttl01"}>
      <span className="en">{en}</span>
      <span className="jp">{jp}</span>
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
    <Link href={href} className="s-logo" aria-label="Vinsight">
      <span className="mark" aria-hidden="true" />
      <span>Vinsight<small>VIS-À-VIS MONITOR</small></span>
    </Link>
  );
}
