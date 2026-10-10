"use client";
import { AdminPage } from "@/components/admin";
import { fmtDT, useApi } from "@/lib/client";

export default function AuditLog() {
  const { data } = useApi<{ items: any[] }>("/admin/audit-log");
  return (
    <AdminPage title="監査ログ" crumbs="運営 ＞ 監査ログ">
      <div className="alert _info">モニター情報の編集（No.32）・手動ポイント付与（No.33）・アンケート削除などの管理操作を記録します。</div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>日時</th><th>操作者</th><th>操作</th><th>対象</th><th>内容</th></tr></thead>
        <tbody>
          {data?.items.length === 0 && <tr><td colSpan={5} className="empty">記録はまだありません。</td></tr>}
          {data?.items.map((a) => <tr key={a.id}><td>{fmtDT(a.at)}</td><td>{a.by}</td><td>{a.action}</td><td>{a.target}</td><td>{a.detail}</td></tr>)}
        </tbody>
      </table></div>
    </AdminPage>
  );
}
