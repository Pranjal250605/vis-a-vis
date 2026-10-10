"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert, Pill, Row, SectionTitle } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState<{ resetUrl: string | null } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    try { setSent(await api("/password-reset/request", { body: { email } })); } catch (ex) { setErr((ex as ApiClientError).message); }
  };
  return (
    <div className="cmn-inner" style={{ maxWidth: 720 }}>
      <div className="page-head"><div className="crumb"><Link href="/">HOME</Link> ＞ パスワード再設定</div><SectionTitle en="Password" jp="パスワードの再設定" /></div>
      {sent ? (
        <div className="card fm" style={{ marginTop: 24 }}>
          <Alert kind="ok">ご入力のメールアドレスが登録されている場合、パスワード再設定用のURLをお送りしました。<br />※セキュリティのため、パスワードそのものをメールでお送りすることはありません。</Alert>
          {sent.resetUrl && <div className="demo-note"><b>デモ用</b>：<Link href={sent.resetUrl.replace(/^https?:\/\/[^/]+/, "")} style={{ textDecoration: "underline", wordBreak: "break-all" }}>{sent.resetUrl}</Link></div>}
        </div>
      ) : (
        <form className="card fm" onSubmit={submit} noValidate style={{ marginTop: 24 }}>
          {err && <Alert kind="err">{err}</Alert>}
          <Row label="登録メールアドレス" required hint="再設定用のURLをお送りします。"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Row>
          <div className="form-actions"><Pill type="submit">送信する</Pill></div>
        </form>
      )}
    </div>
  );
}
