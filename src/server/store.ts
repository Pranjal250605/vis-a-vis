// In-memory data store with dummy seed data (no database, per the demo brief).
// Data lives in globalThis so it survives hot reloads; restarting the server (or POST /api/admin/reset-demo) re-seeds it.
import { createHash, randomBytes } from "node:crypto";
import {
  CHILD_STAGES, EMPLOYMENTS, GOURMET_GENRES, GOURMET_SCENES, INDUSTRIES, JOB_TYPES, LIFE_INFOS, MEDIAS, OUTINGS,
  POINTS_PER_UNIT, PREFECTURES, WANTED_INFOS, SURVEY_TYPES,
} from "@/lib/constants";
import type {
  Inquiry, MailLog, Monitor, News, PointGrant, Question, Settings, Survey, SurveyAnswer, TargetFilter, Trade, Withdrawal,
} from "@/lib/types";

export interface Store {
  monitors: Monitor[];
  surveys: Survey[];
  answers: SurveyAnswer[];
  news: News[];
  trades: Trade[];
  withdrawals: Withdrawal[];
  grants: PointGrant[];
  inquiries: Inquiry[];
  mailLogs: MailLog[];
  settings: Settings;
  audits: { id: number; at: string; by: string; action: string; target: string; detail: string }[];
  seq: Record<string, number>;
}

/** 管理者操作の監査ログ（モニター情報編集・手動ポイント付与など） */
export function audit(by: string, action: string, target: string, detail: string) {
  const s = getStore();
  s.audits.unshift({ id: nextId("audit"), at: new Date().toISOString(), by, action, target, detail });
}

const SALT = "vinsight-demo-salt";
export const hashPassword = (pw: string) => createHash("sha256").update(SALT + pw).digest("hex");
export const newToken = () => randomBytes(12).toString("hex");

// ---------- deterministic RNG ----------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString();

export const DEMO_MONITOR = { email: "demo@vinsight.example", password: "monitor123", id: 1001 };
export const DEMO_ADMIN = { id: "admin", password: "admin123" };

const SURNAMES = ["佐藤","鈴木","高橋","田中","渡辺","伊藤","山本","中村","小林","加藤","吉田","山田","佐々木","山口","松本","井上","木村","林","斎藤","清水","森","池田","橋本","阿部","石川","藤田","岡田","前田","後藤","三宅"];
const GIVENS_F = ["花子","陽子","美咲","結衣","さくら","由美","恵子","愛","彩","真由美","千春","友美"];
const GIVENS_M = ["太郎","健一","翔太","大輔","拓也","誠","博之","直樹","和也","慎吾","悠斗","亮"];
const CITIES: [string, string, string][] = [
  ["700-0901","岡山市北区","本町"],["700-0927","岡山市北区","西古松"],["701-0221","岡山市南区","藤田"],["710-0055","倉敷市","阿知"],
  ["710-0046","倉敷市","中央"],["708-0841","津山市","川崎"],["703-8282","岡山市中区","原尾島"],["701-1221","岡山市北区","楢津"],
  ["706-0011","玉野市","宇野"],["714-0081","笠岡市","笠岡"],["719-1131","総社市","中央"],["700-0822","岡山市北区","表町"],
];

const mailText = {
  provisional: "%%mail%% 様\n\nVinsightにご登録いただきありがとうございます。\n以下のURLにアクセスして本登録を完了してください。\n\n%%regist_url%%\n\nモニター番号：%%id%%",
  registered: "モニター番号 %%id%% 様\n\n本登録が完了しました。マイページからアンケートにご回答ください。",
  tradeReceived: "%%name%% 様\n\nポイント交換のお申し込みを受け付けました。\n\n交換商品：%%item%%\nお届け先：〒%%postcode%% %%pref%%%%address1%%%%address2%%\nTEL：%%tel%%\n\nモニター番号：%%id%%",
  tradeShipped: "%%name%% 様\n\nご申請いただいた商品を発送（送付）いたしました。\n\n交換商品：%%item%%\nモニター番号：%%id%%",
  passwordReset: "モニター番号 %%id%% 様\n\nパスワード再設定のご依頼を受け付けました。\n以下のURLから新しいパスワードを設定してください（パスワード自体はメールでお送りしません）。\n\n%%reset_url%%",
};

function pick<T>(r: () => number, a: readonly T[]): T { return a[Math.floor(r() * a.length)]; }
function picks<T>(r: () => number, a: readonly T[], max: number): T[] {
  const n = Math.floor(r() * (max + 1));
  const out: T[] = [];
  for (let i = 0; i < n; i++) { const v = pick(r, a); if (!out.includes(v)) out.push(v); }
  return out;
}

function ageOf(birth: string, now = Date.now()) {
  const b = new Date(birth);
  const n = new Date(now);
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}
export { ageOf };

/** 有効会員：直近90日以内に回答があり、メールアドレスが不達でない */
export function isActiveMember(m: Monitor, now = Date.now()) {
  if (m.status !== "有効") return false;
  if (!m.lastAnsweredAt) return false;
  if (m.mailBounce > 0) return false;
  return now - new Date(m.lastAnsweredAt).getTime() <= 90 * DAY;
}

/** E-1 サンプル数調査 / A-1-4 配信条件 共通のフィルタ */
export function matchTarget(m: Monitor, f: TargetFilter): boolean {
  if (m.status !== "有効") return false;
  const any = (sel: string[] | undefined, vals: string[]) => !sel || sel.length === 0 || vals.some((v) => sel.includes(v));
  const age = ageOf(m.birth);
  if (f.birthFrom && m.birth < f.birthFrom) return false;
  if (f.birthTo && m.birth > f.birthTo) return false;
  if (f.ageFrom != null && !Number.isNaN(f.ageFrom) && age < f.ageFrom) return false;
  if (f.ageTo != null && !Number.isNaN(f.ageTo) && age > f.ageTo) return false;
  if (!any(f.genders, [m.gender])) return false;
  if (!any(f.married, [m.married ? "既婚" : "未婚"])) return false;
  if (f.childrenFrom != null && !Number.isNaN(f.childrenFrom) && m.children < f.childrenFrom) return false;
  if (f.childrenTo != null && !Number.isNaN(f.childrenTo) && m.children > f.childrenTo) return false;
  if (!any(f.childStages, m.childStages)) return false;
  if (!any(f.industries, [m.industry])) return false;
  if (!any(f.jobTypes, [m.jobType])) return false;
  if (!any(f.employments, [m.employment])) return false;
  if (f.postcode && !m.postcode.replace("-", "").startsWith(f.postcode.replace("-", ""))) return false;
  if (f.prefecture && m.prefecture !== f.prefecture) return false;
  if (f.city && !m.city.includes(f.city)) return false;
  if (!any(f.outings, m.outings)) return false;
  if (!any(f.gourmetGenres, m.gourmetGenres)) return false;
  if (!any(f.gourmetScenes, m.gourmetScenes)) return false;
  if (!any(f.wantedInfos, m.wantedInfos)) return false;
  if (!any(f.lifeInfos, m.lifeInfos)) return false;
  if (!any(f.medias, m.medias)) return false;
  if (f.activeOnly && !isActiveMember(m)) return false;
  return true;
}

export function summarizeTarget(f: TargetFilter): string {
  const p: string[] = [];
  if (f.ageFrom != null || f.ageTo != null) p.push(`年齢 ${f.ageFrom ?? ""}〜${f.ageTo ?? ""}歳`);
  if (f.genders?.length) p.push(`性別 ${f.genders.join("・")}`);
  if (f.married?.length) p.push(`婚姻 ${f.married.join("・")}`);
  if (f.prefecture) p.push(`都道府県 ${f.prefecture}`);
  if (f.city) p.push(`市区町村 ${f.city}`);
  if (f.jobTypes?.length) p.push(`職種 ${f.jobTypes.length}件`);
  if (f.industries?.length) p.push(`業種 ${f.industries.length}件`);
  if (f.employments?.length) p.push(`就業形態 ${f.employments.length}件`);
  if (f.gourmetGenres?.length) p.push(`グルメ ${f.gourmetGenres.join("・")}`);
  if (f.medias?.length) p.push(`媒体 ${f.medias.join("・")}`);
  if (f.activeOnly) p.push("有効会員のみ");
  return p.length ? p.join(" / ") : "登録はありません";
}

// ---------- seed ----------
function seed(): Store {
  const r = rng(20260925);
  const now = Date.now();
  const seq: Record<string, number> = { survey: 700, news: 0, trade: 0, withdrawal: 0, grant: 0, inquiry: 0, mail: 0, answer: 0, question: 0 };

  const settings: Settings = {
    adminId: DEMO_ADMIN.id,
    adminPasswordHash: hashPassword(DEMO_ADMIN.password),
    fromAddress: "no-reply@vinsight.example",
    toAddresses: "info@vinsight.example, support@vinsight.example",
    adminEmail: "admin@vinsight.example",
    pointExpiryMonths: 12,
    mailTexts: { ...mailText },
    defaultTexts: {
      pre: "このアンケートは調査目的のみに使用します。回答内容は統計的に処理され、個人が特定されることはありません。\n設問は全て必須です。守秘義務のため、アンケートの内容を第三者に開示しないでください。",
      post: "ご協力ありがとうございました。\n謝礼ポイントは回答完了後、マイページに反映されます。",
      request: "%%title%% のアンケートにご協力をお願いします。\n\n回答期限：%%end_date%%（先着 %%end_count%% 名）\n現在の回答数：%%count%%\n謝礼：%%point%% ポイント\n\nhttps://vinsight.example/enq/%%question_id%%",
    },
  };

  // ----- monitors -----
  const monitors: Monitor[] = [];
  const total = 64;
  for (let i = 0; i < total; i++) {
    const id = 1001 + i;
    const gender = r() < 0.55 ? "女性" : "男性";
    const name = pick(r, SURNAMES) + " " + pick(r, gender === "女性" ? GIVENS_F : GIVENS_M);
    const [pc, city, street] = pick(r, CITIES);
    const birthYear = 1962 + Math.floor(r() * 42);
    const birth = `${birthYear}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`;
    const married = r() < 0.55;
    const children = married ? Math.floor(r() * 4) : 0;
    const registeredAt = iso(now - (60 + Math.floor(r() * 1800)) * DAY);
    const answeredAgo = r() < 0.7 ? Math.floor(r() * 80) : 100 + Math.floor(r() * 400);
    const loginAgo = Math.min(answeredAgo, Math.floor(r() * 30));
    monitors.push({
      id, email: i === 0 ? DEMO_MONITOR.email : `user${id}@example.com`, passwordHash: hashPassword(DEMO_MONITOR.password),
      name: i === 0 ? "山田 花子" : name, postcode: pc, prefecture: "岡山県", city, street: `${street}${1 + Math.floor(r() * 9)}-${1 + Math.floor(r() * 20)}`,
      tel: `090-${String(1000 + Math.floor(r() * 8999))}-${String(1000 + Math.floor(r() * 8999))}`,
      birth: i === 0 ? "1988-04-12" : birth, gender: i === 0 ? "女性" : gender, married: i === 0 ? true : married, children: i === 0 ? 2 : children,
      childStages: children ? picks(r, CHILD_STAGES, 2).concat(i === 0 ? [CHILD_STAGES[1]] : []).filter((v, k, a) => a.indexOf(v) === k) : [],
      industry: pick(r, INDUSTRIES), jobType: pick(r, JOB_TYPES), employment: pick(r, EMPLOYMENTS),
      outings: picks(r, OUTINGS, 4), gourmetGenres: picks(r, GOURMET_GENRES, 4), gourmetScenes: picks(r, GOURMET_SCENES, 3),
      wantedInfos: picks(r, WANTED_INFOS, 3), lifeInfos: picks(r, LIFE_INFOS, 5), medias: picks(r, MEDIAS, 2),
      registeredAt, lastLoginAt: r() < 0.9 ? iso(now - loginAgo * DAY - Math.floor(r() * 80000000)) : null,
      lastAnsweredAt: r() < 0.9 ? iso(now - answeredAgo * DAY) : null, infoChangedAt: r() < 0.5 ? iso(now - Math.floor(r() * 300) * DAY) : null,
      answerCount: 0, points: 0, exchangeCount: 0, exchangePointsTotal: 0,
      mailBounce: r() < 0.08 ? 1 + Math.floor(r() * 3) : 0, status: r() < 0.06 ? "無効" : "有効", remark: r() < 0.15 ? "電話での問い合わせあり（対応済み）" : "",
    });
  }
  const demo = monitors[0];
  demo.status = "有効"; demo.mailBounce = 0; demo.lastLoginAt = iso(now - 2 * DAY); demo.lastAnsweredAt = iso(now - 12 * DAY);
  demo.outings = ["グルメ・食べ歩き", "カフェ・スイーツ", "温泉・日帰り旅・ドライブ"]; demo.gourmetGenres = ["ラーメン", "パン・ベーカリー", "カフェ"];
  demo.medias = ["タウン情報おかやま（雑誌）読者"]; demo.employment = "パート・アルバイト"; demo.jobType = "事務職（総務・経理・人事・一般事務・受付）";
  demo.industry = "小売業（百貨店・スーパー・コンビニ・ドラッグストア）";

  // ----- surveys -----
  const surveys: Survey[] = [];
  const answers: SurveyAnswer[] = [];
  const titles: [string, string, string][] = [
    ["岡山県の観光に関する意識調査", "岡山県 産業労働部 観光課", "本アンケート"],
    ["ご当地グルメの購買行動調査", "株式会社○○フーズ", "本アンケート"],
    ["あなたの好きな色・イメージ調査", "", "カラーイメージアンケート"],
    ["ウェルカムアンケート（基本属性）", "", "ウェルカムアンケート"],
    ["新商品パッケージ評価（事前）", "◇◇製菓株式会社", "事前アンケート"],
    ["新商品パッケージ評価（本調査）", "◇◇製菓株式会社", "本アンケート"],
    ["地域イベント参加動向調査", "岡山市 文化振興課", "オープンアンケート"],
    ["ドラッグストア利用実態調査", "株式会社△△ヘルスケア", "本アンケート"],
    ["スマートフォン決済の利用状況", "□□ペイメント株式会社", "事前アンケート"],
    ["スマートフォン決済の満足度", "□□ペイメント株式会社", "本アンケート"],
    ["フリーペーパー閲読調査", "地域メディア協議会", "本アンケート"],
    ["防災意識に関する調査", "倉敷市 危機管理室", "オープンアンケート"],
    ["パン・ベーカリーの利用調査", "○○ベーカリー", "本アンケート"],
    ["ラーメン店選びの決め手調査", "ラーメン本編集部", "本アンケート"],
    ["グランピング施設の利用意向", "△△リゾート株式会社", "事前アンケート"],
    ["グランピング施設のイメージ調査", "△△リゾート株式会社", "本アンケート"],
    ["就職活動に関する意識調査", "人材サービス部", "本アンケート"],
    ["デジタルサイネージの認知調査", "", "オープンアンケート"],
    ["BMX・スポーツ観戦に関する調査", "スポーツ振興課", "本アンケート"],
    ["健康・美容に関するアンケート", "□□化粧品株式会社", "本アンケート"],
    ["秋のお出かけ計画調査", "観光協会", "本アンケート"],
    ["ふるさと納税の利用実態", "◎◎総研", "事前アンケート"],
    ["インバウンド観光に関する意識調査", "岡山県観光連盟", "本アンケート"],
    ["オンライン動画サービス利用調査", "☆☆メディア", "本アンケート"],
  ];
  const qBank: Omit<Question, "id">[] = [
    { text: "あなたは過去1年間にこのサービス・商品を利用しましたか。", kind: "単一選択", options: ["よく利用する", "ときどき利用する", "あまり利用しない", "利用したことがない"] },
    { text: "利用する際に重視する点をすべてお選びください。", kind: "複数選択", options: ["価格", "品質", "利便性", "デザイン", "口コミ・評判", "地元のお店であること"] },
    { text: "全体的な満足度を教えてください。", kind: "単一選択", options: ["満足", "やや満足", "どちらともいえない", "やや不満", "不満"] },
    { text: "今後の利用意向を教えてください。", kind: "単一選択", options: ["ぜひ利用したい", "機会があれば利用したい", "利用したくない"] },
    { text: "情報を入手するメディアをすべてお選びください。", kind: "複数選択", options: ["情報誌", "Webメディア", "SNS", "テレビ", "チラシ", "友人・知人"] },
    { text: "ご意見・ご要望があれば自由にご記入ください。", kind: "自由記述", options: [] },
  ];
  titles.forEach(([title, client, type], idx) => {
    const id = ++seq.survey;
    const startOffset = (idx - 6) * 13 + Math.floor(r() * 5); // 過去〜未来
    const startAt = iso(now - startOffset * DAY);
    const sampleTarget = [30, 40, 50, 60][Math.floor(r() * 4)];
    const futureWaiting = startOffset < 0;
    const answersN = futureWaiting ? 0 : Math.min(sampleTarget, 8 + Math.floor(r() * 40));
    const ended = !futureWaiting && (answersN >= sampleTarget || startOffset > 45);
    const hidden = !futureWaiting && !ended && r() < 0.12;
    const status = futureWaiting ? "配信待ち" : ended ? "配信終了" : hidden ? "非公開" : "配信中";
    const nq = 3 + Math.floor(r() * 4);
    const questions: Question[] = Array.from({ length: nq }, (_, k) => ({ ...qBank[k % qBank.length], id: ++seq.question }));
    const target: TargetFilter = idx % 3 === 0 ? { ageFrom: 20, ageTo: 59, activeOnly: true } : idx % 3 === 1 ? { genders: ["女性"], prefecture: "岡山県" } : {};
    surveys.push({
      id, lang: "日本語", client, title, type, cookieOff: type === "オープンアンケート" && idx % 2 === 0,
      points: type === "ウェルカムアンケート" ? 50 : [30, 50, 100, 150, 200, null][Math.floor(r() * 6)],
      preText: settings.defaultTexts.pre, postText: settings.defaultTexts.post, requestMail: settings.defaultTexts.request,
      shortUrl: `https://vinsight.example/enq/${(id * 7919).toString(36)}`, publicId: newToken(),
      createdAt: iso(now - (startOffset + 7) * DAY), valid: status !== "非公開", status, startAt,
      endKind: idx % 4 === 3 ? "date" : "sample", endValue: idx % 4 === 3 ? iso(now - (startOffset - 30) * DAY) : String(sampleTarget),
      sampleTarget, questions, target, targetSummary: summarizeTarget(target),
    });
    // dummy answers
    const pool = monitors.filter((m) => m.status === "有効");
    for (let k = 0; k < answersN; k++) {
      const m = pool[(k * 7 + idx * 3) % pool.length];
      const ans: Record<number, string | string[]> = {};
      questions.forEach((q) => {
        if (q.kind === "単一選択") ans[q.id] = q.options[Math.floor(r() * q.options.length)];
        else if (q.kind === "複数選択") ans[q.id] = q.options.filter(() => r() < 0.4);
        else ans[q.id] = r() < 0.5 ? "" : "地元のお店をもっと紹介してほしいです。";
      });
      answers.push({ id: ++seq.answer, surveyId: id, monitorId: m.id, at: iso(new Date(startAt).getTime() + Math.floor(r() * 20) * DAY), answers: ans });
    }
  });

  // ----- point grants & trades -----
  const grants: PointGrant[] = [];
  const trades: Trade[] = [];
  const itemKeys = ["QUOカードPay", "Amazonギフト券（eメールタイプ）", "たまルンポイント", "図書券", "クオカード"];
  const expMonths = settings.pointExpiryMonths;
  const addMonths = (t: number, m: number) => { const d = new Date(t); d.setMonth(d.getMonth() + m); return d.getTime(); };
  monitors.forEach((m) => {
    const n = 3 + Math.floor(r() * 10);
    for (let k = 0; k < n; k++) {
      const at = now - Math.floor(r() * 330) * DAY;
      const pts = [30, 50, 100, 150, 200][Math.floor(r() * 5)];
      grants.push({ id: ++seq.grant, monitorId: m.id, points: pts, kind: "アンケート回答", reason: "アンケート回答謝礼", at: iso(at), expiresAt: iso(addMonths(at, expMonths)), by: "システム" });
    }
    m.answerCount = n;
  });
  // demo monitor: make sure some points expire soon
  grants.push({ id: ++seq.grant, monitorId: demo.id, points: 2500, kind: "手動付与", reason: "キャンペーン付与", at: iso(now - 340 * DAY), expiresAt: iso(now + 25 * DAY), by: "admin" });
  grants.push({ id: ++seq.grant, monitorId: demo.id, points: 1000, kind: "手動付与", reason: "お詫びポイント", at: iso(now - 20 * DAY), expiresAt: iso(addMonths(now - 20 * DAY, expMonths)), by: "admin" });

  const balance = (id: number) => grants.filter((g) => g.monitorId === id).reduce((a, g) => a + g.points, 0);
  monitors.forEach((m, idx) => {
    if (idx % 3 !== 0 && idx !== 0) return;
    let bal = balance(m.id);
    const tcount = idx === 0 ? 1 : Math.floor(r() * 3);
    for (let t = 0; t < tcount && bal >= POINTS_PER_UNIT; t++) {
      const itemKey = pick(r, itemKeys);
      const units = Math.max(1, Math.min(Math.floor(bal / POINTS_PER_UNIT), 1 + Math.floor(r() * 3)));
      const used = units * POINTS_PER_UNIT;
      bal -= used;
      const shipped = r() < 0.65;
      const at = iso(now - Math.floor(r() * 400) * DAY);
      trades.push({
        id: ++seq.trade, appliedAt: at, monitorId: m.id, name: m.name, postcode: m.postcode, prefecture: m.prefecture, address1: m.city, address2: m.street,
        tel: m.tel, email: m.email, birth: m.birth, items: [{ item: itemKey, units, cardNo: itemKey === "たまルンポイント" ? "0526" + String(Math.floor(r() * 1e9)).padStart(9, "0") : undefined }],
        pointsUsed: used, status: shipped ? "発送済み" : "未発送", remark: "", shippedAt: shipped ? iso(new Date(at).getTime() + 2 * DAY) : null,
      });
      m.exchangeCount++; m.exchangePointsTotal += used;
    }
    m.points = bal;
  });
  monitors.forEach((m) => { if (!trades.some((t) => t.monitorId === m.id)) m.points = balance(m.id); });
  // 追加の消費ポイントを同期（交換済み分を減算）
  monitors.forEach((m) => { m.points = balance(m.id) - m.exchangePointsTotal; });

  // ----- withdrawals -----
  const withdrawals: Withdrawal[] = [];
  const reasons = ["アンケートが届く頻度が多いため", "", "ポイント交換が面倒になった", "", "転居のため", "個人情報が心配になったため", "", "利用しなくなった"];
  const wd = monitors.slice(-8);
  wd.forEach((m, k) => {
    m.status = "退会";
    withdrawals.push({ id: ++seq.withdrawal, monitorId: m.id, at: iso(now - (3 + k * 17 + Math.floor(r() * 10)) * DAY), reason: reasons[k % reasons.length] });
  });

  // ----- news -----
  const news: News[] = [];
  const newsSeed: [string, string, ("ログイン前" | "マイページ内")[], boolean, number[]][] = [
    ["【重要】Vinsightがリニューアルします", "いつもVinsightをご利用いただきありがとうございます。\nより使いやすく、安全にご利用いただけるようサイトをリニューアルいたします。", ["ログイン前", "マイページ内"], true, []],
    ["ポイント交換商品に「QUOカードPay」を追加しました", "デジタルギフトのQUOカードPayへのポイント交換が可能になりました。1口500ポイントです。", ["マイページ内"], true, []],
    ["秋のアンケートキャンペーンのお知らせ", "10月中にアンケートへご回答いただいた方に、抽選でボーナスポイントをプレゼントします。", ["ログイン前", "マイページ内"], true, []],
    ["ポイント有効期限のお知らせ", "謝礼ポイントには獲得日から12か月の有効期限があります。マイページで失効予定のポイントをご確認ください。", ["マイページ内"], true, []],
    ["【個別のご案内】有効期限が近いポイントがあります", "お持ちのポイントの一部が、まもなく有効期限を迎えます。お早めにポイント交換をご利用ください。", ["マイページ内"], true, [1001]],
    ["年末年始の発送業務について", "12月28日〜1月5日はポイント交換の発送をお休みさせていただきます。", ["ログイン前", "マイページ内"], true, []],
    ["メンテナンスのお知らせ", "システムメンテナンスのため、一時的にご利用いただけない時間帯がございます。", ["マイページ内"], false, []],
    ["モニター登録情報の入力ご協力のお願い", "アンケートへのご回答には基本情報のご登録が必要です。マイページの「登録情報の確認・変更」からご入力ください。", ["マイページ内"], true, []],
    ["（終了）夏のポイント2倍キャンペーン", "ご参加ありがとうございました。", ["マイページ内"], true, []],
    ["お問い合わせ窓口が新しくなりました", "非モニターの方向けのお問い合わせフォームをログイン画面に設置しました。", ["ログイン前"], true, []],
  ];
  newsSeed.forEach(([title, body, places, published, rec], k) => {
    const date = now - (k * 9 + 1) * DAY;
    const ended = title.startsWith("（終了）");
    news.push({
      id: ++seq.news, date: iso(date), publishFrom: iso(date), publishTo: iso(ended ? now - 20 * DAY : now + 180 * DAY), title, body, places, published,
      recipientIds: rec, mailSent: k < 3, mailSentCount: k < 3 ? 52 : 0, createdAt: iso(date),
    });
  });

  // ----- inquiries -----
  const inquiries: Inquiry[] = [
    { id: ++seq.inquiry, kind: "非モニター", monitorId: null, name: "岡本 一郎", company: "", email: "okamoto@example.com", tel: "086-000-0001", body: "モニター登録の条件を教えてください。", at: iso(now - 3 * DAY), status: "未対応" },
    { id: ++seq.inquiry, kind: "モニター", monitorId: 1005, name: monitors[4].name, company: "", email: monitors[4].email, tel: monitors[4].tel, body: "ポイント交換の発送状況を知りたいです。", at: iso(now - 5 * DAY), status: "未対応" },
    { id: ++seq.inquiry, kind: "非モニター", monitorId: null, name: "株式会社サンプル 広報", company: "株式会社サンプル", email: "pr@example.com", tel: "03-0000-0000", body: "アンケート調査の依頼について相談したいです。", at: iso(now - 9 * DAY), status: "対応済み" },
  ];

  const mailLogs: MailLog[] = [
    { id: ++seq.mail, at: iso(now - 9 * DAY), to: "52名のモニター", subject: "【Vinsight】新着情報：【重要】Vinsightがリニューアルします", kind: "新着情報メール", body: "（新着情報の同時メール配信）" },
  ];

  return { monitors, surveys, answers, news, trades, withdrawals, grants, inquiries, mailLogs, settings, audits: [], seq };
}

declare global {
  // eslint-disable-next-line no-var
  var __vinsightStore: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__vinsightStore) globalThis.__vinsightStore = seed();
  return globalThis.__vinsightStore;
}
export function resetStore() {
  globalThis.__vinsightStore = seed();
  return globalThis.__vinsightStore;
}
export function nextId(name: string) {
  const s = getStore();
  s.seq[name] = (s.seq[name] ?? 0) + 1;
  return s.seq[name];
}

/** 送信メールの記録（デモでは実際には送信せず、管理画面の「送信メール履歴」に残す） */
export function sendMail(to: string, subject: string, kind: string, body: string) {
  const s = getStore();
  s.mailLogs.unshift({ id: nextId("mail"), at: new Date().toISOString(), to, subject, kind, body });
}

export function fillTemplate(tpl: string, vars: Record<string, string | number>) {
  return tpl.replace(/%%(\w+)%%/g, (_, k) => (k in vars ? String(vars[k]) : `%%${k}%%`));
}

/** 失効予定ポイント：古い（有効期限が早い）ロットから使用したものとして残高を計算 (Req.6) */
export function pointLots(monitorId: number, now = Date.now()) {
  const s = getStore();
  const spent = s.monitors.find((m) => m.id === monitorId)?.exchangePointsTotal ?? 0;
  const lots = s.grants
    .filter((g) => g.monitorId === monitorId && g.points > 0)
    .sort((a, b) => (new Date(a.expiresAt ?? "2999-01-01").getTime() - new Date(b.expiresAt ?? "2999-01-01").getTime()));
  let rest = spent;
  const out: { points: number; expiresAt: string | null }[] = [];
  for (const g of lots) {
    const use = Math.min(rest, g.points);
    rest -= use;
    const remain = g.points - use;
    if (remain > 0 && (!g.expiresAt || new Date(g.expiresAt).getTime() > now)) out.push({ points: remain, expiresAt: g.expiresAt });
  }
  return out;
}

export { SURVEY_TYPES };
