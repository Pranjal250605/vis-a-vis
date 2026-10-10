"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminPage, SortTh, StatusPill } from "@/components/admin";
import { Alert } from "@/components/ui";
import { api, ApiClientError, download, fmtDT, qs, useApi, yen } from "@/lib/client";

function List() {
  const sp = useSearchParams();
  const init = { monitorFrom: "", monitorTo: "", name: "", status: sp.get("status") ?? "", item: "" };
  const [f, setF] = useState(init);
  const [applied, setApplied] = useState(init);
  const [sort, setSort] = useState("appliedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc"); // 既定：申請日の降順 (No.19)
  const [sel, setSel] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  const { data, reload } = useApi<{ total: number; items: any[]; itemOptions: string[] }>("/admin/trades" + qs({ ...applied, sort, order }));
  const onSort = (k: string, o: "asc" | "desc") => { setSort(k); setOrder(o); };
  const th = (label: string, k: string, num?: boolean) => <SortTh label={label} k={k} sort={sort} order={order} onSort={onSort} num={num} />;
  const all = data?.items ?? [];
  const bulk = async (status: "発送済み" | "未発送") => {
    try { const r = await api<{ updated: number }>("/admin/trades/bulk-status", { body: { ids: sel, status } }); setMsg({ k: "ok", t: `${r.updated}件を「${status}」に更新しました。` }); setSel([]); reload(); }
    catch (e) { setMsg({ k: "err", t: (e as ApiClientError).message }); }
  };
  return (
    <AdminPage code="C-1" title="申請一覧" crumbs="ポイント交換管理 ＞ 申請一覧" actions={<button className="btn line" onClick={() => download("/admin/trades/csv" + qs(applied))}>CSV出力</button>}>
      {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
      <form className="filter" onSubmit={(e) => { e.preventDefault(); setApplied(f); }}>
        <label className="f wide">モニター番号<span className="range"><input type="text" value={f.monitorFrom} onChange={(e) => setF({ ...f, monitorFrom: e.target.value })} /><span>〜</span><input type="text" value={f.monitorTo} onChange={(e) => setF({ ...f, monitorTo: e.target.value })} /></span></label>
        <label className="f">名前（部分一致）<input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="f">状態<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">すべて</option><option>未発送</option><option>発送済み</option></select></label>
        <label className="f">交換商品<span className="req-tag" style={{ marginLeft: 4 }}>No.16</span><select value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })}><option value="">すべて</option>{data?.itemOptions.map((i) => <option key={i}>{i}</option>)}</select></label>
        <div className="acts"><button className="btn navy" type="submit">検索</button><button type="button" className="btn line" onClick={() => { setF({ ...init, status: "" }); setApplied({ ...init, status: "" }); }}>クリア</button></div>
      </form>
      <div>
        <div className="btns" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <p className="count" style={{ margin: 0 }}><b>{all.length}</b>件 / 全{data?.total ?? "…"}件</p>
          <div className="btns"><span className="hint">選択中 {sel.length}件</span><button className="btn sm navy" disabled={!sel.length} onClick={() => bulk("発送済み")}>発送状態を更新（発送済みにする）</button><button className="btn sm line" disabled={!sel.length} onClick={() => bulk("未発送")}>未発送に戻す</button></div>
        </div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <th><input type="checkbox" aria-label="すべて選択" checked={all.length > 0 && sel.length === all.length} onChange={(e) => setSel(e.target.checked ? all.map((t) => t.id) : [])} /></th>
            {th("申請日", "appliedAt")}{th("モニター番号", "monitorId")}{th("名前", "name")}{th("交換商品", "item")}{th("消費ポイント", "points", true)}{th("状態", "status")}<th>操作</th>
          </tr></thead>
          <tbody>{all.map((t) => (
            <tr key={t.id}>
              <td><input type="checkbox" aria-label={`申請${t.id}を選択`} checked={sel.includes(t.id)} onChange={(e) => setSel(e.target.checked ? [...sel, t.id] : sel.filter((x) => x !== t.id))} /></td>
              <td>{fmtDT(t.appliedAt)}</td>
              <td><Link className="link" href={`/admin/monitors/${t.monitorId}`}>{t.monitorId}</Link></td>
              <td>{t.name}</td><td>{t.itemsText}</td><td className="num">{yen(t.pointsUsed)}</td><td><StatusPill s={t.status} /></td>
              <td><Link className="link" href={`/admin/trades/${t.id}`}>操作</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </AdminPage>
  );
}
export default function Page() { return <Suspense fallback={null}><List /></Suspense>; }
