"use client";
import { useState } from "react";
import { api, ApiClientError } from "@/lib/client";
import { Alert, Captcha, Pill, Row } from "./ui";

/** 非モニター（一般）用のお問い合わせフォーム（要求事項 No.1）。モニター用フォームは /mypage/contact に分離（No.3）。 */
export default function VisitorInquiry() {
  const [f, setF] = useState({ name: "", company: "", email: "", tel: "", body: "" });
  const [cap, setCap] = useState({ id: "", text: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [capKey, setCapKey] = useState(0);
  const bad = (k: string) => (errors[k] ? "invalid" : "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(""); setErrors({});
    try {
      await api("/inquiries/visitor", { body: { ...f, captchaId: cap.id, captcha: cap.text } });
      setDone(true);
    } catch (err) {
      const ex = err as ApiClientError;
      setErrors(ex.fields); setMsg(ex.message); setCapKey((k) => k + 1);
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <Alert kind="ok">
        お問い合わせを受け付けました。内容を確認のうえ、ご入力のメールアドレス宛にご連絡いたします。<br />
        <button className="btn-sm" style={{ marginTop: 12 }} onClick={() => { setDone(false); setF({ name: "", company: "", email: "", tel: "", body: "" }); setCapKey((k) => k + 1); }}>続けて問い合わせる</button>
      </Alert>
    );
  }
  return (
    <form className="fm" onSubmit={submit} noValidate>
      {msg && <Alert kind="err">{msg}</Alert>}
      <Row label="お名前" required error={errors.name}><input type="text" value={f.name} className={bad("name")} onChange={(e) => setF({ ...f, name: e.target.value })} /></Row>
      <Row label="会社名・団体名" optional><input type="text" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Row>
      <Row label="メールアドレス" required error={errors.email}><input type="email" value={f.email} className={bad("email")} onChange={(e) => setF({ ...f, email: e.target.value })} /></Row>
      <Row label="電話番号" optional><input type="tel" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} placeholder="090-1234-5678" /></Row>
      <Row label="お問い合わせ内容" required error={errors.body}><textarea value={f.body} className={bad("body")} onChange={(e) => setF({ ...f, body: e.target.value })} /></Row>
      <Captcha onChange={(id, text) => setCap({ id, text })} error={errors.captcha} resetKey={capKey} />
      <div className="form-actions"><Pill type="submit" disabled={busy}>送信する</Pill></div>
    </form>
  );
}
