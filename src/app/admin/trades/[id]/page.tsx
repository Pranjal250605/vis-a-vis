"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPage, Panel } from "@/components/admin";
import { Alert, Row } from "@/components/ui";
import { api, ApiClientError, fmtDT, useApi, yen } from "@/lib/client";

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, reload, error } = useApi<{ trade: any }>(`/admin/trades/${id}`);
  const [status, setStatus] = useState("未発送");
  const [remark, setRemark] = useState("");
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  useEffect(() => { if (data) { setStatus(data.trade.status); setRemark(data.trade.remark); } }, [data]);
  if (error) return <AdminPage title="発送処理"><Alert kind="err">{error.message}</Alert></AdminPage>;
  if (!data) return null;
  const t = data.trade;
  const save = async () => {
    try { await api(`/admin/trades/${id}`, { method: "PUT", body: { status, remark } }); setMsg({ k: "ok", t: "保存しました。" + (status === "発送済み" && t.status !== "発送済み" ? "発送メールを送信しました。" : "") }); reload(); }
    catch (e) { setMsg({ k: "err", t: (e as ApiClientError).message }); }
  };
  return (
    <AdminPage code="C-1-1" title={`発送処理 #${t.id}`} crumbs="ポイント交換管理 ＞ 申請一覧 ＞ 発送処理" actions={<Link className="btn line" href="/admin/trades">一覧へ</Link>}>
      {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
      <Alert kind="info">「発送済み」にしても、申請者（モニター）の情報は削除されず保持されます。<span className="req-tag">No.18</span></Alert>
      <Panel title="申請内容">
        <dl className="kv">
          <dt>申請日</dt><dd>{fmtDT(t.appliedAt)}</dd>
          <dt>モニター番号</dt><dd><Link className="link" href={`/admin/monitors/${t.monitorId}`}>{t.monitorId}</Link></dd>
          <dt>氏名</dt><dd>{t.name}</dd>
          <dt>お届け先住所</dt><dd>〒{t.postcode}{"\n"}{t.prefecture}{t.address1}{t.address2}</dd>
          <dt>電話番号</dt><dd>{t.tel}</dd><dt>メールアドレス</dt><dd>{t.email}</dd><dt>生年月日</dt><dd>{t.birth}</dd>
          <dt>交換商品</dt><dd>{t.items.map((i: any) => `${i.item}：${i.units}口${i.cardNo ? `（カード番号 ${i.cardNo}）` : ""}`).join("\n")}</dd>
          <dt>消費ポイント</dt><dd>{yen(t.pointsUsed)} pt</dd>
          <dt>発送日時</dt><dd>{t.shippedAt ? fmtDT(t.shippedAt) : "－"}</dd>
        </dl>
      </Panel>
      <Panel title="発送状態の更新">
        <div className="fm" style={{ maxWidth: 560 }}>
          <Row label="状態"><select value={status} onChange={(e) => setStatus(e.target.value)}><option>未発送</option><option>発送済み</option></select></Row>
          <Row label="備考"><input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} /></Row>
          <div className="fm-actions"><button className="btn navy" onClick={save}>登録</button><Link className="btn line" href="/admin/trades">キャンセル</Link></div>
        </div>
      </Panel>
    </AdminPage>
  );
}
