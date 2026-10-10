"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/client";
import { Logo } from "./ui";

type Me = { monitor: { id: number; name: string } | null; admin: boolean };

export function SiteShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { api<Me>("/auth/me").then(setMe).catch(() => setMe({ monitor: null, admin: false })); }, [path]);
  useEffect(() => { setOpen(false); }, [path]);

  // header hides on scroll down and returns on scroll up (like the client's header: is-hidden / is-show)
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (Math.abs(y - last) > 8) { setHidden(y > last && y > 160); last = y; }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setHidden(false); if (!window.location.hash) window.scrollTo({ top: 0 }); }, [path]);

  const logout = async () => {
    await api("/auth/logout", { method: "POST", body: {} });
    setMe({ monitor: null, admin: false });
    router.push("/");
  };

  return (
    <div className="site">
      <header className={"s-header" + (hidden && !open ? " is-hidden" : "") + (scrolled ? " is-scrolled" : "")}>
        <div className="h-inner">
          <Logo href={me?.monitor ? "/mypage" : "/"} />
          <div className={"h-link" + (open ? " open" : "")}>
            <ul className="list">
              {me?.monitor ? (
                <>
                  <li><Link href="/mypage">MY PAGE</Link></li>
                  <li><Link href="/mypage/trade">POINT EXCHANGE</Link></li>
                  <li><Link href="/mypage/edit">PROFILE</Link></li>
                  <li><Link href="/privacy">PRIVACY</Link></li>
                  <li><button onClick={logout}>LOGOUT</button></li>
                </>
              ) : (
                <>
                  <li><Link href="/">HOME</Link></li>
                  <li><Link href="/#news">NEWS</Link></li>
                  <li><Link href="/register">REGISTER</Link></li>
                  <li><Link href="/#login">LOGIN</Link></li>
                  <li><Link href="/privacy">PRIVACY</Link></li>
                </>
              )}
            </ul>
            <div className="btn-contact"><Link href={me?.monitor ? "/mypage/contact" : "/contact"}>CONTACT</Link></div>
          </div>
          <button className={"btn-spmenu" + (open ? " on" : "")} aria-label="メニュー" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="s-footer">
        <div className="f-catch">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="dec _l" src="/images/staff01.webp" alt="" />
          <div className="copy">Hello,<br /><em>New</em> Vinsight!<small>アンケートに答えて、地域のおもしろいを一緒につくろう。</small></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="dec _r" src="/images/staff02.webp" alt="" />
        </div>
        <div className="f-conts">
          <div className="cmn-inner" style={{ position: "relative" }}>
            <div className="col">
              <div className="logo"><Logo href="/" /></div>
              <dl className="def">
                <div><dt><Link href="/">HOME</Link></dt></div>
                <div><dt><Link href="/#news">NEWS</Link></dt></div>
                <div><dt><Link href="/register">REGISTER</Link></dt></div>
                <div><dt><Link href="/mypage">MY PAGE</Link></dt><dd><Link href="/mypage/trade">POINT EXCHANGE</Link></dd><dd><Link href="/mypage/edit">PROFILE</Link></dd></div>
                <div><dt><Link href="/contact">CONTACT</Link></dt></div>
                <div><dt><Link href="/privacy">PRIVACY</Link></dt></div>
                <div><dt><a href="http://www.vis-a-vis.co.jp/bunka/" target="_blank" rel="noopener noreferrer">OPERATOR</a></dt></div>
              </dl>
            </div>
            <div className="f-link"><Link href="/privacy">個人情報保護方針</Link><a href="http://www.vis-a-vis.co.jp/bunka/" target="_blank" rel="noopener noreferrer">運営団体について</a><Link href="/admin/login">管理者ログイン（デモ）</Link></div>
            <p className="f-copy"><small>&copy; VIS-À-VIS All Rights Reserved. (Vinsight demo)</small></p>
            <div className="f-pagetop"><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="ページ上部へ">↑</a></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
