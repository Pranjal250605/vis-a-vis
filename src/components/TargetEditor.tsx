"use client";
import {
  CHILD_STAGES, EMPLOYMENTS, GOURMET_GENRES, GOURMET_SCENES, INDUSTRIES, JOB_TYPES, LIFE_INFOS, MEDIAS, OUTINGS, PREFECTURES, WANTED_INFOS,
} from "@/lib/constants";
import type { TargetFilter } from "@/lib/types";
import { Checks, Row } from "./ui";

const numOrUndef = (s: string) => (s === "" ? undefined : Number(s));

/** サンプル数調査(E-1) と 配信条件(A-1-4) 共通の絞り込み条件エディタ。新しいモニター情報項目（要求事項 No.24/26）も条件に使える。 */
export default function TargetEditor({ value: v, onChange }: { value: TargetFilter; onChange: (v: TargetFilter) => void }) {
  const set = (p: Partial<TargetFilter>) => onChange({ ...v, ...p });
  return (
    <div className="fm">
      <div className="sect">基本属性<small>BASIC</small></div>
      <div className="three">
        <Row label="生年月日（開始）"><input type="date" value={v.birthFrom ?? ""} onChange={(e) => set({ birthFrom: e.target.value || undefined })} /></Row>
        <Row label="生年月日（終了）"><input type="date" value={v.birthTo ?? ""} onChange={(e) => set({ birthTo: e.target.value || undefined })} /></Row>
        <Row label="年齢（歳〜歳）"><div className="two"><input type="number" min={0} value={v.ageFrom ?? ""} onChange={(e) => set({ ageFrom: numOrUndef(e.target.value) })} placeholder="から" /><input type="number" min={0} value={v.ageTo ?? ""} onChange={(e) => set({ ageTo: numOrUndef(e.target.value) })} placeholder="まで" /></div></Row>
      </div>
      <div className="three">
        <Row label="性別"><div className="inline">{["男性", "女性"].map((g) => <label className="check" key={g}><input type="checkbox" checked={(v.genders ?? []).includes(g)} onChange={(e) => set({ genders: e.target.checked ? [...(v.genders ?? []), g] : (v.genders ?? []).filter((x) => x !== g) })} />{g}</label>)}</div></Row>
        <Row label="未婚・既婚"><div className="inline">{["未婚", "既婚"].map((g) => <label className="check" key={g}><input type="checkbox" checked={(v.married ?? []).includes(g)} onChange={(e) => set({ married: e.target.checked ? [...(v.married ?? []), g] : (v.married ?? []).filter((x) => x !== g) })} />{g}</label>)}</div></Row>
        <Row label="子供の人数（人〜人）"><div className="two"><input type="number" min={0} value={v.childrenFrom ?? ""} onChange={(e) => set({ childrenFrom: numOrUndef(e.target.value) })} /><input type="number" min={0} value={v.childrenTo ?? ""} onChange={(e) => set({ childrenTo: numOrUndef(e.target.value) })} /></div></Row>
      </div>
      <Row label="子供について（新）"><Checks options={CHILD_STAGES} value={v.childStages ?? []} onChange={(x) => set({ childStages: x })} /></Row>

      <div className="sect">お仕事<small>WORK</small></div>
      <Row label="業種（日本産業分類・29区分）"><Checks options={INDUSTRIES} value={v.industries ?? []} onChange={(x) => set({ industries: x })} /></Row>
      <Row label="職種（国勢調査・15区分 / 新）"><Checks options={JOB_TYPES} value={v.jobTypes ?? []} onChange={(x) => set({ jobTypes: x })} /></Row>
      <Row label="就業形態（14区分 / 新）"><Checks options={EMPLOYMENTS} value={v.employments ?? []} onChange={(x) => set({ employments: x })} /></Row>

      <div className="sect">現住所<small>ADDRESS</small></div>
      <div className="three">
        <Row label="郵便番号（前方一致）"><input type="text" value={v.postcode ?? ""} onChange={(e) => set({ postcode: e.target.value || undefined })} placeholder="700" /></Row>
        <Row label="都道府県"><select value={v.prefecture ?? ""} onChange={(e) => set({ prefecture: e.target.value || undefined })}><option value="">指定なし</option>{PREFECTURES.map((p) => <option key={p}>{p}</option>)}</select></Row>
        <Row label="市区町村（部分一致）"><input type="text" value={v.city ?? ""} onChange={(e) => set({ city: e.target.value || undefined })} /></Row>
      </div>

      <div className="sect">興味・関心（新）<small>INTERESTS</small></div>
      <Row label="関心があるおでかけ先"><Checks options={OUTINGS} value={v.outings ?? []} onChange={(x) => set({ outings: x })} /></Row>
      <Row label="関心があるグルメ情報（ジャンル）"><Checks options={GOURMET_GENRES} value={v.gourmetGenres ?? []} onChange={(x) => set({ gourmetGenres: x })} /></Row>
      <Row label="関心があるグルメ情報（利用シーン・目的）"><Checks options={GOURMET_SCENES} value={v.gourmetScenes ?? []} onChange={(x) => set({ gourmetScenes: x })} /></Row>
      <Row label="読みたい情報"><Checks options={WANTED_INFOS} value={v.wantedInfos ?? []} onChange={(x) => set({ wantedInfos: x })} /></Row>
      <Row label="関心がある生活情報"><Checks options={LIFE_INFOS} value={v.lifeInfos ?? []} onChange={(x) => set({ lifeInfos: x })} /></Row>
      <Row label="利用媒体・コミュニティ"><Checks options={MEDIAS} value={v.medias ?? []} onChange={(x) => set({ medias: x })} /></Row>

      <label className="check"><input type="checkbox" checked={!!v.activeOnly} onChange={(e) => set({ activeOnly: e.target.checked })} /><span><b>有効会員のみ表示</b>（直近90日以内に回答があり、メールアドレスが不達でないモニターのみ）</span></label>
    </div>
  );
}
