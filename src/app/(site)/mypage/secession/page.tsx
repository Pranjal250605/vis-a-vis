"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert, Pill, Row, SectionTitle } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function Secession() {
  const [reason, setReason] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!window.confirm("本当に退会しますか？この操作は取り消せません。")) return;
    try { await api("/mypage/withdraw", { body: { reason, agree } }); setDone(true); window.scrollTo({ top: 0 }); }
    catch (ex) { setErr((ex as ApiClientError).fields.agree ?? (ex as ApiClientError).message); }
  };

  if (done) return (
    <div className="done-box"><h2>退会手続きが完了しました</h2><p>これまでのご利用ありがとうございました。</p><Pill href="/">トップへ</Pill></div>
  );

  return (
    <section>
      <div className="crumb" style={{ fontSize: "1.3rem", color: "#525252", marginBottom: 18 }}><Link href="/mypage" style={{ textDecoration: "underline" }}>マイページ</Link> ＞ 退会</div>
      <SectionTitle small en="Withdrawal" jp="退会" />
      <div className="warn-list" style={{ margin: "20px 0 26px" }}>
        <ul>
          <li>退会すると、登録情報はすべて削除されます。</li>
          <li>保有しているポイントは失効します。</li>
          <li>退会後に再登録しても、失効したポイントは再発行できません。</li>
          <li>退会手続きとアンケート依頼メールの配信が入れ違いになる場合があります。</li>
        </ul>
      </div>
      <div className="fm">
        {err && <Alert kind="err">{err}</Alert>}
        <Row label="退会理由" optional hint="今後の改善のため、よろしければご記入ください。"><textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Row>
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />上記内容に同意する</label>
        <div className="form-actions"><Pill href="/mypage" variant="gray" short>戻る</Pill><Pill short onClick={submit} disabled={!agree}>退会する</Pill></div>
      </div>
    </section>
  );
}
