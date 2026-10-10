"use client";
import { AdminPage } from "@/components/admin";
import { fmtDT, useApi } from "@/lib/client";

/** デモでは実際のメール送信は行わず、送信内容をここに記録します。 */
export default function MailLog() {
  const { data } = useApi<{ items: any[] }>("/admin/mail-log");
  return (
    <AdminPage title="送信メール履歴" crumbs="運営 ＞ 送信メール履歴">
      <div className="alert _info">デモ環境のため、メールは実際には送信されず、送信予定の内容がここに記録されます（テスト配信・新着情報メール・登録メール・ポイント交換メールなど）。</div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>日時</th><th>種別</th><th>宛先</th><th>件名</th><th>本文</th></tr></thead>
        <tbody>{data?.items.map((m) => (
          <tr key={m.id}><td>{fmtDT(m.at)}</td><td><span className="pill">{m.kind}</span></td><td>{m.to}</td><td style={{ minWidth: 200 }}>{m.subject}</td>
            <td style={{ minWidth: 300 }}><details><summary style={{ cursor: "pointer", color: "var(--navy)" }}>本文を表示</summary><pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "8px 0 0" }}>{m.body}</pre></details></td></tr>
        ))}</tbody>
      </table></div>
    </AdminPage>
  );
}
