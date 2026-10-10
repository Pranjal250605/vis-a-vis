import {
  CHILD_STAGES, EMPLOYMENTS, GOURMET_GENRES, GOURMET_SCENES, INDUSTRIES, JOB_TYPES, LIFE_INFOS, MEDIAS, OUTINGS, PREFECTURES, WANTED_INFOS,
} from "@/lib/constants";
import { RE } from "@/lib/rules";
import { num, str, strArr } from "./http";
import type { Monitor } from "@/lib/types";

export type ProfileInput = Pick<Monitor,
  "email" | "name" | "postcode" | "prefecture" | "city" | "street" | "tel" | "birth" | "gender" | "married" | "children" | "childStages" |
  "industry" | "jobType" | "employment" | "outings" | "gourmetGenres" | "gourmetScenes" | "wantedInfos" | "lifeInfos" | "medias">;

const subset = (v: string[], list: readonly string[]) => v.filter((x) => list.includes(x));

/** 登録フォーム・マイページ・管理画面で共通のプロフィール検証 */
export function validateProfile(b: any, opts: { emailConfirm?: boolean } = {}) {
  const errors: Record<string, string> = {};
  const v: ProfileInput = {
    email: str(b.email), name: str(b.name), postcode: str(b.postcode), prefecture: str(b.prefecture), city: str(b.city), street: str(b.street),
    tel: str(b.tel), birth: str(b.birth), gender: str(b.gender) as any, married: b.married === true || b.married === "既婚" || b.married === "true",
    children: Math.trunc(num(b.children, 0)), childStages: subset(strArr(b.childStages), CHILD_STAGES),
    industry: str(b.industry), jobType: str(b.jobType), employment: str(b.employment),
    outings: subset(strArr(b.outings), OUTINGS), gourmetGenres: subset(strArr(b.gourmetGenres), GOURMET_GENRES),
    gourmetScenes: subset(strArr(b.gourmetScenes), GOURMET_SCENES), wantedInfos: subset(strArr(b.wantedInfos), WANTED_INFOS),
    lifeInfos: subset(strArr(b.lifeInfos), LIFE_INFOS), medias: subset(strArr(b.medias), MEDIAS),
  };
  if (!RE.email.test(v.email)) errors.email = "メールアドレスを半角で正しく入力してください。";
  if (opts.emailConfirm && v.email !== str(b.emailConfirm)) errors.emailConfirm = "メールアドレスが一致しません。";
  if (!v.name) errors.name = "氏名を入力してください。";
  else if (!RE.name.test(v.name)) errors.name = "氏名は全角で入力してください。";
  if (!RE.postcode.test(v.postcode)) errors.postcode = "郵便番号は半角数字（例：700-0901）で入力してください。";
  else v.postcode = v.postcode.includes("-") ? v.postcode : v.postcode.slice(0, 3) + "-" + v.postcode.slice(3);
  if (!PREFECTURES.includes(v.prefecture)) errors.prefecture = "都道府県を選択してください。";
  if (!v.city) errors.city = "市区町村を入力してください。";
  if (!RE.tel.test(v.tel)) errors.tel = "電話番号は半角数字とハイフン（例：090-1234-5678）で入力してください。";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.birth) || Number.isNaN(Date.parse(v.birth)) || new Date(v.birth) > new Date()) errors.birth = "生年月日を正しく入力してください。";
  if (!["男性", "女性"].includes(v.gender)) errors.gender = "性別を選択してください。";
  if (!(v.children >= 0 && v.children <= 20)) errors.children = "子供の人数は0〜20の半角数字で入力してください。";
  if (!INDUSTRIES.includes(v.industry)) errors.industry = "業種を選択してください。";
  if (!JOB_TYPES.includes(v.jobType)) errors.jobType = "職種を選択してください。";
  if (!EMPLOYMENTS.includes(v.employment)) errors.employment = "就業形態を選択してください。";
  return { v, errors };
}

export function validatePassword(pw: string, confirm: string, errors: Record<string, string>, key = "password") {
  if (!RE.password.test(pw)) errors[key] = "パスワードは半角英数字8文字以上（英字と数字を両方含む）で入力してください。";
  else if (pw !== confirm) errors[key + "Confirm"] = "パスワードが一致しません。";
}
