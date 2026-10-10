"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { MyPageCtx, type MyPageData } from "@/components/MypageContext";
import { Skeleton } from "@/components/fx";
import { Pill } from "@/components/ui";
import { fmtDate, fmtDT, useApi, yen } from "@/lib/client";

export default function MypageLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { data, error, reload } = useApi<MyPageData>("/mypage", [path]);

  useEffect(() => { if (error?.status === 401) router.replace("/#login"); }, [error, router]);
  if (!data) {
    if (error && error.status !== 401) return <div className="cmn-inner" style={{ padding: "120px 24px" }}>{error.message}</div>;
    return (
      <div className="cmn-inner mp" aria-busy="true" aria-label="読み込み中">
        <div className="mp-grid">
          <div className="side-panel"><div className="skel-wrap"><Skeleton h={22} w="60%" /><Skeleton h={44} w="80%" /><Skeleton h={56} /><Skeleton h={46} r={30} /><Skeleton h={120} /></div></div>
          <div className="skel-wrap"><Skeleton h={190} r={28} /><Skeleton h={30} w="30%" /><Skeleton h={260} /></div>
        </div>
      </div>
    );
  }

  const m = data.monitor;
  const ex = data.expiry;
  return (
    <MyPageCtx.Provider value={{ data, reload }}>
      <div className="cmn-inner mp">
        <div className="mp-grid">
          <aside className="side-panel" aria-label="マイページメニュー">
            <div className="mno">あなたのモニター番号<b>{m.id}</b></div>
            <div className="mno" style={{ marginTop: 4 }}>{m.name} 様</div>
            <div className="pt">現在の謝礼ポイント<b>{yen(m.points)}<span>point</span></b></div>
            {ex.months > 0 && (
              <div className={"exp" + (ex.soonTotal > 0 ? " warn" : "")}>
                ポイント有効期限：獲得日から{ex.months}か月
                {ex.nextExpiry && <><br />次の失効：<b>{yen(ex.nextExpiry.points)}pt</b>（{fmtDate(ex.nextExpiry.expiresAt)}）</>}
                {ex.soonTotal > 0 && <><br /><b style={{ color: "var(--red)" }}>60日以内に失効予定：{yen(ex.soonTotal)}pt</b></>}
              </div>
            )}
            <div className="lastlogin">前回ログイン：{m.prevLoginAt ? fmtDT(m.prevLoginAt) : "初めてのログイン"}</div>
            <Pill href="/mypage/trade">ポイント交換申込み</Pill>
            <h4>会員モニター様用メニュー</h4>
            <ul className="menu">
              <li><Link href="/mypage" className={path === "/mypage" ? "on" : ""}>マイページトップ</Link></li>
              <li><Link href="/mypage/edit" className={path.startsWith("/mypage/edit") ? "on" : ""}>登録情報の確認・変更</Link></li>
              <li><Link href="/mypage/contact" className={path.startsWith("/mypage/contact") ? "on" : ""}>お問い合わせ</Link></li>
              <li><Link href="/mypage/secession" className={path.startsWith("/mypage/secession") ? "on" : ""}>退会</Link></li>
            </ul>
          </aside>
          <div className="mp-main">{children}</div>
        </div>
      </div>
    </MyPageCtx.Provider>
  );
}
