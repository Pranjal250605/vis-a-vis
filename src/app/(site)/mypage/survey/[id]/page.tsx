"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMyPage } from "@/components/MypageContext";
import { Alert, Pill, SectionTitle } from "@/components/ui";
import { api, ApiClientError, useApi } from "@/lib/client";

export default function Answer() {
  const { id } = useParams<{ id: string }>();
  const { reload } = useMyPage();
  const { data, error } = useApi<any>(`/mypage/surveys/${id}`);
  const [ans, setAns] = useState<Record<number, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState<{ points: number; postText: string } | null>(null);

  if (error) return <section><Alert kind="err">{error.message}</Alert><Pill href="/mypage" left>マイページへ戻る</Pill></section>;
  if (!data) return null;

  if (done) return (
    <div className="done-box">
      <h2>ご回答ありがとうございました</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{done.postText}</p>
      {done.points > 0 && <p><b className="jost" style={{ fontSize: "2.6rem", color: "var(--orange)" }}>+{done.points}</b> point を獲得しました。</p>}
      <Pill href="/mypage">マイページへ戻る</Pill>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/person01.webp" alt="" />
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setErrors({});
    try { const r = await api<{ points: number; postText: string }>(`/mypage/surveys/${id}/answer`, { body: { answers: ans } }); setDone(r); reload(); window.scrollTo({ top: 0 }); }
    catch (ex) { const x = ex as ApiClientError; setErrors(x.fields); setMsg(x.message); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  return (
    <section>
      <div className="crumb" style={{ fontSize: "1.3rem", color: "#525252", marginBottom: 18 }}><Link href="/mypage" style={{ textDecoration: "underline" }}>マイページ</Link> ＞ アンケート回答</div>
      <SectionTitle small en={`No.${data.id}`} jp={data.title} />
      <p style={{ margin: "10px 0 20px", fontSize: "1.4rem" }}><span className="state">{data.type}</span>　謝礼：<b>{data.points ?? 0}</b> ポイント</p>
      <div className="pre-text">{data.preText}</div>
      <form className="fm" onSubmit={submit} noValidate>
        {msg && <Alert kind="err">{msg}</Alert>}
        {data.questions.map((q: any, i: number) => (
          <div className="survey-q" key={q.id}>
            <h4><span>Q{i + 1}</span>{q.text}</h4>
            <div className="opts">
              {q.kind === "自由記述" ? (
                <textarea value={(ans[q.id] as string) ?? ""} onChange={(e) => setAns({ ...ans, [q.id]: e.target.value })} />
              ) : q.options.map((o: string) => {
                const cur = ans[q.id];
                return q.kind === "単一選択" ? (
                  <label key={o} className="check"><input type="radio" name={`q${q.id}`} checked={cur === o} onChange={() => setAns({ ...ans, [q.id]: o })} />{o}</label>
                ) : (
                  <label key={o} className="check"><input type="checkbox" checked={Array.isArray(cur) && cur.includes(o)} onChange={(e) => { const arr = Array.isArray(cur) ? cur : []; setAns({ ...ans, [q.id]: e.target.checked ? [...arr, o] : arr.filter((x) => x !== o) }); }} />{o}</label>
                );
              })}
            </div>
            {errors[`q${q.id}`] && <div className="err" style={{ marginTop: 8 }}>{errors[`q${q.id}`]}</div>}
          </div>
        ))}
        <div className="form-actions"><Pill href="/mypage" variant="gray" short>戻る</Pill><Pill type="submit" short>回答を送信する</Pill></div>
      </form>
    </section>
  );
}
