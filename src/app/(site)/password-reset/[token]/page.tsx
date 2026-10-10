"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { INPUT_HINTS } from "@/lib/rules";
import { Alert, Pill, Row, SectionTitle } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function PasswordResetConfirm() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setErrors({});
    try { await api("/password-reset/confirm", { body: { token, password, passwordConfirm } }); setDone(true); }
    catch (ex) { const x = ex as ApiClientError; setMsg(x.message); setErrors(x.fields); }
  };
  return (
    <div className="cmn-inner" style={{ maxWidth: 720 }}>
      <div className="page-head"><div className="crumb"><Link href="/">HOME</Link> ＞ パスワード再設定</div><SectionTitle en="Password" jp="新しいパスワードの設定" /></div>
      {done ? (
        <div className="done-box"><h2>パスワードを再設定しました</h2><Pill href="/#login">ログインへ</Pill></div>
      ) : (
        <form className="card fm" onSubmit={submit} noValidate style={{ marginTop: 24 }}>
          {msg && <Alert kind="err">{msg}</Alert>}
          <Row label="新しいパスワード" required error={errors.password} hint={INPUT_HINTS.password}><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={errors.password ? "invalid" : ""} /></Row>
          <Row label="新しいパスワード（確認）" required error={errors.passwordConfirm}><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} /></Row>
          <div className="form-actions"><Pill type="submit">設定する</Pill></div>
        </form>
      )}
    </div>
  );
}
