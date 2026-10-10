"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import VisitorInquiry from "@/components/VisitorInquiry";
import { CountUp, Reveal, Skeleton, Wave } from "@/components/fx";
import { Alert, Pill, Row, SectionTitle } from "@/components/ui";
import { api, ApiClientError, fmtDate, useApi } from "@/lib/client";

const STEPS = [
  { c: "_1", no: "01", t: "モニター登録", d: "メールアドレスと基本情報を入力して仮登録。届いたメールのURLから本登録を完了します。", img: "person03" },
  { c: "_2", no: "02", t: "アンケートに回答", d: "あなたの属性に合ったアンケートがマイページに届きます。回答すると謝礼ポイントがたまります。", img: "staff01" },
  { c: "_3", no: "03", t: "ポイントを交換", d: "たまったポイントは、1口500ポイントからギフトに交換できます。", img: "parfait" },
];
const GIFTS = [
  { c: "_1", t: "QUOカードPay", tag: "デジタルギフト", d: "登録メールアドレスにデジタルギフトとして送付されます。" },
  { c: "_2", t: "Amazonギフト券（eメールタイプ）", tag: "デジタルギフト", d: "登録メールアドレスにデジタルギフトとして送付されます。" },
  { c: "_3", t: "たまルンポイント", tag: "たまルンカード会員向け", d: "「たまルンカード会員」の方が利用できます。カード番号の入力が必要です。" },
];
const FAQ: [string, string][] = [
  ["ポイントは何と交換できますか？", "QUOカードPay、Amazonギフト券（eメールタイプ）、たまルンポイントと交換できます。いずれも1口＝500ポイントです。たまルンポイントは「たまルンカード会員」の方のみご利用いただけます。"],
  ["ポイントに有効期限はありますか？", "デモでは、ポイントは獲得日から12か月で失効する設定です（管理画面の「管理者設定」で変更できます）。マイページで失効予定のポイントを確認でき、古いポイントから先に使用されます。"],
  ["パスワードを忘れてしまいました。", "ログイン画面の「パスワードをお忘れの方」から、登録メールアドレス宛に再設定用のURLをお送りします。パスワードそのものをメールでお送りすることはありません。"],
  ["アンケートが届きません。", "アンケートに回答するには基本情報の登録が必要です。マイページの「登録情報の確認・変更」をご確認ください。アンケートは配信条件に合ったモニターに届きます。"],
  ["退会するとどうなりますか？", "退会すると登録情報がすべて削除され、保有ポイントは失効します。退会後に再登録しても、失効したポイントは再発行できません。"],
];

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [openNews, setOpenNews] = useState<number | null>(null);
  const news = useApi<{ items: { id: number; date: string; title: string; body: string }[] }>("/public/news");

  useEffect(() => { api<{ monitor: unknown }>("/auth/me").then((m) => { if (m.monitor) router.replace("/mypage"); }).catch(() => {}); }, [router]);

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
      <Hero marquee="Hello, Vinsight! アンケートに答えて、ポイントをためよう。" />

      <section className="top-beat" id="sec-beat">
        <i className="shape-dot _y" style={{ width: 70, height: 70, left: "6%", top: 70 }} />
        <i className="shape-dot _b" style={{ width: 26, height: 26, left: "14%", bottom: 90, animationDelay: "1s" }} />
        <i className="shape-ring" style={{ width: 64, height: 64, right: "8%", top: 90 }} />
        <i className="shape-dot _o" style={{ width: 40, height: 40, right: "14%", bottom: 60, animationDelay: "2s" }} />
        <div className="cmn-inner">
          <div className="conts">
            <div className="col">
              <Reveal className="text-box">
                <h2 className="ttl">あなたの声が、<br /><em>地域のおもしろい</em>をつくる。</h2>
                <p className="text">
                  Vinsight（ヴィンサイト）は、アンケートへのご回答を通じて、地域や企業の「いま」を知るためのモニターサイトです。<br />
                  回答するとポイントがたまり、QUOカードPay・Amazonギフト券・たまルンポイントと交換できます。<br />
                  まずはモニター登録から始めましょう。
                </p>
                <Pill href="/register" variant="orange" left>View More</Pill>
              </Reveal>
              <Reveal className="img-box" delay={150}>
                <div className="blob" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/monitor.webp" alt="" />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <Wave from="#fff" to="#fcc800" />
      <section className="top-stats" aria-label="Vinsightの数字">
        <i className="shape-dot _o" style={{ width: 120, height: 120, left: -40, top: -30, opacity: .9 }} />
        <i className="shape-dot _b" style={{ width: 64, height: 64, right: "6%", bottom: 20, animationDelay: "1.5s" }} />
        <div className="cmn-inner">
          <div className="stats-grid">
            <div className="stat"><div className="num jost"><CountUp to={3810} /><small>名</small></div><div className="lbl">登録モニター</div></div>
            <div className="stat"><div className="num jost"><CountUp to={597} /><small>件</small></div><div className="lbl">実施アンケート</div></div>
            <div className="stat"><div className="num jost"><CountUp to={5835} /><small>件</small></div><div className="lbl">ポイント交換</div></div>
          </div>
          <p className="stat" style={{ textAlign: "center", marginTop: 22 }}><span className="note">※数値はデモ用のダミー表示です。</span></p>
        </div>
      </section>
      <Wave from="#fcc800" to="#fff" />

      <section className="top-steps">
        <div className="cmn-inner">
          <Reveal><SectionTitle en="HOW IT WORKS" jp="ご利用の流れ" /></Reveal>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.no} delay={i * 120}>
                <div className={`step ${s.c}`}>
                  <div className="pic"><img src={`/images/${s.img}.webp`} alt="" style={{ width: "auto", height: "82%" }} /></div>
                  <div className="no">{s.no}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="top-gifts">
        <div className="cmn-inner">
          <Reveal><SectionTitle en="GIFT" jp="ポイント交換できるもの" /></Reveal>
          <div className="gifts">
            {GIFTS.map((g, i) => (
              <Reveal key={g.t} delay={i * 120}>
                <div className={`gift ${g.c}`}>
                  <span className="tag">{g.tag}</span>
                  <h3>{g.t}</h3>
                  <div className="pt">500<small>pt / 1口</small></div>
                  <p>{g.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#fff" to="#f4f2f2" />
      <section className="top-login" id="login">
        <i className="shape-dot _y" style={{ width: 90, height: 90, right: "-20px", top: 40, opacity: .8 }} />
        <i className="shape-dot _g" style={{ width: 34, height: 34, left: "5%", bottom: 90, animationDelay: "1s" }} />
        <div className="cmn-inner">
          <Reveal><SectionTitle en="LOGIN" jp="モニターログイン／新規登録" /></Reveal>
          <div className="login-grid">
            <Reveal>
              <div className="panel" style={{ height: "100%" }}>
                <h3>Login<small>登録済みのモニターの方</small></h3>
                <form className="fm" onSubmit={login} noValidate style={{ marginTop: 22 }}>
                  {err && <Alert kind="err">{err}</Alert>}
                  <Row label="メールアドレス または モニター番号"><input type="text" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Row>
                  <Row label="パスワード"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Row>
                  <div className="form-actions" style={{ justifyContent: "flex-start" }}><Pill type="submit" short disabled={busy}>{busy ? "確認中…" : "ログイン"}</Pill></div>
                  <div className="hint"><Link href="/password-reset" style={{ textDecoration: "underline" }}>パスワードをお忘れの方はこちら</Link>（再設定用のURLをメールでお送りします）</div>
                </form>
                <div className="demo-note">
                  <b>デモ用ログイン情報</b><br />
                  モニター：<b>demo@vinsight.example</b> ／ <b>monitor123</b>（モニター番号 1001）<br />
                  管理画面：<Link href="/admin/login" style={{ textDecoration: "underline" }}>/admin/login</Link>（<b>admin</b> ／ <b>admin123</b>）
                  <br /><button type="button" className="btn-sm" style={{ marginTop: 8 }} onClick={() => { setEmail("demo@vinsight.example"); setPassword("monitor123"); }}>入力する</button>
                </div>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="panel _yellow" style={{ height: "100%" }}>
                <h3>Register<small>はじめての方</small></h3>
                <p className="lead">モニター登録をすると、あなたに合ったアンケートが届きます。</p>
                <ul className="points">
                  <li>アンケートに回答してポイントをためられます</li>
                  <li>ポイントは QUOカードPay・Amazonギフト券・たまルンポイントと交換できます</li>
                  <li>新着情報はメールでもお知らせします</li>
                </ul>
                <Pill href="/register" variant="orange" short>新規登録</Pill>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="top-news" id="news">
        <div className="cmn-inner">
          <div className="col">
            <Reveal className="ttl-box"><SectionTitle en="News" jp="お知らせ" /></Reveal>
            <Reveal className="list-box" delay={120}>
              {news.loading && <div className="skel-wrap">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={54} />)}</div>}
              {news.data && news.data.items.length === 0 && <p>現在お知らせはありません。</p>}
              <ul className="news-list">
                {news.data?.items.map((n) => (
                  <li key={n.id}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setOpenNews(openNews === n.id ? null : n.id); }} aria-expanded={openNews === n.id}>
                      <span className="date">{fmtDate(n.date)}</span><span className="tit">{n.title}</span>
                    </a>
                    {openNews === n.id && <div className="news-open">{n.body}</div>}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="top-faq" id="faq">
        <div className="cmn-inner">
          <Reveal><SectionTitle en="FAQ" jp="よくあるご質問" /></Reveal>
          <Reveal delay={100}>
            <div className="faq">
              {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><div>{a}</div></details>)}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="top-contact" id="contact">
        <div className="cmn-inner">
          <div className="contact-wrap">
            <Reveal className="side">
              <SectionTitle en="CONTACT" jp="お問い合わせ（モニター以外の方）" />
              <p style={{ marginTop: 16, fontSize: "1.4rem", lineHeight: 1.9 }}>モニター登録やサイトについてのご質問はこちらからお問い合わせください。<br />すでにモニターの方は、ログイン後の「マイページ」内のお問い合わせフォームをご利用ください。</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="float-y" src="/images/person02.webp" alt="" />
            </Reveal>
            <Reveal className="form" delay={120}><VisitorInquiry /></Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
