"use client";
import Link from "next/link";
import { SectionTitle } from "@/components/ui";
import { fmtDate, fmtDT, yen } from "@/lib/client";
import { SURVEY_TYPES } from "@/lib/constants";
import { useMyPage } from "@/components/MypageContext";

export default function MyPageTop() {
  const { data } = useMyPage();
  if (!data) return null;
  const { news, surveys, trades, expiry } = data;

  // アンケート種別ごとに表示を分ける（要求事項 No.5：「事前アンケート」「本アンケート」など）
  const groups = (SURVEY_TYPES as readonly string[]).map((t) => ({ type: t, rows: surveys.filter((s) => s.type === t) })).filter((g) => g.rows.length);
  const open = surveys.filter((s) => s.state === "回答する").length;

  const m = data.monitor;
  const unit = 500;
  const toNext = unit - (m.points % unit);
  const pct = Math.round(((m.points % unit) / unit) * 100);
  const hour = new Date().getHours();
  const greet = hour < 5 ? "こんばんは" : hour < 11 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";

  return (
    <>
      <div className="mp-hero">
        <div>
          <div className="hi">WELCOME BACK</div>
          <h2>{greet}、{m.name}さん</h2>
          <p>{open > 0 ? <>回答できるアンケートが <b className="jost" style={{ fontSize: "2rem" }}>{open}</b> 件あります。</> : "現在、回答受付中のアンケートはありません。"}</p>
          <div className="goal" aria-label="次の1口までのポイント">
            <div className="row"><span>{m.points >= unit ? `${Math.floor(m.points / unit)}口分 交換できます` : "ポイントをためよう"}</span><span>次の1口まで あと {toNext} pt</span></div>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="acts">
            {open > 0 && <a href="#survey">アンケートに回答する →</a>}
            <Link href="/mypage/trade" className="sub">ポイント交換へ</Link>
            <Link href="/mypage/edit" className="sub">登録情報へ</Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/staff02.webp" alt="" />
      </div>

      <section id="news" style={{ scrollMarginTop: 96 }}>
        <SectionTitle small en="News" jp="新着情報" />
        {news.length === 0 ? <div className="empty">現在お知らせはありません。</div> : (
          <ul className="mp-news">
            {news.map((n) => (
              <li key={n.id}>
                <Link href={`/mypage/topics/${n.id}`}>
                  <span className="date jost" style={{ width: 96, flex: "none", fontWeight: 500 }}>{fmtDate(n.date)}</span>
                  <span style={{ fontWeight: 500 }}>{n.title}{n.individual && <span className="badge" style={{ marginLeft: 8, padding: "0 10px", borderRadius: 20, background: "var(--orange)", color: "#fff", fontSize: "1.1rem", fontWeight: 700, lineHeight: "20px", display: "inline-block" }}>あなたへのご案内</span>}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="survey" style={{ scrollMarginTop: 96 }}>
        <SectionTitle small en="Survey" jp="あなたに届いているアンケート" />
        <p style={{ fontSize: "1.4rem", marginBottom: 14 }}>{open > 0 ? <>現在 <b>{open}件</b> のアンケートに回答できます。</> : "現在、回答受付中のアンケートはありません。"}</p>
        {groups.length === 0 && <div className="empty">表示できるアンケートはありません。</div>}
        {groups.map((g, i) => (
          <details className="accordion" key={g.type} open={i < 2 || g.rows.some((r) => r.state === "回答する")}>
            <summary><span>{g.type}<span className="tag">{g.rows.length}件</span></span></summary>
            <table className="tbl">
              <thead><tr><th>日付</th><th>アンケートNo</th><th>種類</th><th>タイトル</th><th className="num">謝礼ポイント</th><th>回答状況</th></tr></thead>
              <tbody>
                {g.rows.map((s) => (
                  <tr key={s.id}>
                    <td className="jost">{fmtDate(s.date)}</td><td className="jost">{s.id}</td>
                    <td><span className="state">{s.type.replace("アンケート", "")}</span></td>
                    <td>{s.title}</td>
                    <td className="num">{s.points ? yen(s.points) : "－"}</td>
                    <td>
                      {s.state === "回答する" ? <Link className="btn-sm" href={`/mypage/survey/${s.id}`}>回答する</Link>
                        : <span className={"state " + (s.state === "回答済み" ? "_done" : "_end")}>{s.state}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </section>

      <section>
        <SectionTitle small en="Exchange" jp="謝礼ポイント交換状況" />
        {trades.length === 0 ? <div className="empty">現在謝礼ポイント交換申請はありません。</div> : (
          <table className="tbl">
            <thead><tr><th>申請日</th><th>交換商品</th><th className="num">消費ポイント</th><th>状態</th></tr></thead>
            <tbody>{trades.map((t) => (
              <tr key={t.id}><td className="jost">{fmtDT(t.appliedAt)}</td><td>{t.items.map((i) => `${i.item} ${i.units}口`).join(" / ")}</td><td className="num">{yen(t.pointsUsed)}</td><td><span className="state _go">{t.status}</span></td></tr>
            ))}</tbody>
          </table>
        )}
      </section>

      {expiry.months > 0 && (
        <section>
          <SectionTitle small en="Point Expiry" jp="ポイントの有効期限" />
          {expiry.lots.length === 0 ? <div className="empty">有効期限のあるポイントはありません。</div> : (
            <table className="tbl">
              <thead><tr><th className="num">ポイント</th><th>有効期限</th><th>備考</th></tr></thead>
              <tbody>{expiry.lots.slice(0, 8).map((l, i) => {
                const soon = l.expiresAt && new Date(l.expiresAt).getTime() - Date.now() <= 60 * 86400000;
                return <tr key={i}><td className="num">{yen(l.points)} pt</td><td className="jost">{fmtDate(l.expiresAt)}</td><td>{soon ? <span className="state _go">まもなく失効</span> : ""}</td></tr>;
              })}</tbody>
            </table>
          )}
          <p style={{ fontSize: "1.25rem", color: "#525252", marginTop: 8 }}>※ポイントは獲得日から{expiry.months}か月で失効します。古いポイントから先に使用されます。</p>
        </section>
      )}
    </>
  );
}
