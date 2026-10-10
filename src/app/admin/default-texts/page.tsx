"use client";
import { useEffect, useState } from "react";
import { AdminPage, Panel } from "@/components/admin";
import { Alert, Row } from "@/components/ui";
import { api, ApiClientError, useApi } from "@/lib/client";

export default function DefaultTexts() {
  const { data } = useApi<{ pre: string; post: string; request: string; vars: string[] }>("/admin/default-texts");
  const [f, setF] = useState({ pre: "", post: "", request: "" });
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  useEffect(() => { if (data) setF({ pre: data.pre, post: data.post, request: data.request }); }, [data]);
  const save = async () => {
    try { await api("/admin/default-texts", { method: "PUT", body: f }); setMsg({ k: "ok", t: "保存しました。新規アンケートの初期値に反映されます。" }); } catch (e) { setMsg({ k: "err", t: (e as ApiClientError).message }); }
  };
  return (
    <AdminPage code="A-2" title="デフォルト設定" crumbs="アンケート管理 ＞ デフォルト設定">
      {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
      <Panel title="アンケートの定型文" sub="新規登録時（A-1-1）の初期値として使われます。">
        <div className="fm">
          <Row label="アンケート前の文章" hint="各アンケート回答画面の冒頭に表示される固定文言（守秘義務のお願い等）"><textarea value={f.pre} onChange={(e) => setF({ ...f, pre: e.target.value })} /></Row>
          <Row label="アンケート後の文章" hint="回答完了後に表示される固定文言"><textarea value={f.post} onChange={(e) => setF({ ...f, post: e.target.value })} /></Row>
          <Row label="依頼メール文" hint={<>差し込み：<span className="vars">{data?.vars.map((v) => <code key={v}>{v}</code>)}</span></>}><textarea value={f.request} onChange={(e) => setF({ ...f, request: e.target.value })} /></Row>
          <div className="fm-actions"><button className="btn navy" onClick={save}>登録</button></div>
        </div>
      </Panel>
    </AdminPage>
  );
}
