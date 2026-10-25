export type Gender = "男性" | "女性";
export type MonitorStatus = "有効" | "無効" | "仮登録" | "退会";

export interface Monitor {
  id: number; // モニター番号 (表記は「モニター番号」に統一 / Req.2)
  email: string;
  passwordHash: string;
  /** true until the member (carried over from the old site) has chosen a new password; cleared by the first change */
  passwordChangeRequired: boolean;
  name: string;
  postcode: string;
  prefecture: string;
  city: string;
  street: string;
  tel: string;
  birth: string; // YYYY-MM-DD
  gender: Gender;
  married: boolean;
  children: number;
  childStages: string[];
  industry: string;
  jobType: string;
  employment: string;
  outings: string[];
  gourmetGenres: string[];
  gourmetScenes: string[];
  wantedInfos: string[];
  lifeInfos: string[];
  medias: string[];
  registeredAt: string;
  lastLoginAt: string | null;
  prevLoginAt?: string | null; // 前回ログイン（マイページに表示 / 要求事項 No.7）
  lastAnsweredAt: string | null;
  infoChangedAt: string | null;
  answerCount: number;
  points: number;
  exchangeCount: number;
  exchangePointsTotal: number;
  mailBounce: number;
  status: MonitorStatus;
  remark: string;
  token?: string; // 本登録URL用トークン
}

export interface Question {
  id: number;
  text: string;
  kind: "単一選択" | "複数選択" | "自由記述";
  options: string[];
}

export interface TargetFilter {
  birthFrom?: string;
  birthTo?: string;
  ageFrom?: number;
  ageTo?: number;
  genders?: string[];
  married?: string[]; // "既婚" | "未婚"
  childrenFrom?: number;
  childrenTo?: number;
  childStages?: string[];
  industries?: string[];
  jobTypes?: string[];
  employments?: string[];
  postcode?: string;
  prefecture?: string;
  city?: string;
  outings?: string[];
  gourmetGenres?: string[];
  gourmetScenes?: string[];
  wantedInfos?: string[];
  lifeInfos?: string[];
  medias?: string[];
  activeOnly?: boolean;
}

export interface Survey {
  id: number;
  lang: "日本語" | "English";
  client: string;
  title: string;
  type: string;
  cookieOff: boolean;
  points: number | null;
  preText: string;
  postText: string;
  requestMail: string;
  shortUrl: string;
  publicId: string; // プレビュー用の別採番ID
  createdAt: string;
  valid: boolean;
  status: string;
  startAt: string;
  endKind: "sample" | "date";
  endValue: string; // sample上限数 or 終了日時
  sampleTarget: number;
  questions: Question[];
  target: TargetFilter;
  targetSummary: string; // 配信条件（詳細）の検索用テキスト
}

export interface SurveyAnswer {
  id: number;
  surveyId: number;
  monitorId: number;
  at: string;
  answers: Record<number, string | string[]>;
}

export interface News {
  id: number;
  date: string;
  publishFrom: string;
  publishTo: string;
  title: string;
  body: string;
  places: ("ログイン前" | "マイページ内")[];
  published: boolean;
  recipientIds: number[]; // 個別配信 (Req.14)。空配列＝全モニター
  mailSent: boolean; // 公開時メール同時配信 (Req.15)
  mailSentCount: number;
  createdAt: string;
}

export interface TradeItem {
  item: string;
  units: number;
  cardNo?: string;
}

export interface Trade {
  id: number;
  appliedAt: string;
  monitorId: number;
  name: string;
  postcode: string;
  prefecture: string;
  address1: string;
  address2: string;
  tel: string;
  email: string;
  birth: string;
  items: TradeItem[];
  pointsUsed: number;
  status: "未発送" | "発送済み";
  remark: string;
  shippedAt: string | null;
}

export interface Withdrawal {
  id: number;
  monitorId: number;
  at: string;
  reason: string;
}

export interface PointGrant {
  id: number;
  monitorId: number;
  points: number;
  kind: "手動付与" | "アンケート回答" | "ポイント交換" | "有効期限失効";
  reason: string;
  at: string;
  expiresAt: string | null;
  by: string;
}

export interface Inquiry {
  id: number;
  kind: "モニター" | "非モニター";
  monitorId: number | null;
  name: string;
  company: string;
  email: string;
  tel: string;
  body: string;
  at: string;
  status: "未対応" | "対応済み";
}

export interface MailLog {
  id: number;
  at: string;
  to: string;
  subject: string;
  kind: string;
  body: string;
}

export interface Settings {
  adminId: string;
  adminPasswordHash: string;
  fromAddress: string;
  toAddresses: string; // 送信先メールアドレス（カンマ区切り）
  adminEmail: string; // テスト配信先（管理者メールアドレス）
  pointExpiryMonths: number; // 0 = 有効期限なし (Req.6)
  mailTexts: Record<string, string>;
  defaultTexts: { pre: string; post: string; request: string };
}
