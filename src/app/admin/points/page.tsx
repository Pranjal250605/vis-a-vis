"use client";
import Link from "next/link";
import { useState } from "react";
import { AdminPage, SortTh } from "@/components/admin";
import { fmtDT, qs, useApi, yen } from "@/lib/client";

/** ポイント付与一覧（要求事項 No.34 新設） */
export default function PointList() {
  const init = { monitorId: "", kind: "", from: "", to: "" };
  const [f, setF] = useState(init);
  const [applied, setApplied] = useState(init);
  const [sort, setSort] = useState("at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const { data } = useApi<{ total: number; items: any[]; expiryMonths: number }>("/admin/points" + qs({ ...applied, sort, order }));
  const onSort = (k: string, o: "asc" | "desc") => { setSort(k); setOrder(o); };
  const th = (label: string, k: string, num?: boolean) => <SortTh label={label} k={k} sort={sort} order={order} onSort={onSort} num={num} />;
  return (
    <AdminPage title="ポイント付与一覧" req="No.34" crumbs="ポイント管理 ＞ ポイント付与一覧" actions={<Link href="/admin/points/grant" className="btn navy">ポイントを付与する</Link>}>
      <form className="filter" onSubmit={(e) => { e.preventDefault(); setApplied(f); }}>
        <label className="f">モニター番号<input type="text" value={f.monitorId} onChange={(e) => setF({ ...f, monitorId: e.target.value })} /></label>
        <label className="f">種別<select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="">すべて</option><option>手動付与</option><option>アンケート回答</option></select></label>
        <label className="f wide">付与日<span className="range"><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /><span>〜</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></span></label>
        <div className="acts"><button className="btn navy" type="submit">検索</button><button type="button" className="btn line" onClick={() => { setF(init); setApplied(init); }}>クリア</button></div>
      </form>
      <div>
        <p className="count"><b>{data?.items.length ?? "…"}</b>件表示（最大500件）/ 全{data?.total ?? "…"}件　ポイント有効期限：{data ? (data.expiryMonths ? `獲得日から${data.expiryMonths}か月` : "なし") : ""}</p>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>{th("付与日時", "at")}{th("モニター番号", "monitorId")}<th>氏名</th><th>種別</th>{th("ポイント", "points", true)}<th>理由</th>{th("有効期限", "expiresAt")}<th>付与者</th></tr></thead>
          <tbody>{data?.items.map((g) => (
            <tr key={g.id}><td>{fmtDT(g.at)}</td><td><Link className="link" href={`/admin/monitors/${g.monitorId}`}>{g.monitorId}</Link></td><td>{g.monitorName}</td>
              <td><span className={"pill " + (g.kind === "手動付与" ? "warn" : "")}>{g.kind}</span></td><td className="num">{g.points > 0 ? "+" : ""}{yen(g.points)}</td><td>{g.reason}</td><td>{g.expiresAt ? fmtDT(g.expiresAt) : "なし"}</td><td>{g.by}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </AdminPage>
  );
}
