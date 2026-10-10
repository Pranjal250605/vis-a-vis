"use client";
import Link from "next/link";
import { useState } from "react";
import { AdminPage, SortTh } from "@/components/admin";
import { fmtDT, qs, useApi } from "@/lib/client";

export default function Withdrawals() {
  const [sort, setSort] = useState("at");
  const [order, setOrder] = useState<"asc" | "desc">("desc"); // 既定：退会日時の降順 (No.28)
  const { data } = useApi<{ total: number; items: any[] }>("/admin/withdrawals" + qs({ sort, order }));
  const onSort = (k: string, o: "asc" | "desc") => { setSort(k); setOrder(o); };
  return (
    <AdminPage code="F-1" title="退会理由" crumbs="退会管理 ＞ 退会理由" req="No.28">
      <div>
        <p className="count"><b>{data?.total ?? "…"}</b>件</p>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><SortTh label="退会日時" k="at" sort={sort} order={order} onSort={onSort} /><SortTh label="モニター番号" k="monitorId" sort={sort} order={order} onSort={onSort} /><th>氏名</th><SortTh label="退会理由" k="reason" sort={sort} order={order} onSort={onSort} /></tr></thead>
          <tbody>{data?.items.map((w) => (
            <tr key={w.id}><td>{fmtDT(w.at)}</td><td><Link className="link" href={`/admin/monitors/${w.monitorId}`}>{w.monitorId}</Link></td><td>{w.monitorName}</td><td>{w.reason || <span className="sub">（未入力）</span>}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </AdminPage>
  );
}
