"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Row } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function AdminLogin() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    try { await api("/admin/login", { body: { id, password } }); router.push("/admin"); } catch (ex) { setErr((ex as ApiClientError).message); }
  };
  return (
    <div className="login-wrap">
      <form className="login-card fm" onSubmit={submit} noValidate>
        <div className="brandrow"><span style={{ width: 34, height: 34, borderRadius: "50%", background: "#fcc800", display: "inline-block" }} /><h1>Vinsight</h1></div>
        <div style={{ fontWeight: 900, fontSize: "1.8rem", marginBottom: 8 }}>管理者ログイン</div>
        {err && <Alert kind="err">{err}</Alert>}
        <Row label="ID"><input type="text" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} /></Row>
        <Row label="パスワード"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Row>
        <button className="btn navy" type="submit" style={{ padding: "11px 20px", fontSize: "1.5rem" }}>ログイン</button>
        <div className="alert _info" style={{ fontSize: "1.2rem" }}>デモ用：ID <b>admin</b> ／ パスワード <b>admin123</b>
          <button type="button" className="btn sm line" style={{ marginLeft: 10 }} onClick={() => { setId("admin"); setPassword("admin123"); }}>入力する</button></div>
        <a href="/" style={{ fontSize: "1.25rem", textDecoration: "underline", textAlign: "center" }}>← モニターサイトへ</a>
      </form>
    </div>
  );
}
