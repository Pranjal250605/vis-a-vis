"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/client";
import { SITE_ROUTES, warmRoutes } from "@/lib/warmup";
import NavProgress from "./NavProgress";
import { Logo } from "./ui";

type Me = { monitor: { id: number; name: string } | null; admin: boolean };

const GUEST_NAV = [
  { href: "/#about", label: "Vinsightとは" },
  { href: "/#flow", label: "ご利用の流れ" },
  { href: "/#gift", label: "ポイント交換" },
  { href: "/#news", label: "お知らせ" },
  { href: "/#faq", label: "FAQ" },
];
const MEMBER_NAV = [
  { href: "/mypage", label: "マイページ" },
  { href: "/mypage/trade", label: "ポイント交換" },
  { href: "/mypage/edit", label: "登録情報" },
  { href: "/mypage/contact", label: "お問い合わせ" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { api<Me>("/auth/me").then(setMe).catch(() => setMe({ monitor: null, admin: false })); }, [path]);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { warmRoutes([...SITE_ROUTES, "/admin/login"]); }, []); // dev: 全ページを先にコンパイルしておく

  useEffect(() => { if (!window.location.hash) window.scrollTo({ top: 0 }); }, [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const logout = async () => {
    await api("/auth/logout", { method: "POST", body: {} });
    setMe({ monitor: null, admin: false });
    setOpen(false);
    router.push("/");
  };

  const member = !!me?.monitor;
  const nav = member ? MEMBER_NAV : GUEST_NAV;
  const isHome = path === "/";
  const on = (href: string) => !href.includes("#") && (href === "/mypage" ? path === "/mypage" : path === href || path.startsWith(href + "/"));

  return (
    <div className={"site" + (isHome ? " is-home" : "")}>
      <NavProgress color="#1f4e9c" />
      <header className={"nb" + (open ? " is-open" : "")}>
        <div className="nb-bar">
          <Logo href={member ? "/mypage" : "/"} />
          <nav className="nb-nav" aria-label="メインメニュー">
            {nav.map((n) => <Link key={n.href} href={n.href} className={on(n.href) ? "on" : ""} aria-current={on(n.href) ? "page" : undefined}>{n.label}</Link>)}
          </nav>
          <div className="nb-cta">
            {member ? (
              <>
                <Link href="/mypage" className="nb-who" title="マイページへ"><span className="av" aria-hidden="true">{me?.monitor?.name.slice(0, 1)}</span><span className="nm">{me?.monitor?.name}</span></Link>
                <button className="nb-btn" onClick={logout}>ログアウト</button>
              </>
            ) : (
              <>
                <Link href="/#login" className="nb-link">ログイン</Link>
                <Link href="/register" className="nb-btn _y">新規登録</Link>
              </>
            )}
          </div>
          <button className="nb-burger" aria-label="メニュー" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
        </div>
        <div className="nb-sheet" aria-hidden={!open}>
          {nav.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>)}
          <Link href={member ? "/mypage/contact" : "/contact"} onClick={() => setOpen(false)}>お問い合わせ</Link>
          <div className="nb-sheet-cta">
            {member ? <button className="nb-btn" onClick={logout}>ログアウト</button> : <><Link href="/#login" className="nb-btn" onClick={() => setOpen(false)}>ログイン</Link><Link href="/register" className="nb-btn _y" onClick={() => setOpen(false)}>新規登録</Link></>}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="ft">
        <div className="cmn-inner ft-in">
          <div className="ft-brand">
            <Logo href={member ? "/mypage" : "/"} />
            <p>アンケートに答えて、<br />地域のおもしろいを一緒につくろう。</p>
          </div>
          <div className="ft-cols">
            <div>
              <h3>サイト</h3>
              {member ? (
                <><Link href="/mypage">マイページ</Link><Link href="/mypage#news">新着情報</Link><Link href="/mypage/trade">ポイント交換</Link><Link href="/mypage/edit">登録情報</Link></>
              ) : (
                <><Link href="/#about">Vinsightとは</Link><Link href="/#flow">ご利用の流れ</Link><Link href="/#news">お知らせ</Link><Link href="/register">新規登録</Link><Link href="/#login">ログイン</Link></>
              )}
            </div>
            <div>
              <h3>サポート</h3>
              <Link href={member ? "/mypage/contact" : "/contact"}>お問い合わせ</Link>
              {!member && <Link href="/#faq">よくあるご質問</Link>}
              <Link href="/privacy">個人情報保護方針</Link>
              <a href="http://www.vis-a-vis.co.jp/bunka/" target="_blank" rel="noopener noreferrer">運営団体について</a>
            </div>
            <div>
              <h3>デモ</h3>
              {/* 管理画面はCSSが別なので、ページを読み込み直して移動する（通常の <a>） */}
              <a href="/admin/login">管理者ログイン</a>
            </div>
          </div>
        </div>
        <div className="cmn-inner ft-bottom">
          <small>&copy; Vinsight (demo). Operated by 協同組合岡山情報文化研究所.</small>
          <a href="#" className="ft-top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="ページ上部へ">↑ TOP</a>
        </div>
      </footer>
    </div>
  );
}
