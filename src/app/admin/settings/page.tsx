"use client";
import { useEffect, useState } from "react";
import { AdminPage, Panel } from "@/components/admin";
import { Alert, Row } from "@/components/ui";
import { api, ApiClientError, useApi } from "@/lib/client";

export default function Settings() {
  const { data } = useApi<any>("/admin/settings");
  const [f, setF] = useState({ adminId: "", fromAddress: "", toAddresses: "", adminEmail: "", pointExpiryMonths: "12", newPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  useEffect(() => { if (data) setF({ adminId: data.adminId, fromAddress: data.fromAddress, toAddresses: data.toAddresses, adminEmail: data.adminEmail, pointExpiryMonths: String(data.pointExpiryMonths), newPassword: "" }); }, [data]);
  const bad = (k: string) => (errors[k] ? "invalid" : "");
  const save = async () => {
    setErrors({}); setMsg(null);
    try { await api("/admin/settings", { method: "PUT", body: f }); setMsg({ k: "ok", t: "保存しました。" }); setF((p) => ({ ...p, newPassword: "" })); }
    catch (e) { const x = e as ApiClientError; setErrors(x.fields); setMsg({ k: "err", t: x.message }); }
  };
  return (
    <AdminPage code="G-1" title="管理者設定" crumbs="設定 ＞ 管理者設定">
      {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
      <Panel title="管理者アカウント / メール設定">
        <div className="fm" style={{ maxWidth: 720 }}>
          <Row label="ID" required error={errors.adminId}><input type="text" value={f.adminId} className={bad("adminId")} onChange={(e) => setF({ ...f, adminId: e.target.value })} /></Row>
          <Row label="パスワード" optional error={errors.newPassword} hint="現在のパスワードは暗号化して保管しており、画面には表示されません（••••••••）。変更する場合のみ新しいパスワードを入力してください。"><input type="password" autoComplete="new-password" value={f.newPassword} className={bad("newPassword")} onChange={(e) => setF({ ...f, newPassword: e.target.value })} placeholder="••••••••" /></Row>
          <Row label="送信元メールアドレス" required error={errors.fromAddress} hint="システムからの自動送信メールの送信元"><input type="email" value={f.fromAddress} className={bad("fromAddress")} onChange={(e) => setF({ ...f, fromAddress: e.target.value })} /></Row>
          <Row label="送信先メールアドレス（カンマ区切りで複数可）" required error={errors.toAddresses} hint="お問い合わせ等の通知を受け取る宛先"><input type="text" value={f.toAddresses} className={bad("toAddresses")} onChange={(e) => setF({ ...f, toAddresses: e.target.value })} /></Row>
          <Row label="管理者メールアドレス（テスト配信の送信先）" required error={errors.adminEmail} hint="アンケートのテスト配信は、このアドレスにのみ送信されます。"><input type="email" value={f.adminEmail} className={bad("adminEmail")} onChange={(e) => setF({ ...f, adminEmail: e.target.value })} /></Row>
          <div className="sect">ポイント<small>POINTS</small></div>
          <Row label="ポイントの有効期限（獲得日から○か月）" error={errors.pointExpiryMonths} hint="0＝有効期限なし。マイページのポイント有効期限の表示・失効予定の案内に反映されます。"><input type="number" min={0} max={60} value={f.pointExpiryMonths} className={bad("pointExpiryMonths")} onChange={(e) => setF({ ...f, pointExpiryMonths: e.target.value })} style={{ maxWidth: 160 }} /></Row>
          <div className="fm-actions"><button className="btn navy" onClick={save}>登録</button></div>
        </div>
      </Panel>
    </AdminPage>
  );
}
