"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { api, useApi } from "@/lib/client";
import { ADMIN_ROUTES, warmRoutes } from "@/lib/warmup";
import NavProgress from "./NavProgress";

const ICON: Record<string, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  survey: "M9 4h6v3H9zM6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M8 12h8M8 16h5",
  text: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
  news: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7zM10 20a2 2 0 0 0 4 0",
  gift: "M3 9h18v4H3zM12 9v12M5 13v8h14v-8M12 9c-1-4-5-5-5-2.500S10 9 12 9zm0 0c1-4 5-5 5-2.500S14 9 12 9z",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 10h6M9 14h6M12 7v10",
  list: "M8 6h13M8 12h13M8 18h13M3.500 6h.01M3.500 12h.01M3.500 18h.01",
  users: "M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM5 20c0-3.500 3-6 7-6s7 2.500 7 6",
  chart: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  exit: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9",
  sliders: "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4",
  mail: "M3 6h18v12H3zM3 7l9 7 9-7",
  inbox: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5",
  shield: "M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z",
  check: "M5 12l5 5 9-10",
};
export function Icon({ n, s = 18 }: { n: string; s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[n] ?? ICON.list} /></svg>;
}

const NAV: { grp: string; title: string; isNew?: boolean; items: { href: string; label: string; icon: string; code?: string; badge?: "inq" | "trade" }[] }[] = [
  { grp: "TOP", title: "ホーム", items: [{ href: "/admin", label: "TOPメニュー", icon: "home" }] },
  { grp: "A", title: "アンケート管理", items: [{ href: "/admin/surveys", label: "アンケート一覧", icon: "survey", code: "A-1" }, { href: "/admin/default-texts", label: "デフォルト設定", icon: "text", code: "A-2" }] },
  { grp: "B", title: "新着情報管理", items: [{ href: "/admin/news", label: "新着情報一覧", icon: "news", code: "B-1" }] },
  { grp: "C", title: "ポイント交換管理", items: [{ href: "/admin/trades", label: "申請一覧", icon: "gift", code: "C-1", badge: "trade" }] },
  { grp: "P", title: "ポイント管理（新設）", isNew: true, items: [{ href: "/admin/points/grant", label: "ポイント付与（手動）", icon: "coin" }, { href: "/admin/points", label: "ポイント付与一覧", icon: "list" }] },
  { grp: "D", title: "モニター管理", items: [{ href: "/admin/monitors", label: "モニター一覧", icon: "users", code: "D-1" }] },
  { grp: "E", title: "サンプル数調査", items: [{ href: "/admin/sample", label: "サンプル数調査", icon: "chart", code: "E-1" }] },
  { grp: "F", title: "退会管理", items: [{ href: "/admin/withdrawals", label: "退会理由", icon: "exit", code: "F-1" }] },
  { grp: "G", title: "設定", items: [{ href: "/admin/settings", label: "管理者設定", icon: "sliders", code: "G-1" }, { href: "/admin/mail-texts", label: "文章設定", icon: "mail", code: "G-2" }] },
  { grp: "+", title: "運営（新設）", isNew: true, items: [{ href: "/admin/inquiries", label: "お問い合わせ", icon: "inbox", badge: "inq" }, { href: "/admin/mail-log", label: "送信メール履歴", icon: "mail" }, { href: "/admin/audit-log", label: "監査ログ", icon: "shield" }, { href: "/admin/requirements", label: "要求事項 対応状況", icon: "check" }] },
];

type ToastItem = { id: number; text: string; kind: "ok" | "err" | "info" };

/** URLのクエリ（?status=… / ?edit=1 / ?tab=… など）が変わったらページを作り直す。
 *  同じパスでクエリだけ違うリンク（ダッシュボード→一覧、一覧の「編集」リンクなど）が正しく反映される。 */
function QueryKeyed({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  return <div key={sp.toString()} style={{ display: "contents" }}>{children}</div>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const isLogin = path === "/admin/login";
  const dash = useApi<any>(isLogin ? null : "/admin/dashboard", [path]);
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  useEffect(() => { warmRoutes(ADMIN_ROUTES); }, []); // dev: 全ページを先にコンパイルしておく（クリック直後に固まって見えるのを防ぐ）
  useEffect(() => { if (dash.error?.status === 401) router.replace("/admin/login"); }, [dash.error, router]);
  useEffect(() => { setDrawer(false); window.scrollTo({ top: 0 }); }, [path]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { text: string; kind: ToastItem["kind"] };
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-3), { id, ...d }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
    };
    window.addEventListener("adm-toast", on);
    return () => window.removeEventListener("adm-toast", on);
  }, []);

  if (isLogin) return <>{children}</>;
  if (!dash.data) {
    return (
      <div className="adm adm-boot" aria-busy="true">
        <aside className="adm-side"><div className="brand"><span className="mark" /><span>Vinsight<small>ADMIN CONSOLE</small></span></div></aside>
        <div className="adm-main"><div className="adm-body"><div className="skel" style={{ height: 120, borderRadius: 14 }} /><div className="skel" style={{ height: 300, borderRadius: 14 }} /></div></div>
      </div>
    );
  }

  const badge = (b?: string) => (b === "inq" ? dash.data.inquiriesOpen : b === "trade" ? dash.data.tradesUnshipped : 0);
  const logout = async () => { await api("/admin/logout", { method: "POST", body: {} }); router.push("/admin/login"); };
  const reset = async () => {
    if (!window.confirm("デモデータを初期状態に戻します。よろしいですか？")) return;
    await api("/admin/reset-demo", { method: "POST", body: {} });
    window.location.reload();
  };
  const isOn = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));

  return (
    <div className={"adm" + (drawer ? " drawer-open" : "")}>
      <NavProgress color="linear-gradient(90deg,#fcc800,#ff8900)" />
      <button className="adm-burger" aria-label="メニュー" aria-expanded={drawer} onClick={() => setDrawer(!drawer)}><span /><span /><span /></button>
      <div className="adm-scrim" onClick={() => setDrawer(false)} />
      <aside className="adm-side">
        <div className="brand"><span className="mark" /><span>Vinsight<small>ADMIN CONSOLE</small></span></div>
        <nav aria-label="管理メニュー">
          {NAV.map((g) => (
            <div key={g.grp + g.title}>
              {g.grp !== "TOP" && <div className="grp"><i className={g.isNew ? "new" : ""}>{g.grp}</i>{g.title}</div>}
              <ul>
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} onClick={() => setDrawer(false)} className={isOn(it.href) && !(it.href === "/admin/points" && path.startsWith("/admin/points/grant")) ? "on" : ""} aria-current={isOn(it.href) ? "page" : undefined}>
                      <Icon n={it.icon} s={17} />
                      <span className="t">{it.label}</span>
                      {it.code && <span className="cd jost">{it.code}</span>}
                      {it.badge && badge(it.badge) > 0 && <span className="badge">{badge(it.badge)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="foot">
          <div className="me"><span className="av">A</span><span>admin<small>管理者</small></span></div>
          <button onClick={reset}>データ初期化</button>
          <button onClick={logout}>ログアウト</button>
          {/* サイトと管理画面はCSSが別なので、ページを読み込み直して移動する（通常の <a>） */}<a href="/" className="to-site">モニターサイトを開く →</a>
        </div>
      </aside>
      <div className="adm-main" key={path}><Suspense fallback={null}><QueryKeyed>{children}</QueryKeyed></Suspense></div>
      <div className="adm-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={"adm-toast _" + t.kind} role="status">
            <span className="ic">{t.kind === "ok" ? "✓" : t.kind === "err" ? "!" : "i"}</span>
            <span className="tx">{t.text}</span>
            <button aria-label="閉じる" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ページ共通のヘッダー＋本文コンテナ。code は画面コード（A-1 など）。req は対応する要求事項No。 */
export function AdminPage({ code, title, crumbs, req, actions, children }: { code?: string; title: string; crumbs?: string; req?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="adm-top">
        <div className="ttl">
          {crumbs && <div className="path">{crumbs}</div>}
          <h1>{code && <span className="code">{code}</span>}{title}{req && <span className="req-tag" title="対応する要求事項">{req}</span>}</h1>
        </div>
        <div className="right">{actions}</div>
      </div>
      <div className="adm-body">{children}</div>
    </>
  );
}

export function Panel({ title, sub, children, req }: { title?: string; sub?: ReactNode; children: ReactNode; req?: string }) {
  return (
    <section className="panel">
      {title && <h2>{title}{req && <span className="req-tag">{req}</span>}{sub && <span className="sub">{sub}</span>}</h2>}
      {children}
    </section>
  );
}

export function SortTh({ label, k, sort, order, onSort, num }: { label: string; k: string; sort: string; order: string; onSort: (k: string, o: "asc" | "desc") => void; num?: boolean }) {
  const on = sort === k;
  return (
    <th className={"sortable" + (num ? " num" : "") + (on ? " on" : "")} aria-sort={on ? (order === "asc" ? "ascending" : "descending") : "none"} onClick={() => onSort(k, on && order === "asc" ? "desc" : "asc")}>
      {label}<span className="ar">{on ? (order === "asc" ? "▲" : "▼") : "↕"}</span>
    </th>
  );
}

export function StatusPill({ s }: { s: string }) {
  const cls = s === "配信中" || s === "公開中" || s === "発送済み" || s === "有効" || s === "対応済み" ? "go" : s === "配信待ち" || s === "公開前" ? "wait" : s === "配信終了" || s === "公開終了" || s === "退会" ? "end" : s === "非公開" || s === "無効" ? "hide" : s === "未発送" || s === "未対応" ? "warn" : "";
  return <span className={"pill " + cls}>{s}</span>;
}

/** 単一系列の縦棒グラフ（ホバーで値を表示・表でも確認可能）。 */
export function BarChart({ data, unit = "件", label }: { data: { label: string; value: number }[]; unit?: string; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 220, PL = 34, PR = 8, PT = 22, PB = 30;
  const max = Math.max(4, ...data.map((d) => d.value));
  const nice = Math.ceil(max / 4) * 4;
  const iw = W - PL - PR, ih = H - PT - PB;
  const bw = Math.min(54, (iw / data.length) * 0.5);
  const x = (i: number) => PL + (iw / data.length) * (i + 0.5);
  const y = (v: number) => PT + ih - (v / nice) * ih;
  const top = (cx: number, v: number) => {
    const h = Math.max(0, PT + ih - y(v)), r = Math.min(4, h);
    return h === 0 ? "" : `M${cx - bw / 2},${PT + ih} V${y(v) + r} Q${cx - bw / 2},${y(v)} ${cx - bw / 2 + r},${y(v)} H${cx + bw / 2 - r} Q${cx + bw / 2},${y(v)} ${cx + bw / 2},${y(v) + r} V${PT + ih} Z`;
  };
  return (
    <figure className="chart" style={{ margin: 0 }}>
      <div className="chart-wrap" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: "100%", height: "auto", display: "block" }}>
          {[0, 1, 2, 3, 4].map((g) => {
            const v = (nice / 4) * g;
            return <g key={g}><line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke={g === 0 ? "#b8c0cc" : "#e6e9ef"} strokeWidth={g === 0 ? 1.5 : 1} /><text x={PL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b7280" fontFamily="Jost, sans-serif">{v}</text></g>;
          })}
          {data.map((d, i) => (
            <g key={d.label} onMouseEnter={() => setHover(i)} style={{ cursor: "default" }}>
              <rect x={x(i) - (iw / data.length) / 2} y={PT} width={iw / data.length} height={ih} fill="transparent" />
              <path d={top(x(i), d.value)} fill={hover === i ? "#002c83" : "#4d9df2"} style={{ transition: "fill .2s" }} />
              <text x={x(i)} y={y(d.value) - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1b1f2a" fontFamily="Jost, sans-serif">{d.value}</text>
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="12" fill="#4b5563">{d.label}</text>
            </g>
          ))}
        </svg>
        {hover !== null && (
          <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover].value) / H) * 100}%` }}>
            <b>{data[hover].label}</b>{data[hover].value}{unit}
          </div>
        )}
      </div>
      <details className="chart-table"><summary>表で見る</summary>
        <table className="tbl"><thead><tr><th>月</th><th className="num">{unit}</th></tr></thead><tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td className="num">{d.value}</td></tr>)}</tbody></table>
      </details>
    </figure>
  );
}
