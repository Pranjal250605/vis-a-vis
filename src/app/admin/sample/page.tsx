"use client";
import { useState } from "react";
import { AdminPage, Panel } from "@/components/admin";
import TargetEditor from "@/components/TargetEditor";
import { Alert } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";
import type { TargetFilter } from "@/lib/types";

export default function Sample() {
  const [t, setT] = useState<TargetFilter>({});
  const [res, setRes] = useState<{ total: number; sample: number } | null>(null);
  const [err, setErr] = useState("");
  const show = async () => {
    setErr("");
    try { setRes(await api("/admin/sample-count", { body: t })); } catch (e) { setErr((e as ApiClientError).message); }
  };
  return (
    <AdminPage code="E-1" title="サンプル数調査" crumbs="サンプル数調査 ＞ サンプル数調査" req="No.26">
      {err && <Alert kind="err">{err}</Alert>}
      <Panel title="絞り込み条件" sub="新しいモニター情報項目（職種・就業形態・興味関心など）も条件に使えます。">
        <TargetEditor value={t} onChange={setT} />
        <div className="fm-actions" style={{ marginTop: 18 }}><button className="btn navy" onClick={show}>表示</button><button className="btn line" onClick={() => { setT({}); setRes(null); }}>条件をクリア</button></div>
      </Panel>
      {res && (
        <Panel title="結果">
          <div className="tiles">
            <div className="tile"><div className="k">全体（有効モニター）</div><div className="v">{res.total}<small>人</small></div></div>
            <div className="tile"><div className="k">サンプル数（条件に合致）</div><div className="v">{res.sample}<small>人</small></div></div>
            <div className="tile"><div className="k">出現率</div><div className="v">{res.total ? Math.round((res.sample / res.total) * 1000) / 10 : 0}<small>%</small></div></div>
          </div>
          <p className="hint" style={{ marginTop: 10 }}>※件数のみ表示します（一覧表は表示しません）。</p>
        </Panel>
      )}
    </AdminPage>
  );
}
