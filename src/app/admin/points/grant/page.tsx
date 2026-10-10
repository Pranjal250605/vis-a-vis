"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPage, Panel } from "@/components/admin";
import { Alert, Row } from "@/components/ui";
import { api, ApiClientError, useApi } from "@/lib/client";

/** 管理者によるポイント付与（手動）— 要求事項 No.33（新設） */
function Grant() {
  const sp = useSearchParams();
  const [f, setF] = useState({ monitorIds: sp.get("monitor") ?? "", points: "", reason: "", expiry: "default", expiresAt: "", notify: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  const st = useApi<{ pointExpiryMonths: number }>("/admin/settings");
  const bad = (k: string) => (errors[k] ? "invalid" : "");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({}); setMsg(null);
    if (!confirm("入力内容でポイントを付与します。よろしいですか？")) return;
    try {
      const r = await api<{ count: number }>("/admin/points", { body: { ...f, expiresAt: f.expiresAt ? f.expiresAt + "T23:59:59+09:00" : "" } });
      setMsg({ k: "ok", t: `${r.count}名にポイントを付与しました。` }); setF({ ...f, points: "", reason: "" });
    } catch (ex) { const x = ex as ApiClientError; setErrors(x.fields); setMsg({ k: "err", t: x.message }); }
  };
  const months = st.data?.pointExpiryMonths ?? 0;
  return (
    <AdminPage title="ポイント付与（手動）" req="No.33" crumbs="ポイント管理 ＞ ポイント付与" actions={<Link href="/admin/points" className="btn line">ポイント付与一覧へ</Link>}>
      {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
      <Panel title="付与内容" sub="付与操作は「監査ログ」に記録されます。">
        <form className="fm" onSubmit={submit} noValidate style={{ maxWidth: 720 }}>
          <Row label="モニター番号" required error={errors.monitorIds} hint="複数の場合はカンマ区切り（例：1001, 1002）。モニター管理の詳細画面からも開けます。"><input type="text" value={f.monitorIds} className={bad("monitorIds")} onChange={(e) => setF({ ...f, monitorIds: e.target.value })} /></Row>
          <Row label="付与ポイント" required error={errors.points} hint="1〜100000の半角数字"><input type="number" min={1} max={100000} value={f.points} className={bad("points")} onChange={(e) => setF({ ...f, points: e.target.value })} style={{ maxWidth: 220 }} /></Row>
          <Row label="付与理由" required error={errors.reason}><input type="text" value={f.reason} className={bad("reason")} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="例）キャンペーン付与 / お詫び" /></Row>
          <Row label="ポイントの有効期限" error={errors.expiresAt}>
            <div className="inline">
              <label className="check"><input type="radio" name="exp" checked={f.expiry === "default"} onChange={() => setF({ ...f, expiry: "default" })} />標準（{months ? `付与日から${months}か月` : "有効期限なし"}）</label>
              <label className="check"><input type="radio" name="exp" checked={f.expiry === "none"} onChange={() => setF({ ...f, expiry: "none" })} />有効期限なし</label>
              <label className="check"><input type="radio" name="exp" checked={f.expiry === "custom"} onChange={() => setF({ ...f, expiry: "custom" })} />日付を指定</label>
              {f.expiry === "custom" && <input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} style={{ maxWidth: 190 }} />}
            </div>
          </Row>
          <label className="check"><input type="checkbox" checked={f.notify} onChange={(e) => setF({ ...f, notify: e.target.checked })} />付与をモニターにメールで通知する</label>
          <div className="fm-actions"><button className="btn navy" type="submit">付与する</button></div>
        </form>
      </Panel>
    </AdminPage>
  );
}
export default function Page() { return <Suspense fallback={null}><Grant /></Suspense>; }
