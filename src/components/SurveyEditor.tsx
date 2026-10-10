"use client";
import { useState } from "react";
import { SURVEY_TYPES } from "@/lib/constants";
import { toLocalInput } from "@/lib/client";
import type { Question, Survey, TargetFilter } from "@/lib/types";
import TargetEditor from "./TargetEditor";
import { Checks, Row } from "./ui";

export interface SurveyForm {
  lang: string; client: string; title: string; type: string; cookieOff: boolean; points: string; preText: string; postText: string; requestMail: string;
  startAt: string; endKind: "sample" | "date"; endValue: string; sampleTarget: string; questions: Question[]; target: TargetFilter;
}

export const emptySurvey = (defaults?: { pre: string; post: string; request: string }): SurveyForm => ({
  lang: "日本語", client: "", title: "", type: "本アンケート", cookieOff: false, points: "", preText: defaults?.pre ?? "", postText: defaults?.post ?? "", requestMail: defaults?.request ?? "",
  startAt: toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()), endKind: "sample", endValue: "", sampleTarget: "300", questions: [], target: {},
});

export const surveyToForm = (s: Survey): SurveyForm => ({
  lang: s.lang, client: s.client, title: s.title, type: s.type, cookieOff: s.cookieOff, points: s.points == null ? "" : String(s.points), preText: s.preText, postText: s.postText,
  requestMail: s.requestMail, startAt: toLocalInput(s.startAt), endKind: s.endKind, endValue: s.endKind === "date" ? toLocalInput(s.endValue) : "", sampleTarget: String(s.sampleTarget),
  questions: s.questions, target: s.target,
});

export const surveyPayload = (f: SurveyForm) => ({ ...f, points: f.points === "" ? "" : Number(f.points), sampleTarget: Number(f.sampleTarget), startAt: f.startAt ? f.startAt + ":00+09:00" : "", endValue: f.endKind === "date" && f.endValue ? f.endValue + ":00+09:00" : f.endValue });

export default function SurveyEditor({
  f, set, errors, readOnly, tab, matched,
}: {
  f: SurveyForm; set: (p: Partial<SurveyForm>) => void; errors: Record<string, string>; readOnly?: boolean; tab: "basic" | "questions" | "target"; matched?: number | null;
}) {
  const [qErr] = useState("");
  void qErr;
  const bad = (k: string) => (errors[k] ? "invalid" : "");
  const setQ = (i: number, p: Partial<Question>) => set({ questions: f.questions.map((q, k) => (k === i ? { ...q, ...p } : q)) });

  return (
    <fieldset disabled={readOnly} className="fm">
      {tab === "basic" && (
        <>
          <Row label="言語選択"><div className="inline">{["日本語", "English"].map((l) => <label className="check" key={l}><input type="radio" name="lang" checked={f.lang === l} onChange={() => set({ lang: l })} />{l}</label>)}</div></Row>
          <div className="two">
            <Row label="クライアント名" optional><input type="text" value={f.client} onChange={(e) => set({ client: e.target.value })} /></Row>
            <Row label="タイトル" required error={errors.title}><input type="text" value={f.title} className={bad("title")} onChange={(e) => set({ title: e.target.value })} /></Row>
          </div>
          <Row label="アンケートの種類" required error={errors.type}>
            <div className="inline">{SURVEY_TYPES.map((t) => <label className="check" key={t}><input type="radio" name="type" checked={f.type === t} onChange={() => set({ type: t })} />{t}</label>)}</div>
          </Row>
          {f.type === "オープンアンケート" && <label className="check"><input type="checkbox" checked={f.cookieOff} onChange={(e) => set({ cookieOff: e.target.checked })} />Cookie制御を無効にする（オープンアンケート）</label>}
          <div className="three">
            <Row label="付与ポイント数" error={errors.points} hint="空欄＝ポイントなし"><input type="number" min={0} value={f.points} className={bad("points")} onChange={(e) => set({ points: e.target.value })} /></Row>
            <Row label="配信開始日時"><input type="datetime-local" value={f.startAt} onChange={(e) => set({ startAt: e.target.value })} /></Row>
            <Row label="サンプル数（目標）" error={errors.sampleTarget}><input type="number" min={1} value={f.sampleTarget} className={bad("sampleTarget")} onChange={(e) => set({ sampleTarget: e.target.value })} /></Row>
          </div>
          <Row label="アンケート前の文章" hint="未入力の場合は A-2「デフォルト設定」の文言が使われます。"><textarea value={f.preText} onChange={(e) => set({ preText: e.target.value })} /></Row>
          <Row label="アンケート後の文章"><textarea value={f.postText} onChange={(e) => set({ postText: e.target.value })} /></Row>
          <Row label="依頼メール文" hint={<>差し込み：<span className="vars">{["%%id%%", "%%question_id%%", "%%title%%", "%%end_date%%", "%%end_count%%", "%%count%%", "%%point%%"].map((v) => <code key={v}>{v}</code>)}</span></>}><textarea value={f.requestMail} onChange={(e) => set({ requestMail: e.target.value })} /></Row>
        </>
      )}

      {tab === "questions" && (
        <>
          {f.questions.length === 0 && <div className="alert _info">設問がありません。「設問を追加」から作成してください。</div>}
          {f.questions.map((q, i) => (
            <div className="qbox" key={q.id || i}>
              <div className="two" style={{ gridTemplateColumns: "1fr 180px" }}>
                <Row label={`Q${i + 1} 質問内容`}><input type="text" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} /></Row>
                <Row label="形式"><select value={q.kind} onChange={(e) => setQ(i, { kind: e.target.value as Question["kind"] })}>{["単一選択", "複数選択", "自由記述"].map((k) => <option key={k}>{k}</option>)}</select></Row>
              </div>
              {q.kind !== "自由記述" && <Row label="選択肢（1行に1つ）"><textarea style={{ minHeight: 90 }} value={q.options.join("\n")} onChange={(e) => setQ(i, { options: e.target.value.split("\n") })} /></Row>}
              <div className="btns">
                <button type="button" className="btn sm line" onClick={() => i > 0 && set({ questions: f.questions.map((x, k) => (k === i - 1 ? f.questions[i] : k === i ? f.questions[i - 1] : x)) })}>↑</button>
                <button type="button" className="btn sm line" onClick={() => i < f.questions.length - 1 && set({ questions: f.questions.map((x, k) => (k === i + 1 ? f.questions[i] : k === i ? f.questions[i + 1] : x)) })}>↓</button>
                <button type="button" className="btn sm danger" onClick={() => set({ questions: f.questions.filter((_, k) => k !== i) })}>削除</button>
              </div>
            </div>
          ))}
          <div><button type="button" className="btn line" onClick={() => set({ questions: [...f.questions, { id: 0, text: "", kind: "単一選択", options: ["", ""] }] })}>＋ 設問を追加</button></div>
        </>
      )}

      {tab === "target" && (
        <>
          <div className="alert _info">配信対象のモニターを絞り込みます。条件は E-1「サンプル数調査」と同じ属性項目です。{matched != null && <> 現在の保存済み条件に合致：<b>{matched}名</b></>}</div>
          <TargetEditor value={f.target} onChange={(t) => set({ target: t })} />
          <div className="sect">配信終了条件<small>END CONDITION</small></div>
          <div className="inline">
            <label className="check"><input type="radio" name="endKind" checked={f.endKind === "sample"} onChange={() => set({ endKind: "sample" })} />サンプル上限数による終了</label>
            <label className="check"><input type="radio" name="endKind" checked={f.endKind === "date"} onChange={() => set({ endKind: "date" })} />日時指定による終了</label>
          </div>
          {f.endKind === "sample" ? <Row label="サンプル上限数（回答がこの件数に達したら配信終了）"><input type="number" min={1} value={f.sampleTarget} onChange={(e) => set({ sampleTarget: e.target.value })} style={{ maxWidth: 200 }} /></Row>
            : <Row label="終了日時"><input type="datetime-local" value={f.endValue} onChange={(e) => set({ endValue: e.target.value })} style={{ maxWidth: 260 }} /></Row>}
        </>
      )}
    </fieldset>
  );
}

export { Checks };
