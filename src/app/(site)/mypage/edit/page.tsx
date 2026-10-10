"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileFields, profileFromMonitor, profilePayload, type ProfileForm } from "@/components/ProfileFields";
import { useMyPage } from "@/components/MypageContext";
import { Alert, Pill, SectionTitle } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

export default function EditProfile() {
  const { data, reload } = useMyPage();
  const [v, setV] = useState<ProfileForm | null>(null);
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (data && !v) setV(profileFromMonitor(data.monitor)); }, [data, v]);
  if (!v) return null;

  const rows: [string, string][] = [
    ["メールアドレス", v.email], ["パスワード", v.password ? "変更する（非表示）" : "変更しない"],
    ["氏名", v.name], ["生年月日", v.birth], ["性別", v.gender], ["既婚・未婚", v.married], ["子供の人数", `${v.children}人${v.childStages.length ? `（${v.childStages.join("、")}）` : ""}`],
    ["住所", `〒${v.postcode}\n${v.prefecture}${v.city}${v.street}`], ["電話番号", v.tel],
    ["業種", v.industry], ["職種", v.jobType], ["就業形態", v.employment],
    ["関心があるおでかけ先", v.outings.join("、") || "－"], ["グルメ（ジャンル）", v.gourmetGenres.join("、") || "－"], ["グルメ（利用シーン）", v.gourmetScenes.join("、") || "－"],
    ["読みたい情報", v.wantedInfos.join("、") || "－"], ["生活情報", v.lifeInfos.join("、") || "－"], ["利用媒体・コミュニティ", v.medias.join("、") || "－"],
  ];

  const save = async () => {
    setBusy(true); setMsg("");
    try { await api("/mypage/profile", { method: "PUT", body: profilePayload(v) }); setStep("done"); reload(); window.scrollTo({ top: 0 }); }
    catch (ex) { const x = ex as ApiClientError; setErrors(x.fields); setMsg(x.message); setStep("form"); window.scrollTo({ top: 0 }); }
    finally { setBusy(false); }
  };

  if (step === "done") return (
    <div className="done-box"><h2>登録情報を更新しました</h2><p>最新の情報でアンケートが届きます。</p><Pill href="/mypage">マイページへ戻る</Pill></div>
  );

  if (step === "confirm") return (
    <section>
      <SectionTitle small en="Confirm" jp="登録情報の変更｜入力内容の確認" />
      <div className="confirm" style={{ marginTop: 20 }}><dl>{rows.map(([k, val]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{val}</dd></div>)}</dl></div>
      <div className="form-actions"><Pill variant="gray" short onClick={() => setStep("form")}>戻る</Pill><Pill short onClick={save} disabled={busy}>更新する</Pill></div>
    </section>
  );

  return (
    <section>
      <div className="crumb" style={{ fontSize: "1.3rem", color: "#525252", marginBottom: 18 }}><Link href="/mypage" style={{ textDecoration: "underline" }}>マイページ</Link> ＞ 登録情報の確認・変更</div>
      <SectionTitle small en="Profile" jp="登録情報の確認・変更" />
      <Alert kind="info"><span style={{ display: "block", marginTop: 0 }}>アンケートにお答えいただくには、基本情報の登録を完了していただく必要がございます。</span></Alert>
      <form className="fm" noValidate style={{ marginTop: 20 }} onSubmit={(e) => { e.preventDefault(); setMsg(""); setStep("confirm"); window.scrollTo({ top: 0 }); }}>
        {msg && <Alert kind="err">{msg}</Alert>}
        <ProfileFields v={v} set={(p) => setV({ ...v, ...p })} errors={errors} credentials passwordOptional />
        <div className="form-actions"><Pill href="/mypage" variant="gray" short>戻る</Pill><Pill type="submit" short>入力内容を確認する</Pill></div>
      </form>
    </section>
  );
}
