"use client";
import Link from "next/link";
import { useState } from "react";
import { ProfileFields, emptyProfile, profilePayload, type ProfileForm } from "@/components/ProfileFields";
import { Alert, Captcha, Pill, SectionTitle } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function Register() {
  const [v, setV] = useState<ProfileForm>(emptyProfile());
  const [agree, setAgree] = useState(false);
  const [cap, setCap] = useState({ id: "", text: "" });
  const [capKey, setCapKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: number; registUrl: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(""); setErrors({});
    try {
      const r = await api<{ id: number; registUrl: string }>("/register", { body: { ...profilePayload(v), agree, captchaId: cap.id, captcha: cap.text } });
      setDone(r);
      window.scrollTo({ top: 0 });
    } catch (ex) {
      const x = ex as ApiClientError;
      setErrors(x.fields); setMsg(x.message); setCapKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="cmn-inner">
        <div className="done-box">
          <h2>仮登録が完了しました</h2>
          <p>ご登録のメールアドレス宛に「仮登録完了メール」をお送りしました。<br />メール内のURLにアクセスして、本登録を完了してください。</p>
          <div className="demo-note" style={{ maxWidth: 640, margin: "26px auto 0", textAlign: "left" }}>
            <b>デモ用</b>：実際にはメールは送信されません（管理画面の「送信メール履歴」に記録されます）。<br />
            本登録URL：<Link href={done.registUrl.replace(/^https?:\/\/[^/]+/, "")} style={{ textDecoration: "underline", wordBreak: "break-all" }}>{done.registUrl}</Link>
          </div>
          <Pill href={done.registUrl.replace(/^https?:\/\/[^/]+/, "")}>本登録を完了する（デモ）</Pill>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/person03.webp" alt="" />
        </div>
      </div>
    );
  }

  return (
    <div className="cmn-inner" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div className="crumb"><Link href="/">HOME</Link> ＞ モニター新規登録</div>
        <SectionTitle en="Register" jp="モニター新規登録" />
        <p style={{ marginTop: 14, fontSize: "1.4rem" }}>以下のフォームにご入力ください。<span style={{ color: "var(--red)", fontWeight: 700 }}>必須</span>の項目は必ずご入力ください。</p>
      </div>
      <form className="card fm" onSubmit={submit} noValidate style={{ marginTop: 24 }}>
        {msg && <Alert kind="err">{msg}</Alert>}
        <ProfileFields v={v} set={(p) => setV({ ...v, ...p })} errors={errors} credentials />
        <div className="sect">確認<small>CONFIRM</small></div>
        <div>
          <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span><Link href="/privacy" target="_blank" style={{ textDecoration: "underline" }}>個人情報保護方針</Link>に同意する</span></label>
          {errors.agree && <div className="err">{errors.agree}</div>}
        </div>
        <Captcha onChange={(id, text) => setCap({ id, text })} error={errors.captcha} resetKey={capKey} />
        <div className="form-actions"><Pill type="submit" disabled={busy}>仮登録する</Pill></div>
      </form>
    </div>
  );
}
