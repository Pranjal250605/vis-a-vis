"use client";
import Link from "next/link";
import { AdminPage, BarChart, Icon, Panel, StatusPill } from "@/components/admin";
import { fmtDT, useApi } from "@/lib/client";

const MENU = [
  { code: "A", href: "/admin/surveys", t: "アンケート管理", d: "アンケート一覧・新規登録・コピー・テスト配信・設問・配信条件・CSV出力", sub: "A-1 / A-2", icon: "survey" },
  { code: "B", href: "/admin/news", t: "新着情報管理", d: "新着情報の登録・個別配信・公開時のメール同時配信", sub: "B-1", icon: "news" },
  { code: "C", href: "/admin/trades", t: "ポイント交換管理", d: "申請一覧（検索・並べ替え・CSV）と発送処理", sub: "C-1", icon: "gift" },
  { code: "P", href: "/admin/points/grant", t: "ポイント付与（新設）", d: "管理者による手動付与とポイント付与一覧", sub: "NEW", isNew: true, icon: "coin" },
  { code: "D", href: "/admin/monitors", t: "モニター管理", d: "検索・並べ替え・モニター情報の編集・CSV出力/取込", sub: "D-1", icon: "users" },
  { code: "E", href: "/admin/sample", t: "サンプル数調査", d: "属性条件に合致するモニター数を調査", sub: "E-1", icon: "chart" },
  { code: "F", href: "/admin/withdrawals", t: "退会管理", d: "退会理由の一覧（退会日時の降順）", sub: "F-1", icon: "exit" },
  { code: "G", href: "/admin/settings", t: "設定", d: "管理者設定・メール文章設定", sub: "G-1 / G-2", icon: "sliders" },
  { code: "+", href: "/admin/inquiries", t: "お問い合わせ（新設）", d: "モニター／非モニターのお問い合わせ受信箱", sub: "NEW", isNew: true, icon: "inbox" },
  { code: "✓", href: "/admin/requirements", t: "要求事項 対応状況", d: "35項目の要求事項と、このデモでの実装箇所", sub: "DEMO", isNew: true, icon: "check" },
];

export default function Dashboard() {
  const { data: d } = useApi<any>("/admin/dashboard");
  if (!d) return null;
  const todo = d.tradesUnshipped + d.inquiriesOpen;
  return (
    <AdminPage title="TOPメニュー" crumbs="管理者専用メニュー">
      <div className="dash-hero">
        <div>
          <h2>おつかれさまです、管理者さん</h2>
          <p>{todo > 0 ? <>未発送のポイント交換が <b>{d.tradesUnshipped}件</b>、未対応のお問い合わせが <b>{d.inquiriesOpen}件</b> あります。</> : "対応が必要なタスクはありません。"}</p>
          <div className="btns" style={{ marginTop: 14, position: "relative", zIndex: 1 }}>
            <Link href="/admin/trades?status=未発送" className="btn">未発送を確認</Link>
            <Link href="/admin/inquiries" className="btn line">お問い合わせを見る</Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/staff01.webp" alt="" />
      </div>

      <div className="tiles">
        <Link href="/admin/surveys?status=配信中" className="tile"><div className="k">配信中のアンケート</div><div className="v">{d.surveys["配信中"]}<small>/ {d.surveyTotal}件</small></div></Link>
        <Link href="/admin/trades?status=未発送" className={"tile" + (d.tradesUnshipped ? " warn" : "")}><div className="k">未発送のポイント交換</div><div className="v">{d.tradesUnshipped}<small>/ {d.tradesTotal}件</small></div></Link>
        <Link href="/admin/monitors" className="tile"><div className="k">有効モニター</div><div className="v">{d.monitorsValid}<small>/ {d.monitorsTotal}名</small></div></Link>
        <Link href="/admin/sample" className="tile"><div className="k">有効会員（90日以内に回答）</div><div className="v">{d.activeMembers}<small>名</small></div></Link>
        <Link href="/admin/inquiries" className={"tile" + (d.inquiriesOpen ? " warn" : "")}><div className="k">未対応のお問い合わせ</div><div className="v">{d.inquiriesOpen}<small>件</small></div></Link>
        <Link href="/admin/withdrawals" className="tile"><div className="k">退会者数</div><div className="v">{d.withdrawals}<small>名</small></div></Link>
      </div>

      <div className="cols c2" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <Panel title="月別の回答数" sub="直近6か月（ダミーデータ）">
          <BarChart label="直近6か月の月別アンケート回答数" unit="件" data={d.answersByMonth.map((a: any) => ({ label: `${Number(a.month.slice(5))}月`, value: a.count }))} />
        </Panel>
        <Panel title="配信中アンケートの回答率">
          {d.topSurveys.length === 0 ? <div className="empty">配信中のアンケートはありません。</div> : (
            <div className="toplist">
              {d.topSurveys.map((s: any) => (
                <div className="it" key={s.id}>
                  <Link href={`/admin/surveys/${s.id}`}>{s.title}</Link><span className="pc">{s.answerRate}%</span>
                  <div className="bar" role="img" aria-label={`回答率 ${s.answerRate}%`}><i style={{ width: `${Math.min(100, s.answerRate)}%` }} /></div>
                  <span className="sub">回答 {s.answerCount} / 目標 {s.sampleTarget}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="menu-cards">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="menu-card"><i className={m.isNew ? "new" : ""}>{m.sub}</i><b style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon n={m.icon} s={18} />{m.t}</b><span>{m.d}</span></Link>
        ))}
      </div>

      <div className="cols c2">
        <Panel title="直近のお問い合わせ">
          {d.recentInquiries.length === 0 ? <div className="empty">お問い合わせはありません。</div> : (
            <div className="tbl-wrap"><table className="tbl"><tbody>{d.recentInquiries.map((i: any) => (
              <tr key={i.id}><td>{fmtDT(i.at)}</td><td><span className="pill">{i.kind}</span></td><td>{i.name}<span className="sub">{i.body.slice(0, 40)}</span></td><td><StatusPill s={i.status} /></td></tr>
            ))}</tbody></table></div>
          )}
        </Panel>
        <Panel title="直近のポイント交換申請">
          <div className="tbl-wrap"><table className="tbl"><tbody>{d.recentTrades.map((t: any) => (
            <tr key={t.id}><td>{fmtDT(t.appliedAt)}</td><td>{t.monitorId}<span className="sub">{t.name}</span></td><td>{t.itemsText}</td><td><StatusPill s={t.status} /></td></tr>
          ))}</tbody></table></div>
        </Panel>
      </div>
    </AdminPage>
  );
}
