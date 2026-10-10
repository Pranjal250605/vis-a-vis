"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPage, SortTh, StatusPill } from "@/components/admin";
import { Alert } from "@/components/ui";
import { api, ApiClientError, fmtDT, qs, useApi } from "@/lib/client";

export default function NewsList() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [msg, setMsg] = useState<string | null>(null);
  const { data, reload } = useApi<{ total: number; items: any[] }>("/admin/news" + qs({ q: applied, sort, order }));
  useEffect(() => { try { const t = sessionStorage.getItem("adm-flash"); if (t) { setMsg(t); sessionStorage.removeItem("adm-flash"); } } catch { /* ignore */ } }, []);
  const onSort = (k: string, o: "asc" | "desc") => { setSort(k); setOrder(o); };
  const del = async (id: number) => {
    if (!confirm("この新着情報を削除します。よろしいですか？")) return;
    try { await api(`/admin/news/${id}`, { method: "DELETE" }); setMsg("削除しました。"); reload(); } catch (e) { setMsg((e as ApiClientError).message); }
  };
  return (
    <AdminPage code="B-1" title="新着情報一覧" crumbs="新着情報管理 ＞ 新着情報一覧" actions={<Link href="/admin/news/new" className="btn navy">新規登録</Link>}>
      {msg && <Alert kind="info">{msg}</Alert>}
      <form className="filter" onSubmit={(e) => { e.preventDefault(); setApplied(q); }}>
        <label className="f wide">タイトル（部分一致）<input type="text" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="acts"><button className="btn navy" type="submit">検索</button></div>
      </form>
      <div>
        <p className="count"><b>{data?.items.length ?? "…"}</b>件 / 全{data?.total ?? "…"}件</p>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>公開</th><th>状態</th><SortTh label="作成日" k="date" sort={sort} order={order} onSort={onSort} /><SortTh label="タイトル" k="title" sort={sort} order={order} onSort={onSort} /><th>公開開始日時</th><th>公開終了日時</th><th>配信先</th><th>メール</th><th>操作</th></tr></thead>
          <tbody>{data?.items.map((n) => (
            <tr key={n.id}>
              <td>{n.published ? <span className="pill go">公開</span> : <span className="pill hide">非公開</span>}</td>
              <td><StatusPill s={n.state} /></td>
              <td>{fmtDT(n.date)}</td>
              <td style={{ minWidth: 240 }}><Link className="link" href={`/admin/news/${n.id}`}>{n.title}</Link><span className="sub">{n.places.join(" / ")}</span></td>
              <td>{fmtDT(n.publishFrom)}</td><td>{fmtDT(n.publishTo)}</td>
              <td>{n.recipientIds.length ? <span className="pill warn">個別 {n.recipientIds.length}名</span> : "全モニター"}</td>
              <td>{n.mailSent ? <span className="pill ok">送信済 {n.mailSentCount}名</span> : "－"}</td>
              <td className="acts"><Link className="link" href={`/admin/news/${n.id}`}>編集</Link>｜<a href="#" className="link" onClick={(e) => { e.preventDefault(); del(n.id); }}>削除</a></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </AdminPage>
  );
}
