"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VisitorInquiry from "@/components/VisitorInquiry";
import { CountUp, Reveal, Skeleton } from "@/components/fx";
import { Alert, Pill, Row, SectionTitle } from "@/components/ui";
import { api, ApiClientError, fmtDate, useApi } from "@/lib/client";

const FEATURES = [
  { no: "01", c: "sun", t: "あなたに合った\nアンケートが届く", d: "年齢・お住まい・関心などの登録情報にあわせて、回答できるアンケートがマイページに届きます。", wide: true },
  { no: "02", c: "sky", t: "回答するたびに\nポイントがたまる", d: "謝礼ポイントはアンケートごとに設定されています。" },
  { no: "03", c: "amber", t: "500ポイントから\nギフトに交換", d: "QUOカードPay・Amazonギフト券・たまルンポイント。" },
  { no: "04", c: "mint", t: "新着情報は\nメールでもお知らせ", d: "サイトを開かなくても、大切なお知らせやアンケートの案内に気づけます。", wide: true },
];
const STEPS = [
  { no: "01", t: "モニター登録", d: "メールアドレスと基本情報を入力して仮登録。届いたメールのURLから本登録を完了します。", cta: { href: "/register", label: "新規登録へ" } },
  { no: "02", t: "アンケートに回答", d: "あなたの属性に合ったアンケートがマイページに届きます。回答すると、謝礼ポイントがたまります。", cta: { href: "/#login", label: "ログイン" } },
  { no: "03", t: "ギフトに交換", d: "たまったポイントは、1口500ポイントからギフトに交換できます。", cta: { href: "/#gift", label: "交換できるギフトを見る" } },
];
const GIFTS = [
  { c: "navy", t: "QUOカードPay", tag: "デジタルギフト", d: "登録メールアドレスにデジタルギフトとして送付されます。" },
  { c: "mint", t: "Amazonギフト券", sub: "eメールタイプ", tag: "デジタルギフト", d: "登録メールアドレスにデジタルギフトとして送付されます。" },
  { c: "amber", t: "たまルンポイント", tag: "たまルンカード会員向け", d: "「たまルンカード会員」の方が利用できます。カード番号の入力が必要です。" },
];
const FAQ: [string, string][] = [
  ["ポイントは何と交換できますか？", "QUOカードPay、Amazonギフト券（eメールタイプ）、たまルンポイントと交換できます。いずれも1口＝500ポイントです。たまルンポイントは「たまルンカード会員」の方のみご利用いただけます。"],
  ["ポイントに有効期限はありますか？", "デモでは、ポイントは獲得日から12か月で失効する設定です（管理画面の「管理者設定」で変更できます）。マイページで失効予定のポイントを確認でき、古いポイントから先に使用されます。"],
  ["パスワードを忘れてしまいました。", "ログイン画面の「パスワードをお忘れの方」から、登録メールアドレス宛に再設定用のURLをお送りします。パスワードそのものをメールでお送りすることはありません。"],
  ["アンケートが届きません。", "アンケートに回答するには基本情報の登録が必要です。マイページの「登録情報の確認・変更」をご確認ください。アンケートは配信条件に合ったモニターに届きます。"],
  ["退会するとどうなりますか？", "退会すると登録情報がすべて削除され、保有ポイントは失効します。退会後に再登録しても、失効したポイントは再発行できません。"],
];

type NewsItem = { id: number; date: string; title: string; body: string };

export default function Landing() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [openNews, setOpenNews] = useState<number | null>(null);
  const news = useApi<{ items: NewsItem[] }>("/public/news");

  const [expired, setExpired] = useState(false);
  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get("expired") === "1");
    api<{ monitor: unknown }>("/auth/me").then((m) => { if (m.monitor) router.replace("/mypage"); }).catch(() => {});
  }, [router]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("/auth/login", { body: { email, password } });
      router.push("/mypage");
    } catch (ex) { setErr((ex as ApiClientError).message); } finally { setBusy(false); }
  };

  return (
    <>
      {/* ───────── HERO: message on the left, login on the right ───────── */}
      <section className="hero">
        <div className="cmn-inner hero-in">
          <div className="hero-copy">
            <h1>アンケートに答えて、<br />ポイントをためよう。</h1>
            <p>Vinsight（ヴィンサイト）は、アンケートへのご回答を通じて、地域や企業の「いま」を知るためのモニターサイトです。たまったポイントは、デジタルギフトに交換できます。</p>
            <dl className="hero-stats" aria-label="Vinsightの数字（デモ用のダミー値）">
              <div><dt>登録モニター</dt><dd><CountUp to={3810} /><small>名</small></dd></div>
              <div><dt>実施アンケート</dt><dd><CountUp to={597} /><small>件</small></dd></div>
              <div><dt>ポイント交換</dt><dd><CountUp to={5835} /><small>件</small></dd></div>
            </dl>
          </div>
            <div className="auth" id="login">
              <div className="auth-form">
                <div className="tabs-u" role="tablist" aria-label="ログインまたは新規登録">
                  <button role="tab" aria-selected={tab === "login"} className={tab === "login" ? "on" : ""} onClick={() => setTab("login")} type="button">ログイン</button>
                  <button role="tab" aria-selected={tab === "register"} className={tab === "register" ? "on" : ""} onClick={() => setTab("register")} type="button">はじめての方</button>
                </div>
                {tab === "login" ? (
                  <form className="fm" onSubmit={login} noValidate>
                    {expired && !err && <Alert kind="info">ログインの有効期限が切れました（またはログアウトされました）。お手数ですが、もう一度ログインしてください。</Alert>}
                    {err && <Alert kind="err">{err}</Alert>}
                    <Row label="メールアドレス または モニター番号"><input type="text" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Row>
                    <Row label="パスワード"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Row>
                    <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: 4 }}><Pill type="submit" disabled={busy}>{busy ? "確認中…" : "ログインする"}</Pill></div>
                    <div className="hint"><Link href="/password-reset" style={{ textDecoration: "underline" }}>パスワードをお忘れの方はこちら</Link>（再設定用のURLをメールでお送りします）</div>
                    <div className="demo-note">
                      <b>デモ用ログイン情報</b><br />
                      モニター：<b>demo@vinsight.example</b> ／ <b>monitor123</b>（モニター番号 1001）<br />
                      管理画面：<a href="/admin/login" style={{ textDecoration: "underline" }}>/admin/login</a>（<b>admin</b> ／ <b>admin123</b>）
                      <br /><button type="button" className="btn-sm" style={{ marginTop: 8 }} onClick={() => { setEmail("demo@vinsight.example"); setPassword("monitor123"); }}>入力する</button>
                    </div>
                  </form>
                ) : (
                  <div className="au-reg">
                    <h3>モニター登録をはじめよう</h3>
                    <p>登録すると、あなたに合ったアンケートが届きます。</p>
                    <ul>
                      <li>アンケートに回答してポイントをためられます</li>
                      <li>ポイントは QUOカードPay・Amazonギフト券・たまルンポイントと交換できます</li>
                      <li>新着情報はメールでもお知らせします</li>
                    </ul>
                    <Pill href="/register" left>新規登録へ進む</Pill>
                  </div>
                )}
              </div>
            </div>
        </div>
      </section>

      {/* ───────── FLOW ───────── */}
      <section className="sec" id="flow">
        <div className="cmn-inner">
          <Reveal className="sec-head"><SectionTitle en="FLOW" jp="ご利用の流れ" /></Reveal>
          <ol className="flow-list">
            {STEPS.map((st) => (
              <li key={st.no} className="flow-step">
                <span className="flow-no">{st.no}</span>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
                <Link className="tlink" href={st.cta.href}>{st.cta.label}<span aria-hidden="true">→</span></Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section className="sec" id="about">
        <div className="cmn-inner">
          <Reveal className="sec-head">
            <SectionTitle en="ABOUT" jp="あなたの声が、地域のおもしろいをつくる。" />
            <p>回答するほどポイントがたまり、ギフトに交換できる。Vinsightは、モニターのみなさんの声で成り立っています。</p>
          </Reveal>
          <div className="feat">
            {FEATURES.map((f, i) => (
              <Reveal key={f.no} delay={(i % 2) * 100} className={`fc fc-${f.c}${f.wide ? " wide" : ""}`}>
                <span className="fc-no">{f.no}</span>
                <div className="fc-tx"><h3>{f.t.split("\n").map((l, k) => <span key={k}>{l}<br /></span>)}</h3><p>{f.d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── GIFTS ───────── */}
      <section className="sec" id="gift">
        <div className="cmn-inner">
          <Reveal className="sec-head"><SectionTitle en="GIFT" jp="たまったポイントは、ギフトに。" /></Reveal>
          <div className="gifts">
            {GIFTS.map((g, i) => (
              <Reveal key={g.t} delay={i * 110} className={`gc gc-${g.c}`}>
                <span className="gc-tag">{g.tag}</span>
                <h3>{g.t}{g.sub && <small>{g.sub}</small>}</h3>
                <p>{g.d}</p>
                <span className="gc-unit"><b>500</b> pt <i>/ 1口</i></span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── NEWS ───────── */}
      <section className="sec" id="news">
        <div className="cmn-inner news-grid">
          <Reveal className="news-head">
            <SectionTitle en="NEWS" jp="お知らせ" />
            <p>サービスの最新情報をお届けします。</p>
          </Reveal>
          <Reveal delay={100}>
            <ul className="nlist">
              {news.loading && [0, 1, 2, 3].map((i) => <li key={i}><Skeleton h={62} r={12} style={{ margin: "10px 0" }} /></li>)}
              {news.data && news.data.items.length === 0 && <li className="nl-empty">現在お知らせはありません。</li>}
              {news.data?.items.map((n) => (
                <li key={n.id} className={openNews === n.id ? "open" : ""}>
                  <button type="button" onClick={() => setOpenNews(openNews === n.id ? null : n.id)} aria-expanded={openNews === n.id}>
                    <span className="nl-date">{fmtDate(n.date)}</span>
                    <span className="nl-t">{n.title}</span>
                    <span className="nl-pl" aria-hidden="true" />
                  </button>
                  {openNews === n.id && <div className="nl-body">{n.body}</div>}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="sec" id="faq">
        <div className="cmn-inner faq-grid">
          <Reveal className="faq-head"><SectionTitle en="FAQ" jp="よくあるご質問" /></Reveal>
          <Reveal delay={100}>
            <div className="faq3">
              {FAQ.map(([q, a], i) => (
                <details key={q}><summary><span className="n">0{i + 1}</span><span className="qt">{q}</span><span className="pl" aria-hidden="true" /></summary><div>{a}</div></details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── CONTACT ───────── */}
      <section className="contact" id="contact">
        <div className="cmn-inner ct">
          <Reveal className="ct-side">
            <SectionTitle en="CONTACT" jp="モニター以外の方のお問い合わせ" />
            <p>モニター登録やサイトについてのご質問はこちらから。すでにモニターの方は、ログイン後の「マイページ」内のお問い合わせフォームをご利用ください。</p>
          </Reveal>
          <Reveal delay={120}><div className="ct-card"><VisitorInquiry /></div></Reveal>
        </div>
      </section>
    </>
  );
}
