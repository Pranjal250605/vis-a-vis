"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminPage, Panel, SortTh, StatusPill } from "@/components/admin";
import { Alert } from "@/components/ui";
import { api, ApiClientError, download, fmtDate, qs, useApi } from "@/lib/client";
import { SURVEY_STATUSES } from "@/lib/constants";

const CSV_KINDS = [["label", "ラベル対応表"], ["raw", "ローデータ"], ["raw0", "ローデータ(0無)"], ["test", "テストローデータ"], ["test0", "テストローデータ(0無)"]] as const;

function List() {
  const sp = useSearchParams();
  const init = { q: "", startFrom: "", startTo: "", status: sp.get("status") ? [sp.get("status")!] : ([] as string[]), client: "", cond: "", pointsFrom: "", pointsTo: "" };
  const [f, setF] = useState(init);
  const [applied, setApplied] = useState(init);
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, reload, loading } = useApi<{ total: number; items: any[] }>("/admin/surveys" + qs({ ...applied, sort, order }));

  const act = async (fn: () => Promise<string>) => {
    try { setMsg({ kind: "ok", text: await fn() }); reload(); } catch (e) { setMsg({ kind: "err", text: (e as ApiClientError).message }); }
  };
  const onSort = (k: string, o: "asc" | "desc") => { setSort(k); setOrder(o); };
  const th = (label: string, k: string, num?: boolean) => <SortTh label={label} k={k} sort={sort} order={order} onSort={onSort} num={num} />;

  return (
    <AdminPage code="A-1" title="アンケート一覧" crumbs="アンケート管理 ＞ アンケート一覧" actions={<Link href="/admin/surveys/new" className="btn navy">新規登録</Link>}>
      {msg && <Alert kind={msg.kind === "ok" ? "ok" : "err"}>{msg.text}</Alert>}
      <Panel title="検索条件" req="No.9-1 / 9-2">
        <form className="filter" onSubmit={(e) => { e.preventDefault(); setApplied(f); }}>
          <label className="f wide">フリーワード検索（部分一致：タイトル・クライアント名・種別・ID・状態）<input type="text" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="例）グランピング" /></label>
          <label className="f wide">配信開始日<span className="range"><input type="date" value={f.startFrom} onChange={(e) => setF({ ...f, startFrom: e.target.value })} /><span>〜</span><input type="date" value={f.startTo} onChange={(e) => setF({ ...f, startTo: e.target.value })} /></span></label>
          <div className="f wide"><div style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 4 }}>状態</div>
            <div className="stat">{SURVEY_STATUSES.map((s) => <label className="check" key={s}><input type="checkbox" checked={f.status.includes(s)} onChange={(e) => setF({ ...f, status: e.target.checked ? [...f.status, s] : f.status.filter((x) => x !== s) })} />{s}</label>)}</div></div>
          <label className="f">クライアント名（部分一致）<input type="text" value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} /></label>
          <details><summary>詳細検索（配信条件・付与ポイント数）</summary>
            <div className="more">
              <label className="f">配信条件（詳細）<input type="text" value={f.cond} onChange={(e) => setF({ ...f, cond: e.target.value })} placeholder="例）女性 / 岡山県 / 有効会員" /></label>
              <label className="f">付与ポイント数（詳細）<span className="range"><input type="number" value={f.pointsFrom} onChange={(e) => setF({ ...f, pointsFrom: e.target.value })} /><span>〜</span><input type="number" value={f.pointsTo} onChange={(e) => setF({ ...f, pointsTo: e.target.value })} /></span></label>
            </div></details>
          <div className="acts"><button className="btn navy" type="submit">検索</button><button type="button" className="btn line" onClick={() => { setF({ ...init, status: [] }); setApplied({ ...init, status: [] }); }}>クリア</button></div>
        </form>
      </Panel>

      <div>
        <p className="count"><b>{data?.items.length ?? "…"}</b>件 / 全{data?.total ?? "…"}件　{loading && "（読み込み中）"}</p>
        <div className="tbl-wrap">
          <table className="tbl dense">
            <thead><tr>
              {th("有効 / 状態", "status")}{th("ID / 発行ポイント", "id")}{th("タイトル / クライアント", "title")}{th("設問数 / サンプル数", "question_num")}
              {th("回答数 / 回答率", "ans_num")}{th("種別 / 配信開始日", "start_date")}<th>設問設定 / 配信条件</th><th>CSV</th><th>基本情報</th>
            </tr></thead>
            <tbody>
              {data?.items.length === 0 && <tr><td colSpan={9} className="empty">該当するアンケートはありません。</td></tr>}
              {data?.items.map((s) => (
                <tr key={s.id}>
                  <td><StatusPill s={s.status} /><span className="sub">{s.valid ? "有効" : "無効"}</span></td>
                  <td><b className="jost">{s.id}</b><span className="sub">{s.points != null ? `${s.points} pt` : "－"}</span></td>
                  <td style={{ minWidth: 190 }}>
                    <a href="#" className="link" onClick={(e) => { e.preventDefault(); setOpenId(openId === s.id ? null : s.id); }}>{s.title}</a>
                    <span className="sub">{s.client || "（クライアント名なし）"}</span>
                    {openId === s.id && (
                      <div className="alert _info" style={{ marginTop: 8, fontSize: "1.2rem" }}>
                        短縮URL：<span className="mono">{s.shortUrl}</span><br />配信条件：{s.targetSummary}<br />終了条件：{s.endKind === "sample" ? `サンプル上限数 ${s.endValue}件` : `終了日時 ${fmtDate(s.endValue)}`}
                      </div>
                    )}
                  </td>
                  <td className="num">{s.questionCount}<span className="sub">{s.sampleTarget}</span></td>
                  <td className="num">{s.answerCount}<span className="sub">{s.answerRate}%</span></td>
                  <td>{s.type}<span className="sub">{fmtDate(s.startAt)}</span></td>
                  <td><Link className="link" href={`/admin/surveys/${s.id}?tab=questions`}>設問設定</Link><br /><Link className="link" href={`/admin/surveys/${s.id}?tab=target`}>配信条件</Link></td>
                  <td>
                    <details><summary style={{ cursor: "pointer", color: "var(--navy)" }}>CSV ▾</summary>
                      <div style={{ display: "grid", gap: 4, marginTop: 6 }}>{CSV_KINDS.map(([k, l]) => <a key={k} href="#" className="link" onClick={(e) => { e.preventDefault(); download(`/admin/surveys/${s.id}/csv?kind=${k}`); }}>{l}</a>)}</div>
                    </details>
                  </td>
                  <td className="acts">
                    <a className="link" href={`/preview/${s.publicId}`} target="_blank" rel="noopener noreferrer">プレビュー</a>｜<Link className="link" href={`/admin/surveys/${s.id}`}>{s.editable ? "編集" : "詳細"}</Link>｜
                    <a href="#" className="link" onClick={(e) => { e.preventDefault(); if (confirm(`アンケート #${s.id} を削除します。回答データも削除されます。よろしいですか？`)) act(async () => { await api(`/admin/surveys/${s.id}`, { method: "DELETE" }); return `アンケート #${s.id} を削除しました。`; }); }}>削除</a>
                    <div className="btns" style={{ marginTop: 8 }}>
                      <button className="btn sm line" onClick={() => act(async () => { const r = await api<{ to: string }>(`/admin/surveys/${s.id}/test-delivery`, { body: {} }); return `テスト配信しました（送信先：管理者メールアドレス ${r.to} のみ）。「送信メール履歴」で内容を確認できます。`; })}>テスト配信</button>
                      <button className="btn sm line" onClick={() => act(async () => { const r = await api<{ id: number }>(`/admin/surveys/${s.id}/copy`, { body: {} }); return `コピーしました（新しいアンケート #${r.id}、配信待ち）。`; })}>コピー</button>
                      {(s.status === "配信中" || s.status === "非公開") && <button className="btn sm line" onClick={() => act(async () => { const r = await api<{ status: string }>(`/admin/surveys/${s.id}/toggle`, { body: {} }); return `状態を「${r.status}」に切り替えました。`; })}>{s.status === "配信中" ? "非公開にする" : "配信を再開"}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
}

export default function Page() { return <Suspense fallback={null}><List /></Suspense>; }
