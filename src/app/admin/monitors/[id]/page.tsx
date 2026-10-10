"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminPage, Panel, StatusPill } from "@/components/admin";
import { ProfileFields, profileFromMonitor, profilePayload, type ProfileForm } from "@/components/ProfileFields";
import { Alert, Row } from "@/components/ui";
import { api, ApiClientError, fmtDT, useApi, yen } from "@/lib/client";

function Detail() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const { data, reload, error } = useApi<any>(`/admin/monitors/${id}`);
  const [edit, setEdit] = useState(sp.get("edit") === "1");
  const [v, setV] = useState<ProfileForm | null>(null);
  const [status, setStatus] = useState("有効");
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);

  useEffect(() => { if (data) { setV(profileFromMonitor(data.monitor)); setStatus(data.monitor.status); setRemark(data.monitor.remark); } }, [data]);
  if (error) return <AdminPage title="モニター"><Alert kind="err">{error.message}</Alert></AdminPage>;
  if (!data || !v) return null;
  const m = data.monitor;
  const save = async () => {
    setErrors({}); setMsg(null);
    try {
      const r = await api<{ changed: string[] }>(`/admin/monitors/${id}`, { method: "PUT", body: { ...profilePayload(v), status, remark } });
      setMsg({ k: "ok", t: `保存しました。変更項目：${r.changed.length ? r.changed.join("、") : "なし"}（監査ログに記録されました）` }); setEdit(false); reload();
    } catch (e) { const x = e as ApiClientError; setErrors(x.fields); setMsg({ k: "err", t: x.message }); window.scrollTo({ top: 0 }); }
  };
  const canEdit = m.status !== "退会";

  return (
    <AdminPage code="D-1-1" title={`モニター ${m.id}　${m.name}`} crumbs="モニター管理 ＞ モニター一覧 ＞ モニター情報" req={edit ? "No.32 / No.24" : undefined}
      actions={<><Link href="/admin/monitors" className="btn line">一覧へ</Link>{canEdit && !edit && <button className="btn navy" onClick={() => setEdit(true)}>編集する</button>}<Link href={`/admin/points/grant?monitor=${m.id}`} className="btn line">ポイント付与</Link></>}>
      {msg && <Alert kind={msg.k}>{msg.t}</Alert>}
      {!edit ? (
        <>
          <Panel title="基本情報"><dl className="kv">
            <dt>状態</dt><dd><StatusPill s={m.status} /></dd><dt>モニター番号</dt><dd>{m.id}</dd><dt>氏名</dt><dd>{m.name}</dd>
            <dt>メールアドレス</dt><dd>{m.email}</dd><dt>電話番号</dt><dd>{m.tel}</dd><dt>生年月日（年齢）</dt><dd>{m.birth}（{data.age}歳）</dd>
            <dt>性別 / 婚姻 / 子供</dt><dd>{m.gender} / {m.married ? "既婚" : "未婚"} / {m.children}人{m.childStages.length ? `（${m.childStages.join("、")}）` : ""}</dd>
            <dt>現住所</dt><dd>〒{m.postcode}{"\n"}{m.prefecture}{m.city}{m.street}</dd>
            <dt>業種</dt><dd>{m.industry}</dd><dt>職種</dt><dd>{m.jobType}</dd><dt>就業形態</dt><dd>{m.employment}</dd>
            <dt>関心があるおでかけ先</dt><dd>{m.outings.join("、") || "－"}</dd><dt>グルメ（ジャンル）</dt><dd>{m.gourmetGenres.join("、") || "－"}</dd>
            <dt>グルメ（利用シーン）</dt><dd>{m.gourmetScenes.join("、") || "－"}</dd><dt>読みたい情報</dt><dd>{m.wantedInfos.join("、") || "－"}</dd>
            <dt>関心がある生活情報</dt><dd>{m.lifeInfos.join("、") || "－"}</dd><dt>利用媒体・コミュニティ</dt><dd>{m.medias.join("、") || "－"}</dd>
          </dl></Panel>
          <Panel title="利用状況"><dl className="kv">
            <dt>登録日</dt><dd>{fmtDT(m.registeredAt)}</dd><dt>最終ログイン日</dt><dd>{m.lastLoginAt ? fmtDT(m.lastLoginAt) : "未ログイン"}</dd><dt>最終回答日</dt><dd>{m.lastAnsweredAt ? fmtDT(m.lastAnsweredAt) : "未回答"}</dd>
            <dt>個人情報変更日</dt><dd>{m.infoChangedAt ? fmtDT(m.infoChangedAt) : "－"}</dd><dt>回答数</dt><dd>{m.answerCount}</dd><dt>現在のポイント数</dt><dd>{yen(m.points)} pt</dd>
            <dt>ポイント交換回数 / 合計</dt><dd>{m.exchangeCount}回 / {yen(m.exchangePointsTotal)} pt</dd><dt>メール不達回数</dt><dd>{m.mailBounce}</dd><dt>備考（管理者メモ）</dt><dd>{m.remark || "－"}</dd>
          </dl></Panel>
          {data.withdrawal && <Panel title="退会情報"><dl className="kv"><dt>退会日時</dt><dd>{fmtDT(data.withdrawal.at)}</dd><dt>退会理由</dt><dd>{data.withdrawal.reason || "（未入力）"}</dd></dl></Panel>}
          <div className="cols c2">
            <Panel title="ポイント交換履歴"><div className="tbl-wrap"><table className="tbl"><tbody>{data.trades.length === 0 ? <tr><td className="empty">履歴はありません。</td></tr> : data.trades.map((t: any) => <tr key={t.id}><td>{fmtDT(t.appliedAt)}</td><td>{t.itemsText}</td><td><StatusPill s={t.status} /></td></tr>)}</tbody></table></div></Panel>
            <Panel title="ポイント付与履歴（直近30件）"><div className="tbl-wrap"><table className="tbl"><tbody>{data.grants.map((g: any) => <tr key={g.id}><td>{fmtDT(g.at)}</td><td>{g.kind}<span className="sub">{g.reason}</span></td><td className="num">+{g.points}</td></tr>)}</tbody></table></div></Panel>
          </div>
        </>
      ) : (
        <Panel title="モニター情報の編集" sub="入力規制：半角・全角などの条件を満たさない値は保存できません。変更内容は監査ログに記録されます。">
          <div className="fm">
            <div className="two">
              <Row label="状態" error={errors.status}><select value={status} onChange={(e) => setStatus(e.target.value)}><option>有効</option><option>無効</option></select></Row>
              <Row label="メールアドレス" required error={errors.email} hint="半角英数字・記号"><input type="email" value={v.email} className={errors.email ? "invalid" : ""} onChange={(e) => setV({ ...v, email: e.target.value })} /></Row>
            </div>
            <ProfileFields v={v} set={(p) => setV({ ...v, ...p })} errors={errors} />
            <Row label="備考（管理者メモ）" optional><textarea value={remark} onChange={(e) => setRemark(e.target.value)} /></Row>
            <div className="fm-actions"><button className="btn navy" onClick={save}>登録</button><button className="btn line" onClick={() => { setEdit(false); setErrors({}); setV(profileFromMonitor(m)); }}>キャンセル</button></div>
          </div>
        </Panel>
      )}
    </AdminPage>
  );
}
export default function Page() { return <Suspense fallback={null}><Detail /></Suspense>; }
