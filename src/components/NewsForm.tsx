"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Row } from "@/components/ui";
import { AdminPage, Panel } from "@/components/admin";
import { api, ApiClientError, fmtDT, toLocalInput, useApi } from "@/lib/client";
import type { News } from "@/lib/types";

export default function NewsForm({ news }: { news?: News }) {
  const router = useRouter();
  const [f, setF] = useState({
    date: toLocalInput(news?.date ?? new Date().toISOString()), publishFrom: toLocalInput(news?.publishFrom ?? new Date().toISOString()),
    publishTo: toLocalInput(news?.publishTo ?? new Date(Date.now() + 365 * 86400000).toISOString()), title: news?.title ?? "", body: news?.body ?? "",
    places: news?.places ?? (["マイページ内"] as string[]), published: news?.published ?? true, recipients: (news?.recipientIds ?? []).join(", "),
    sendMail: false,
  });
  const [individual, setIndividual] = useState((news?.recipientIds.length ?? 0) > 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const expiring = useApi<{ items: { monitorId: number; name: string; points: number; expiresAt: string }[] }>(individual ? "/admin/points/expiring?days=60" : null);
  const bad = (k: string) => (errors[k] ? "invalid" : "");
  const jst = (s: string) => (s ? s + ":00+09:00" : "");

  const save = async () => {
    setMsg(""); setErrors({});
    const body = { ...f, date: jst(f.date), publishFrom: jst(f.publishFrom), publishTo: jst(f.publishTo), recipients: individual ? f.recipients : "" };
    try {
      const r = news ? await api<{ mailSent: number }>(`/admin/news/${news.id}`, { method: "PUT", body }) : await api<{ mailSent: number }>("/admin/news", { body });
      try { sessionStorage.setItem("adm-flash", `保存しました。${r.mailSent ? `新着情報メールを ${r.mailSent}名 に配信しました（「送信メール履歴」で確認できます）。` : ""}`); } catch { /* ignore */ }
      router.push("/admin/news");
    } catch (e) { const x = e as ApiClientError; setErrors(x.fields); setMsg(x.message); window.scrollTo({ top: 0 }); }
  };
  const togglePlace = (p: string) => setF({ ...f, places: f.places.includes(p) ? f.places.filter((x) => x !== p) : [...f.places, p] });

  return (
    <AdminPage code="B-1-1" title={news ? "新着情報の編集" : "新着情報の新規登録"} crumbs="新着情報管理 ＞ 新着情報一覧 ＞ 登録・編集">
      {msg && <Alert kind="err">{msg}</Alert>}
      <Panel>
        <div className="fm">
          <div className="three">
            <Row label="日付"><input type="datetime-local" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Row>
            <Row label="公開開始日時"><input type="datetime-local" value={f.publishFrom} onChange={(e) => setF({ ...f, publishFrom: e.target.value })} /></Row>
            <Row label="公開終了日時"><input type="datetime-local" value={f.publishTo} onChange={(e) => setF({ ...f, publishTo: e.target.value })} /></Row>
          </div>
          <Row label="タイトル" required error={errors.title}><input type="text" value={f.title} className={bad("title")} onChange={(e) => setF({ ...f, title: e.target.value })} /></Row>
          <Row label="本文"><textarea style={{ minHeight: 200 }} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Row>
          <Row label="表示場所" required error={errors.places}>
            <div className="inline">{["ログイン前", "マイページ内"].map((p) => <label className="check" key={p}><input type="checkbox" checked={f.places.includes(p)} onChange={() => togglePlace(p)} />{p}</label>)}</div>
          </Row>
          <label className="check"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />公開する</label>

          <div className="sect">配信設定<small>NEW</small></div>
          <label className="check"><input type="checkbox" checked={individual} onChange={(e) => { setIndividual(e.target.checked); if (e.target.checked) setF((p) => ({ ...p, places: ["マイページ内"] })); }} /><span><b>個別配信</b>（特定のモニターだけに表示・配信します。例：ポイント有効期限の個別案内）<span className="req-tag">No.14</span></span></label>
          {individual && (
            <div className="qbox">
              <Row label="配信先のモニター番号（カンマ区切り）" error={errors.recipients} hint="個別配信の新着情報は、指定したモニターのマイページにのみ表示されます。"><input type="text" value={f.recipients} className={bad("recipients")} onChange={(e) => setF({ ...f, recipients: e.target.value })} placeholder="1001, 1005, 1010" /></Row>
              <div>
                <button type="button" className="btn sm line" onClick={() => expiring.data && setF({ ...f, recipients: [...new Set(expiring.data.items.map((i) => i.monitorId))].join(", ") })}>ポイント有効期限が60日以内のモニターを自動入力</button>
                {expiring.data && <span className="hint" style={{ marginLeft: 10 }}>対象 {new Set(expiring.data.items.map((i) => i.monitorId)).size}名</span>}
                {expiring.data && expiring.data.items.length > 0 && (
                  <div className="tbl-wrap" style={{ marginTop: 10, maxHeight: 180, overflow: "auto" }}><table className="tbl"><thead><tr><th>モニター番号</th><th>氏名</th><th className="num">失効予定pt</th><th>有効期限</th></tr></thead>
                    <tbody>{expiring.data.items.map((i, k) => <tr key={k}><td>{i.monitorId}</td><td>{i.name}</td><td className="num">{i.points}</td><td>{fmtDT(i.expiresAt)}</td></tr>)}</tbody></table></div>
                )}
              </div>
            </div>
          )}
          <label className="check"><input type="checkbox" checked={f.sendMail} disabled={!f.published || (news?.mailSent ?? false)} onChange={(e) => setF({ ...f, sendMail: e.target.checked })} /><span><b>公開時にメールも同時配信する</b>（新着情報はログインしないと気づかないため）<span className="req-tag">No.15</span>{news?.mailSent && <span className="hint"> ※配信済みです（{news.mailSentCount}名）。</span>}</span></label>
          <div className="fm-actions"><button className="btn navy" onClick={save}>登録</button><Link className="btn line" href="/admin/news">キャンセル</Link></div>
        </div>
      </Panel>
    </AdminPage>
  );
}
