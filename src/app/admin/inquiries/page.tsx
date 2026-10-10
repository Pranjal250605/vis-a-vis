"use client";
import Link from "next/link";
import { useState } from "react";
import { AdminPage, StatusPill } from "@/components/admin";
import { api, fmtDT, qs, useApi } from "@/lib/client";

/** モニター用（要求事項 No.3）／非モニター用（No.1）の問い合わせを分けて受信 */
export default function Inquiries() {
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const { data, reload } = useApi<{ items: any[] }>("/admin/inquiries" + qs({ kind, status }));
  const mark = async (id: number, s: string) => { await api(`/admin/inquiries/${id}`, { method: "PATCH", body: { status: s } }); reload(); };
  return (
    <AdminPage title="お問い合わせ" req="No.1 / No.3" crumbs="運営 ＞ お問い合わせ">
      <div className="filter">
        <label className="f">種別<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">すべて</option><option>モニター</option><option>非モニター</option></select></label>
        <label className="f">状態<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">すべて</option><option>未対応</option><option>対応済み</option></select></label>
      </div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>受付日時</th><th>種別</th><th>お名前 / モニター番号</th><th>連絡先</th><th>お問い合わせ内容</th><th>状態</th><th>操作</th></tr></thead>
        <tbody>
          {data?.items.length === 0 && <tr><td colSpan={7} className="empty">お問い合わせはありません。</td></tr>}
          {data?.items.map((i) => (
            <tr key={i.id}>
              <td>{fmtDT(i.at)}</td><td><span className={"pill " + (i.kind === "モニター" ? "wait" : "")}>{i.kind}</span></td>
              <td>{i.name}{i.company && <span className="sub">{i.company}</span>}{i.monitorId && <span className="sub">モニター番号 <Link className="link" href={`/admin/monitors/${i.monitorId}`}>{i.monitorId}</Link></span>}</td>
              <td>{i.email}<span className="sub">{i.tel}</span></td><td style={{ minWidth: 260, whiteSpace: "pre-wrap" }}>{i.body}</td><td><StatusPill s={i.status} /></td>
              <td>{i.status === "未対応" ? <button className="btn sm line" onClick={() => mark(i.id, "対応済み")}>対応済みにする</button> : <button className="btn sm line" onClick={() => mark(i.id, "未対応")}>未対応に戻す</button>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </AdminPage>
  );
}
