"use client";
import { useEffect, useState } from "react";
import { AdminPage, Panel } from "@/components/admin";
import { Alert, Row } from "@/components/ui";
import { api, ApiClientError, useApi } from "@/lib/client";

export default function MailTexts() {
  const { data } = useApi<{ templates: { key: string; label: string; vars: string[]; text: string }[] }>("/admin/mail-texts");
  const [f, setF] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  useEffect(() => { if (data) setF(Object.fromEntries(data.templates.map((t) => [t.key, t.text]))); }, [data]);
  const save = async () => {
    try { await api("/admin/mail-texts", { method: "PUT", body: f }); setMsg({ k: "ok", t: "保存しました。" }); } catch (e) { setMsg({ k: "err", t: (e as ApiClientError).message }); }
  };
  return (
    <AdminPage code="G-2" title="文章設定" crumbs="設定 ＞ 文章設定">
      {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
      <Alert kind="info">パスワードを平文でメール送信するテンプレート（旧「パスワードお問い合わせメール」）は廃止し、再設定URLを案内する「パスワード再設定メール」に置き換えています。</Alert>
      <Panel title="メールテンプレート" sub="本文中に差し込みタグ（%%…%%）を貼り付けて使用します。">
        <div className="fm">
          {data?.templates.map((t) => (
            <Row key={t.key} label={t.label} hint={<>使用できる差し込みタグ：<span className="vars">{t.vars.map((v) => <code key={v}>{v}</code>)}</span></>}>
              <textarea style={{ minHeight: 150 }} value={f[t.key] ?? ""} onChange={(e) => setF({ ...f, [t.key]: e.target.value })} />
            </Row>
          ))}
          <div className="fm-actions"><button className="btn navy" onClick={save}>登録</button></div>
        </div>
      </Panel>
    </AdminPage>
  );
}
