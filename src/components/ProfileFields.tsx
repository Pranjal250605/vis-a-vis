"use client";
import {
  CHILD_STAGES, EMPLOYMENTS, GOURMET_GENRES, GOURMET_SCENES, INDUSTRIES, JOB_TYPES, LIFE_INFOS, MEDIAS, OUTINGS, PREFECTURES, WANTED_INFOS,
} from "@/lib/constants";
import { INPUT_HINTS } from "@/lib/rules";
import { Checks, Row } from "./ui";

export interface ProfileForm {
  email: string; emailConfirm: string; currentPassword: string; password: string; passwordConfirm: string;
  name: string; postcode: string; prefecture: string; city: string; street: string; tel: string;
  birth: string; gender: string; married: string; children: string; childStages: string[];
  industry: string; jobType: string; employment: string;
  outings: string[]; gourmetGenres: string[]; gourmetScenes: string[]; wantedInfos: string[]; lifeInfos: string[]; medias: string[];
}

export const emptyProfile = (): ProfileForm => ({
  email: "", emailConfirm: "", currentPassword: "", password: "", passwordConfirm: "", name: "", postcode: "", prefecture: "岡山県", city: "", street: "", tel: "",
  birth: "", gender: "", married: "未婚", children: "0", childStages: [], industry: "", jobType: "", employment: "",
  outings: [], gourmetGenres: [], gourmetScenes: [], wantedInfos: [], lifeInfos: [], medias: [],
});

export const profileFromMonitor = (m: any): ProfileForm => ({
  ...emptyProfile(), email: m.email, emailConfirm: m.email, name: m.name, postcode: m.postcode, prefecture: m.prefecture, city: m.city, street: m.street, tel: m.tel,
  birth: m.birth, gender: m.gender, married: m.married ? "既婚" : "未婚", children: String(m.children), childStages: m.childStages ?? [],
  industry: m.industry, jobType: m.jobType, employment: m.employment, outings: m.outings ?? [], gourmetGenres: m.gourmetGenres ?? [],
  gourmetScenes: m.gourmetScenes ?? [], wantedInfos: m.wantedInfos ?? [], lifeInfos: m.lifeInfos ?? [], medias: m.medias ?? [],
});

// デモ用の簡易「住所自動入力」（実装時は郵便番号APIに置き換え）
const ZIP: Record<string, [string, string]> = {
  "700-0901": ["岡山市北区", "本町"], "700-0927": ["岡山市北区", "西古松"], "701-0221": ["岡山市南区", "藤田"], "710-0055": ["倉敷市", "阿知"],
  "710-0046": ["倉敷市", "中央"], "708-0841": ["津山市", "川崎"], "703-8282": ["岡山市中区", "原尾島"], "706-0011": ["玉野市", "宇野"],
  "714-0081": ["笠岡市", "笠岡"], "719-1131": ["総社市", "中央"], "700-0822": ["岡山市北区", "表町"],
};

export function ProfileFields({
  v, set, errors, credentials, passwordOptional, interests = true,
}: {
  v: ProfileForm; set: (p: Partial<ProfileForm>) => void; errors: Record<string, string>; credentials?: boolean; passwordOptional?: boolean; interests?: boolean;
}) {
  const bad = (k: string) => (errors[k] ? "invalid" : "");
  const autofill = () => {
    const hit = ZIP[v.postcode.includes("-") ? v.postcode : v.postcode.slice(0, 3) + "-" + v.postcode.slice(3)];
    if (hit) set({ prefecture: "岡山県", city: hit[0], street: hit[1] });
    else alert("該当する住所が見つかりません（デモでは岡山県内の一部郵便番号のみ対応）。");
  };
  return (
    <>
      {credentials && (
        <>
          <div className="sect">ログイン情報<small>LOGIN</small></div>
          <Row label="メールアドレス" required error={errors.email} hint={INPUT_HINTS.email}>
            <input type="email" autoComplete="email" value={v.email} className={bad("email")} onChange={(e) => set({ email: e.target.value })} />
          </Row>
          <Row label="メールアドレス（確認）" required error={errors.emailConfirm}>
            <input type="email" value={v.emailConfirm} className={bad("emailConfirm")} onChange={(e) => set({ emailConfirm: e.target.value })} />
          </Row>
          <Row label="パスワード" required={!passwordOptional} optional={passwordOptional} error={errors.password} hint={passwordOptional ? "変更する場合のみ入力してください。 " + INPUT_HINTS.password : INPUT_HINTS.password}>
            <input type="password" autoComplete="new-password" value={v.password} className={bad("password")} onChange={(e) => set({ password: e.target.value })} />
          </Row>
          <Row label="パスワード（確認）" required={!passwordOptional} optional={passwordOptional} error={errors.passwordConfirm}>
            <input type="password" autoComplete="new-password" value={v.passwordConfirm} className={bad("passwordConfirm")} onChange={(e) => set({ passwordConfirm: e.target.value })} />
          </Row>
          {passwordOptional && v.password && (
            <Row label="現在のパスワード" required error={errors.currentPassword} hint="パスワードを変更するときは、本人確認のため現在のパスワードも入力してください。">
              <input type="password" autoComplete="current-password" value={v.currentPassword} className={bad("currentPassword")} onChange={(e) => set({ currentPassword: e.target.value })} />
            </Row>
          )}
        </>
      )}

      <div className="sect">基本情報<small>PROFILE</small></div>
      <Row label="氏名" required error={errors.name} hint={INPUT_HINTS.name}>
        <input type="text" autoComplete="name" value={v.name} className={bad("name")} onChange={(e) => set({ name: e.target.value })} placeholder="例）山田 花子" />
      </Row>
      <Row label="生年月日" required error={errors.birth} hint={INPUT_HINTS.birth}>
        <input type="date" value={v.birth} className={bad("birth")} onChange={(e) => set({ birth: e.target.value })} />
      </Row>
      <Row label="性別" required error={errors.gender}>
        <div className="inline">{["男性", "女性"].map((g) => <label key={g} className="check"><input type="radio" name="gender" checked={v.gender === g} onChange={() => set({ gender: g })} />{g}</label>)}</div>
      </Row>
      <Row label="既婚（配偶者あり）・未婚（配偶者なし）" required>
        <div className="inline">{["既婚", "未婚"].map((g) => <label key={g} className="check"><input type="radio" name="married" checked={v.married === g} onChange={() => set({ married: g })} />{g}</label>)}</div>
      </Row>
      <Row label="子供の人数" required error={errors.children} hint={INPUT_HINTS.children}>
        <input type="number" min={0} max={20} inputMode="numeric" value={v.children} className={bad("children")} onChange={(e) => set({ children: e.target.value })} style={{ maxWidth: 140 }} />
      </Row>
      {Number(v.children) > 0 && (
        <Row label="子供について（複数選択可）" optional><Checks options={CHILD_STAGES} value={v.childStages} onChange={(x) => set({ childStages: x })} /></Row>
      )}

      <div className="sect">お住まい・連絡先<small>ADDRESS</small></div>
      <Row label="郵便番号" required error={errors.postcode} hint={INPUT_HINTS.postcode}>
        <div className="inline">
          <input type="text" inputMode="numeric" autoComplete="postal-code" value={v.postcode} className={bad("postcode")} onChange={(e) => set({ postcode: e.target.value })} style={{ maxWidth: 200 }} placeholder="700-0901" />
          <button type="button" className="btn-sm" onClick={autofill}>住所自動入力</button>
        </div>
      </Row>
      <Row label="都道府県" required error={errors.prefecture}>
        <select value={v.prefecture} className={bad("prefecture")} onChange={(e) => set({ prefecture: e.target.value })}>{PREFECTURES.map((p) => <option key={p}>{p}</option>)}</select>
      </Row>
      <Row label="市区町村" required error={errors.city}>
        <input type="text" autoComplete="address-level2" value={v.city} className={bad("city")} onChange={(e) => set({ city: e.target.value })} placeholder="岡山市北区" />
      </Row>
      <Row label="丁目・番地・建物名" optional error={errors.street} hint="ポイント交換のお申し込み時に再度入力できます。">
        <input type="text" value={v.street} onChange={(e) => set({ street: e.target.value })} />
      </Row>
      <Row label="電話番号" required error={errors.tel} hint={INPUT_HINTS.tel}>
        <input type="tel" autoComplete="tel" value={v.tel} className={bad("tel")} onChange={(e) => set({ tel: e.target.value })} placeholder="090-1234-5678" />
      </Row>

      <div className="sect">お仕事<small>WORK</small></div>
      <Row label="業種（日本産業分類に準拠）" required error={errors.industry}>
        <select value={v.industry} className={bad("industry")} onChange={(e) => set({ industry: e.target.value })}><option value="">選択してください</option>{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}</select>
      </Row>
      <Row label="職種（国勢調査に準拠）" required error={errors.jobType}>
        <select value={v.jobType} className={bad("jobType")} onChange={(e) => set({ jobType: e.target.value })}><option value="">選択してください</option>{JOB_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
      </Row>
      <Row label="就業形態" required error={errors.employment}>
        <select value={v.employment} className={bad("employment")} onChange={(e) => set({ employment: e.target.value })}><option value="">選択してください</option>{EMPLOYMENTS.map((x) => <option key={x}>{x}</option>)}</select>
      </Row>

      {interests && (
        <>
          <div className="sect">興味・関心<small>INTERESTS（任意）</small></div>
          <Row label="関心があるおでかけ先"><Checks options={OUTINGS} value={v.outings} onChange={(x) => set({ outings: x })} /></Row>
          <Row label="関心があるグルメ情報（ジャンル）"><Checks options={GOURMET_GENRES} value={v.gourmetGenres} onChange={(x) => set({ gourmetGenres: x })} /></Row>
          <Row label="関心があるグルメ情報（利用シーン・目的）"><Checks options={GOURMET_SCENES} value={v.gourmetScenes} onChange={(x) => set({ gourmetScenes: x })} /></Row>
          <Row label="読みたい情報"><Checks options={WANTED_INFOS} value={v.wantedInfos} onChange={(x) => set({ wantedInfos: x })} /></Row>
          <Row label="関心がある生活情報"><Checks options={LIFE_INFOS} value={v.lifeInfos} onChange={(x) => set({ lifeInfos: x })} /></Row>
          <Row label="利用媒体・コミュニティ"><Checks options={MEDIAS} value={v.medias} onChange={(x) => set({ medias: x })} /></Row>
        </>
      )}
    </>
  );
}

export function profilePayload(v: ProfileForm) {
  return { ...v, married: v.married === "既婚", children: Number(v.children) };
}
