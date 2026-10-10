"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminPage, Panel, StatusPill } from "@/components/admin";
import SurveyEditor, { surveyPayload, surveyToForm, type SurveyForm } from "@/components/SurveyEditor";
import { Alert } from "@/components/ui";
import { api, ApiClientError, download, fmtDT, useApi } from "@/lib/client";

const CSV_KINDS = [["label", "ラベル対応表"], ["raw", "ローデータ"], ["raw0", "ローデータ(0無)"], ["test", "テストローデータ"], ["test0", "テストローデータ(0無)"]] as const;

function Detail() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const { data, reload, error } = useApi<any>(`/admin/surveys/${id}`);
  const [f, setF] = useState<SurveyForm | null>(null);
  const [tab, setTab] = useState<"basic" | "questions" | "target">((sp.get("tab") as any) || "basic");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);

  useEffect(() => { if (data && !f) setF(surveyToForm(data.survey)); }, [data, f]);
  if (error) return <AdminPage title="アンケート"><Alert kind="err">{error.message}</Alert></AdminPage>;
  if (!data || !f) return null;
  const s = data.survey, row = data.row;
  const readOnly = !row.editable;

  const save = async () => {
    setMsg(null); setErrors({});
    try { await api(`/admin/surveys/${id}`, { method: "PUT", body: surveyPayload(f) }); setMsg({ kind: "ok", text: "保存しました。" }); reload(); }
    catch (e) { const x = e as ApiClientError; setErrors(x.fields); setMsg({ kind: "err", text: x.message }); }
  };
  const copy = async () => { const r = await api<{ id: number }>(`/admin/surveys/${id}/copy`, { body: {} }); router.push(`/admin/surveys/${r.id}`); };
  const testDelivery = async () => { try { const r = await api<{ to: string }>(`/admin/surveys/${id}/test-delivery`, { body: {} }); setMsg({ kind: "ok", text: `テスト配信しました（送信先：管理者メールアドレス ${r.to} のみ）。` }); } catch (e) { setMsg({ kind: "err", text: (e as ApiClientError).message }); } };

  return (
    <AdminPage code="A-1-2" title={`アンケート #${s.id}`} crumbs="アンケート管理 ＞ アンケート一覧 ＞ 詳細" actions={<><Link href="/admin/surveys" className="btn line">一覧へ</Link></>}>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      {readOnly && <Alert kind="info">このアンケートは「{s.status}」のため編集できません（配信済みのアンケートは閲覧のみ）。内容を変更したい場合は<b>「コピー」</b>して新しいアンケートを作成してください。</Alert>}
      <Panel title="サマリー">
        <div className="btns" style={{ marginBottom: 12 }}>
          <StatusPill s={s.status} /> <span>{s.type}</span> <span>｜ 設問数 <b>{row.questionCount}</b></span> <span>｜ 回答数 <b>{row.answerCount}</b> / {row.sampleTarget}（{row.answerRate}%）</span> <span>｜ 作成日 {fmtDT(s.createdAt)}</span>
        </div>
        <dl className="kv">
          <dt>短縮URL</dt><dd className="mono">{s.shortUrl}</dd>
          <dt>配信条件（保存済み）</dt><dd>{s.targetSummary}（合致 {data.targetMatched}名）</dd>
          <dt>プレビューURL</dt><dd><a className="link" href={`/preview/${s.publicId}`} target="_blank" rel="noopener noreferrer">/preview/{s.publicId}</a>（内部IDとは別採番）</dd>
        </dl>
        <div className="btns" style={{ marginTop: 14 }}>
          <button className="btn line" onClick={copy}>コピー（複製）</button>
          <button className="btn line" onClick={testDelivery}>テスト配信（管理者メールのみ）</button>
          <details style={{ display: "inline-block" }}><summary className="btn line" style={{ listStyle: "none" }}>CSV出力 ▾</summary>
            <div className="panel" style={{ position: "absolute", zIndex: 4, padding: 12, display: "grid", gap: 6 }}>{CSV_KINDS.map(([k, l]) => <a key={k} href="#" className="link" onClick={(e) => { e.preventDefault(); download(`/admin/surveys/${id}/csv?kind=${k}`); }}>{l}</a>)}</div></details>
        </div>
      </Panel>
      <Panel>
        <div className="tabs">{([["basic", "基本情報（A-1-2）"], ["questions", "設問設定（A-1-3）"], ["target", "配信条件（A-1-4）"]] as const).map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
        <div style={{ marginTop: 16 }}><SurveyEditor f={f} set={(p) => setF({ ...f, ...p })} errors={errors} readOnly={readOnly} tab={tab} matched={data.targetMatched} /></div>
        {!readOnly && <div className="fm-actions" style={{ marginTop: 20 }}><button className="btn navy" onClick={save}>保存</button></div>}
      </Panel>
    </AdminPage>
  );
}

export default function Page() { return <Suspense fallback={null}><Detail /></Suspense>; }
