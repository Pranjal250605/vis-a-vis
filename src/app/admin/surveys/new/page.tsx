"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPage, Panel } from "@/components/admin";
import SurveyEditor, { emptySurvey, surveyPayload, type SurveyForm } from "@/components/SurveyEditor";
import { Alert } from "@/components/ui";
import { api, ApiClientError, useApi } from "@/lib/client";

export default function NewSurvey() {
  const router = useRouter();
  const defaults = useApi<{ pre: string; post: string; request: string }>("/admin/default-texts");
  const [f, setF] = useState<SurveyForm>(emptySurvey());
  const [tab, setTab] = useState<"basic" | "questions" | "target">("basic");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [seeded, setSeeded] = useState(false);

  // A-2 のデフォルト文言を初期値として入れる
  useEffect(() => { if (defaults.data && !seeded) { setF(emptySurvey(defaults.data)); setSeeded(true); } }, [defaults.data, seeded]);

  const save = async () => {
    setMsg(""); setErrors({});
    try { const r = await api<{ id: number }>("/admin/surveys", { body: surveyPayload(f) }); router.push(`/admin/surveys/${r.id}`); }
    catch (e) { const x = e as ApiClientError; setErrors(x.fields); setMsg(x.message); setTab("basic"); window.scrollTo({ top: 0 }); }
  };
  return (
    <AdminPage code="A-1-1" title="アンケート新規登録" crumbs="アンケート管理 ＞ アンケート一覧 ＞ 新規登録">
      {msg && <Alert kind="err">{msg}</Alert>}
      <Panel>
        <div className="tabs">{([["basic", "基本情報"], ["questions", "設問設定"], ["target", "配信条件"]] as const).map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
        <div style={{ marginTop: 16 }}><SurveyEditor f={f} set={(p) => setF({ ...f, ...p })} errors={errors} tab={tab} /></div>
        <div className="fm-actions" style={{ marginTop: 20 }}><button className="btn navy" onClick={save}>登録</button><Link href="/admin/surveys" className="btn line">キャンセル</Link></div>
      </Panel>
    </AdminPage>
  );
}
