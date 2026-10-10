"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { AdminPage, Panel, SortTh, StatusPill } from "@/components/admin";
import { Alert } from "@/components/ui";
import { api, ApiClientError, download, fmtDT, qs, useApi, yen } from "@/lib/client";

export default function Monitors() {
  const init = { idFrom: "", idTo: "", name: "", tel: "", email: "", status: "" };
  const [f, setF] = useState(init);
  const [applied, setApplied] = useState(init);
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState<"asc" | "desc">("asc"); // 既定：モニター番号の昇順 (No.23)
  const [msg, setMsg] = useState<{ k: "ok" | "err" | "info"; t: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const { data, reload } = useApi<{ total: number; items: any[] }>("/admin/monitors" + qs({ ...applied, sort, order }));
  const onSort = (k: string, o: "asc" | "desc") => { setSort(k); setOrder(o); };
  const th = (label: string, k: string, num?: boolean) => <SortTh label={label} k={k} sort={sort} order={order} onSort={onSort} num={num} />;

  const importCsv = async (file: File) => {
    try {
      const csv = await file.text();
      const r = await api<{ updated: number; skipped: number; problems: string[] }>("/admin/monitors/import", { body: { csv } });
      setMsg({ k: r.skipped ? "info" : "ok", t: `取り込み完了：更新 ${r.updated}件 / スキップ ${r.skipped}件${r.problems.length ? "\n" + r.problems.slice(0, 5).join("\n") : ""}` }); reload();
    } catch (e) { setMsg({ k: "err", t: (e as ApiClientError).message }); }
  };

  return (
    <AdminPage code="D-1" title="モニター一覧" crumbs="モニター管理 ＞ モニター一覧"
      actions={<><button className="btn line" onClick={() => download("/admin/monitors/csv" + qs(applied))}>CSV出力（エクスポート）</button><button className="btn line" onClick={() => file.current?.click()}>CSVインポート</button><input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) importCsv(x); e.target.value = ""; }} /></>}>
      {msg && <Alert kind={msg.k}><span style={{ whiteSpace: "pre-wrap" }}>{msg.t}</span></Alert>}
      <Panel title="検索条件" req="No.21">
        <form className="filter" onSubmit={(e) => { e.preventDefault(); setApplied(f); }}>
          <label className="f wide">モニター番号<span className="range"><input type="text" value={f.idFrom} onChange={(e) => setF({ ...f, idFrom: e.target.value })} /><span>〜</span><input type="text" value={f.idTo} onChange={(e) => setF({ ...f, idTo: e.target.value })} /></span></label>
          <label className="f">氏名（部分一致）<input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="f">電話番号（部分一致）<input type="text" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} /></label>
          <label className="f">メールアドレス（部分一致）<input type="text" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="f">状態<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">すべて</option><option>有効</option><option>無効</option><option>退会</option></select></label>
          <div className="acts"><button className="btn navy" type="submit">検索</button><button type="button" className="btn line" onClick={() => { setF(init); setApplied(init); }}>クリア</button></div>
        </form>
      </Panel>
      <div>
        <p className="count"><b>{data?.items.length ?? "…"}</b>件 / 全{data?.total ?? "…"}件　<span className="hint">CSVの項目：モニター情報の全項目（パスワードは含みません）</span></p>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>状態</th>{th("モニター番号", "id")}{th("氏名", "name")}<th>メールアドレス</th><th>電話番号</th><th>住所</th>{th("最終ログイン", "lastLogin")}{th("最終回答", "lastAnswered")}{th("ポイント", "points", true)}{th("回答数", "answerCount", true)}<th className="num">不達</th><th>操作</th></tr></thead>
          <tbody>{data?.items.map((m) => (
            <tr key={m.id}>
              <td><StatusPill s={m.status} /></td><td><b className="jost">{m.id}</b></td><td>{m.name}</td><td>{m.email}</td><td>{m.tel}</td><td>{m.prefecture}{m.city}</td>
              <td>{m.lastLoginAt ? fmtDT(m.lastLoginAt) : <span className="sub">未ログイン</span>}</td><td>{m.lastAnsweredAt ? fmtDT(m.lastAnsweredAt) : <span className="sub">未回答</span>}</td>
              <td className="num">{yen(m.points)}</td><td className="num">{m.answerCount}</td><td className="num">{m.mailBounce || ""}</td>
              <td className="acts"><Link className="link" href={`/admin/monitors/${m.id}`}>表示</Link>｜<Link className="link" href={`/admin/monitors/${m.id}?edit=1`}>編集</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </AdminPage>
  );
}
