"use client";
import Link from "next/link";
import { useState } from "react";
import { useMyPage } from "@/components/MypageContext";
import { Alert, Pill, Row, SectionTitle } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

/** モニター専用のお問い合わせフォーム（要求事項 No.3）。モニター情報が表示され、運営側にも一緒に届く。 */
export default function MonitorContact() {
  const { data } = useMyPage();
  const [company, setCompany] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [fe, setFe] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  if (!data) return null;
  const m = data.monitor;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setFe({});
    try { await api("/mypage/inquiry", { body: { company, body } }); setDone(true); }
    catch (ex) { const x = ex as ApiClientError; setErr(x.message); setFe(x.fields); }
  };
  if (done) return <div className="done-box"><h2>お問い合わせを受け付けました</h2><p>内容を確認のうえ、ご登録のメールアドレス宛にご連絡いたします。</p><Pill href="/mypage">マイページへ戻る</Pill></div>;
  return (
    <section>
      <div className="crumb" style={{ fontSize: "1.3rem", color: "#525252", marginBottom: 18 }}><Link href="/mypage" style={{ textDecoration: "underline" }}>マイページ</Link> ＞ お問い合わせ</div>
      <SectionTitle small en="Contact" jp="お問い合わせ（モニター専用）" />
      <form className="fm" onSubmit={submit} noValidate style={{ marginTop: 20 }}>
        {err && <Alert kind="err">{err}</Alert>}
        <div className="monitor-info" aria-label="送信されるモニター情報">
          <div><b>モニター番号</b>{m.id}</div><div><b>氏名</b>{m.name}</div><div><b>メールアドレス</b>{m.email}</div><div><b>電話番号</b>{m.tel}</div>
        </div>
        <div className="hint">上記のモニター情報が、お問い合わせ内容と一緒に運営へ送信されます。</div>
        <Row label="会社名・団体名" optional><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} /></Row>
        <Row label="お問い合わせ内容" required error={fe.body}><textarea value={body} className={fe.body ? "invalid" : ""} onChange={(e) => setBody(e.target.value)} /></Row>
        <div className="form-actions"><Pill type="submit">送信する</Pill></div>
      </form>
    </section>
  );
}
