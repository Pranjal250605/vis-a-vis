// Admin console API routes (A–G groups + the new features from 要求事項).
import { EXCHANGE_ITEMS, SURVEY_STATUSES, SURVEY_TYPES } from "@/lib/constants";
import { MAIL_TEMPLATE_KEYS } from "@/lib/constants";
import {
  ADMIN_COOKIE, ApiError, Route, createSession, csvList, destroySession, file, num, order, parseCookies, parseCsv, sortBy, str, strArr, toCsv, toSafeMonitor, Handler,
} from "./http";
import {
  ageOf, audit, fillTemplate, getStore, matchTarget, nextId, pointLots, resetStore, sendMail, summarizeTarget,
} from "./store";
import { authenticateAdmin } from "./auth";
import { checkPasswordPolicy, hashPassword } from "./security/passwords";
import { clientIp } from "./security/request";
import { validateProfile } from "./validate";
import type { Monitor, News, Question, Survey, TargetFilter } from "@/lib/types";

const A = (method: Route["method"], path: string, handler: Handler): Route => ({ method, path: "/admin" + path, guard: "admin", handler });

const fmtDT = (t: string | null) =>
  t ? new Date(t).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

const surveyRow = (sv: Survey) => {
  const answerCount = getStore().answers.filter((a) => a.surveyId === sv.id).length;
  return {
    id: sv.id, valid: sv.valid, status: sv.status, points: sv.points, title: sv.title, client: sv.client, type: sv.type, lang: sv.lang,
    questionCount: sv.questions.length, sampleTarget: sv.sampleTarget, answerCount,
    answerRate: sv.sampleTarget ? Math.round((answerCount / sv.sampleTarget) * 1000) / 10 : 0,
    startAt: sv.startAt, targetSummary: sv.targetSummary, shortUrl: sv.shortUrl, publicId: sv.publicId, endKind: sv.endKind, endValue: sv.endValue,
    editable: sv.status === "配信待ち",
  };
};

function surveyFromBody(b: any, existing?: Survey): Omit<Survey, "id" | "shortUrl" | "publicId" | "createdAt" | "valid" | "status"> {
  const s = getStore();
  const errors: Record<string, string> = {};
  const title = str(b.title);
  if (!title) errors.title = "タイトルを入力してください。";
  if (!(SURVEY_TYPES as readonly string[]).includes(str(b.type))) errors.type = "アンケートの種類を選択してください。";
  const points = b.points === "" || b.points == null ? null : Math.trunc(num(b.points, NaN));
  if (points !== null && (!Number.isFinite(points) || points < 0)) errors.points = "付与ポイント数は0以上の半角数字で入力してください。";
  const startAt = str(b.startAt) ? new Date(str(b.startAt)).toISOString() : new Date().toISOString();
  const endKind = b.endKind === "date" ? "date" : "sample";
  const sampleTarget = Math.trunc(num(b.sampleTarget, 0));
  if (endKind === "sample" && !(sampleTarget > 0)) errors.sampleTarget = "サンプル上限数を1以上で入力してください。";
  if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
  const target: TargetFilter = typeof b.target === "object" && b.target ? b.target : existing?.target ?? {};
  const questions: Question[] = Array.isArray(b.questions)
    ? b.questions.filter((q: any) => str(q.text)).map((q: any) => ({
        id: Number(q.id) > 0 ? Number(q.id) : nextId("question"), text: str(q.text),
        kind: ["単一選択", "複数選択", "自由記述"].includes(q.kind) ? q.kind : "単一選択", options: strArr(q.options).map((x) => x.trim()).filter(Boolean),
      }))
    : existing?.questions ?? [];
  return {
    lang: b.lang === "English" ? "English" : "日本語", client: str(b.client), title, type: str(b.type), cookieOff: !!b.cookieOff, points,
    preText: str(b.preText) || s.settings.defaultTexts.pre, postText: str(b.postText) || s.settings.defaultTexts.post,
    requestMail: str(b.requestMail) || s.settings.defaultTexts.request, startAt, endKind, endValue: endKind === "date" ? new Date(str(b.endValue) || Date.now()).toISOString() : String(sampleTarget),
    sampleTarget, questions, target, targetSummary: summarizeTarget(target),
  };
}

const answerCols = (sv: Survey) => sv.questions.flatMap((q, qi) =>
  q.kind === "複数選択" ? q.options.map((_, oi) => ({ h: `Q${qi + 1}_${oi + 1}`, q, oi })) : [{ h: `Q${qi + 1}`, q, oi: -1 }]);

function surveyCsv(sv: Survey, kind: string) {
  const s = getStore();
  if (kind === "label") {
    const rows: unknown[][] = [["設問No", "設問", "形式", "コード", "選択肢"]];
    sv.questions.forEach((q, qi) => {
      if (!q.options.length) rows.push([`Q${qi + 1}`, q.text, q.kind, "", ""]);
      q.options.forEach((o, oi) => rows.push([`Q${qi + 1}`, q.text, q.kind, oi + 1, o]));
    });
    return toCsv(rows);
  }
  const test = kind === "test" || kind === "test0";
  const blankZero = kind === "raw0" || kind === "test0";
  const cols = answerCols(sv);
  const head = ["モニター番号", "回答日時", ...cols.map((c) => c.h)];
  let data: { id: string | number; at: string; a: Record<number, string | string[]> }[];
  if (test) {
    // テスト配信（管理者）で得たダミー回答
    data = [1, 2, 3].map((n) => ({ id: `TEST${n}`, at: new Date().toISOString(), a: Object.fromEntries(sv.questions.map((q) => [q.id, q.kind === "複数選択" ? q.options.slice(0, n) : q.kind === "単一選択" ? q.options[(n - 1) % Math.max(1, q.options.length)] ?? "" : "テスト回答"])) }));
  } else data = s.answers.filter((a) => a.surveyId === sv.id).map((a) => ({ id: a.monitorId, at: a.at, a: a.answers }));
  const rows = data.map((d) => [d.id, fmtDT(d.at), ...cols.map((c) => {
    const v = d.a[c.q.id];
    let out: string | number;
    if (c.q.kind === "複数選択") out = Array.isArray(v) && v.includes(c.q.options[c.oi]) ? 1 : 0;
    else if (c.q.kind === "単一選択") out = c.q.options.indexOf(String(v ?? "")) + 1;
    else out = String(v ?? "");
    return blankZero && out === 0 ? "" : out;
  })]);
  return toCsv([head, ...rows]);
}

function filterTrades(q: URLSearchParams) {
  const s = getStore();
  const from = q.get("monitorFrom") ? Number(q.get("monitorFrom")) : null, to = q.get("monitorTo") ? Number(q.get("monitorTo")) : null;
  const name = str(q.get("name")), status = str(q.get("status")), item = str(q.get("item"));
  return s.trades.filter((t) =>
    (from == null || t.monitorId >= from) && (to == null || t.monitorId <= to) && (!name || t.name.includes(name)) && (!status || t.status === status) &&
    (!item || t.items.some((i) => i.item === item)));
}
const tradeRow = (t: ReturnType<typeof filterTrades>[number]) => ({
  id: t.id, appliedAt: t.appliedAt, monitorId: t.monitorId, name: t.name, items: t.items, itemsText: t.items.map((i) => `${i.item} ${i.units}口`).join(" / "),
  pointsUsed: t.pointsUsed, status: t.status, remark: t.remark,
});
const tradeSortKey = (k: string) => (t: ReturnType<typeof tradeRow>) =>
  k === "monitorId" ? t.monitorId : k === "name" ? t.name : k === "item" ? t.itemsText : k === "status" ? t.status : k === "points" ? t.pointsUsed : t.appliedAt;

function filterMonitors(q: URLSearchParams) {
  const s = getStore();
  const idFrom = q.get("idFrom") ? Number(q.get("idFrom")) : null, idTo = q.get("idTo") ? Number(q.get("idTo")) : null;
  const name = str(q.get("name")).replace(/[\s　]/g, ""), email = str(q.get("email")).toLowerCase(), tel = str(q.get("tel")).replace(/[-\s]/g, "");
  const status = str(q.get("status"));
  return s.monitors.filter((m) =>
    m.status !== "仮登録" &&
    (idFrom == null || m.id >= idFrom) && (idTo == null || m.id <= idTo) &&
    (!name || m.name.replace(/[\s　]/g, "").includes(name)) && // 部分一致 (Req.21)
    (!email || m.email.toLowerCase().includes(email)) &&
    (!tel || m.tel.replace(/-/g, "").includes(tel)) &&
    (!status || m.status === status));
}
const monitorRow = (m: Monitor) => ({
  id: m.id, status: m.status, name: m.name, email: m.email, tel: m.tel, prefecture: m.prefecture, city: m.city, registeredAt: m.registeredAt,
  lastLoginAt: m.lastLoginAt, lastAnsweredAt: m.lastAnsweredAt, points: m.points, answerCount: m.answerCount, mailBounce: m.mailBounce,
});

const MONITOR_CSV_HEAD = ["モニター番号", "状態", "メールアドレス", "氏名", "郵便番号", "都道府県", "市区町村", "丁目・番地", "電話番号", "生年月日", "性別", "既婚・未婚", "子供の人数",
  "子供について", "業種", "職種", "就業形態", "関心があるおでかけ先", "関心があるグルメ情報(ジャンル)", "関心があるグルメ情報(利用シーン・目的)", "読みたい情報", "関心がある生活情報",
  "利用媒体・コミュニティ", "登録日時", "最終ログイン日時", "最終回答日時", "個人情報変更日時", "回答数", "現在のポイント数", "ポイント交換回数", "交換ポイント数合計", "メール不達回数", "備考"];
const monitorCsvRow = (m: Monitor) => [m.id, m.status, m.email, m.name, m.postcode, m.prefecture, m.city, m.street, m.tel, m.birth, m.gender, m.married ? "既婚" : "未婚", m.children,
  m.childStages.join("|"), m.industry, m.jobType, m.employment, m.outings.join("|"), m.gourmetGenres.join("|"), m.gourmetScenes.join("|"), m.wantedInfos.join("|"), m.lifeInfos.join("|"),
  m.medias.join("|"), fmtDT(m.registeredAt), fmtDT(m.lastLoginAt), fmtDT(m.lastAnsweredAt), fmtDT(m.infoChangedAt), m.answerCount, m.points, m.exchangeCount, m.exchangePointsTotal, m.mailBounce, m.remark];

function deliverNews(n: News, adminName: string) {
  const s = getStore();
  const recipients = n.recipientIds.length ? s.monitors.filter((m) => n.recipientIds.includes(m.id) && m.status === "有効")
    : s.monitors.filter((m) => m.status === "有効" && m.mailBounce === 0);
  recipients.slice(0, 3).forEach((m) => sendMail(m.email, `【Vinsight】新着情報：${n.title}`, "新着情報メール", `${n.title}\n\n${n.body}\n\nマイページ：/mypage`));
  s.mailLogs.unshift({ id: nextId("mail"), at: new Date().toISOString(), to: `${recipients.length}名のモニター${n.recipientIds.length ? "（個別配信）" : ""}`, subject: `【Vinsight】新着情報：${n.title}`, kind: "新着情報メール（一括）", body: n.body });
  n.mailSent = true; n.mailSentCount = recipients.length;
  audit(adminName, "新着情報メール配信", `新着情報#${n.id}`, `${recipients.length}名へ配信`);
  return recipients.length;
}

function newsFromBody(b: any): Omit<News, "id" | "createdAt" | "mailSent" | "mailSentCount"> {
  const errors: Record<string, string> = {};
  const title = str(b.title);
  if (!title) errors.title = "タイトルを入力してください。";
  const places = strArr(b.places).filter((p): p is "ログイン前" | "マイページ内" => p === "ログイン前" || p === "マイページ内");
  if (!places.length) errors.places = "表示場所を1つ以上選択してください。";
  const s = getStore();
  const ids = csvList(String(b.recipients ?? "").replace(/[\s　]+/g, ",")).map(Number).filter((n) => Number.isInteger(n));
  const bad = ids.filter((id) => !s.monitors.some((m) => m.id === id));
  if (bad.length) errors.recipients = `存在しないモニター番号があります：${bad.join(", ")}`;
  if (ids.length && places.includes("ログイン前")) errors.places = "個別配信の場合、表示場所は「マイページ内」のみ指定できます。";
  if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
  const date = str(b.date) ? new Date(str(b.date)).toISOString() : new Date().toISOString();
  return {
    date, publishFrom: str(b.publishFrom) ? new Date(str(b.publishFrom)).toISOString() : date,
    publishTo: str(b.publishTo) ? new Date(str(b.publishTo)).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
    title, body: str(b.body), places, published: !!b.published, recipientIds: ids,
  };
}

export const adminRoutes: Route[] = [
  // ---------- 認証 ----------
  {
    method: "POST", path: "/admin/login",
    handler: (c) => {
      authenticateAdmin(str(c.body.id), str(c.body.password), clientIp(c.req));
      c.setCookie(ADMIN_COOKIE, createSession({ kind: "admin" }));
      return { ok: true };
    },
  },
  {
    method: "POST", path: "/admin/logout",
    handler: (c) => {
      destroySession(parseCookies(c.req.headers.get("cookie"))[ADMIN_COOKIE]);
      c.setCookie(ADMIN_COOKIE, null);
      return { ok: true };
    },
  },

  A("GET", "/dashboard", () => {
    const s = getStore();
    const count = (st: string) => s.surveys.filter((x) => x.status === st).length;
    // 直近6か月の回答数（ダッシュボードのグラフ用）
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    const answersByMonth = months.map((m) => ({ month: m, count: s.answers.filter((a) => a.at.slice(0, 7) === m).length }));
    const topSurveys = s.surveys.filter((x) => x.status === "配信中").map(surveyRow).sort((a, b) => b.answerRate - a.answerRate).slice(0, 5)
      .map((r) => ({ id: r.id, title: r.title, answerCount: r.answerCount, sampleTarget: r.sampleTarget, answerRate: r.answerRate }));
    return {
      answersByMonth, topSurveys,
      surveys: Object.fromEntries(SURVEY_STATUSES.map((st) => [st, count(st)])), surveyTotal: s.surveys.length,
      tradesUnshipped: s.trades.filter((t) => t.status === "未発送").length, tradesTotal: s.trades.length,
      monitorsValid: s.monitors.filter((m) => m.status === "有効").length, monitorsTotal: s.monitors.filter((m) => m.status !== "仮登録").length,
      activeMembers: s.monitors.filter((m) => m.status === "有効" && m.lastAnsweredAt && Date.now() - new Date(m.lastAnsweredAt).getTime() <= 90 * 86400000 && m.mailBounce === 0).length,
      withdrawals: s.withdrawals.length, newsPublished: s.news.filter((n) => n.published).length, inquiriesOpen: s.inquiries.filter((i) => i.status === "未対応").length,
      recentInquiries: s.inquiries.slice(0, 4), recentTrades: s.trades.slice(0, 5).map(tradeRow),
    };
  }),
  A("POST", "/reset-demo", () => { resetStore(); return { ok: true }; }),

  // ---------- A-1 アンケート管理 ----------
  A("GET", "/surveys", (c) => {
    const q = c.q;
    const free = str(q.get("q")).toLowerCase();
    const statuses = csvList(q.get("status"));
    const from = q.get("startFrom") ? new Date(q.get("startFrom")!).getTime() : null;
    const to = q.get("startTo") ? new Date(q.get("startTo")!).getTime() + 86399999 : null;
    const client = str(q.get("client")).toLowerCase(), cond = str(q.get("cond")).toLowerCase();
    const pf = q.get("pointsFrom") ? Number(q.get("pointsFrom")) : null, pt = q.get("pointsTo") ? Number(q.get("pointsTo")) : null;
    let rows = getStore().surveys.map(surveyRow).filter((r) =>
      (!free || [r.title, r.client, r.type, r.status, String(r.id)].some((x) => x.toLowerCase().includes(free))) && // フリーワード（部分一致） No.9-1
      (!statuses.length || statuses.includes(r.status)) &&
      (from == null || new Date(r.startAt).getTime() >= from) && (to == null || new Date(r.startAt).getTime() <= to) &&
      (!client || r.client.toLowerCase().includes(client)) &&
      (!cond || r.targetSummary.toLowerCase().includes(cond)) && // 配信条件（詳細） No.9-2
      (pf == null || (r.points ?? 0) >= pf) && (pt == null || (r.points ?? 0) <= pt)); // 付与ポイント数（詳細） No.9-2
    const k = q.get("sort") ?? "id";
    const key: Record<string, (r: (typeof rows)[number]) => string | number | null> = {
      id: (r) => r.id, status: (r) => r.status, point: (r) => r.points, title: (r) => r.title, question_num: (r) => r.questionCount,
      ans_num: (r) => r.answerCount, ans_par: (r) => r.answerRate, start_date: (r) => r.startAt, client: (r) => r.client,
    };
    rows = sortBy(rows, key[k] ?? key.id, order(q, "desc"));
    return { total: getStore().surveys.length, items: rows };
  }),
  A("POST", "/surveys", (c) => {
    const s = getStore();
    const body = surveyFromBody(c.body);
    const id = nextId("survey");
    const start = new Date(body.startAt).getTime();
    const sv: Survey = { ...body, id, shortUrl: `https://vinsight.example/enq/${(id * 7919).toString(36)}`, publicId: Math.random().toString(36).slice(2, 12), createdAt: new Date().toISOString(), valid: true, status: start > Date.now() ? "配信待ち" : "配信中" };
    s.surveys.unshift(sv);
    return { ok: true, id };
  }),
  A("GET", "/surveys/:id", (c) => {
    const sv = getStore().surveys.find((x) => x.id === Number(c.params.id));
    if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
    const matched = getStore().monitors.filter((m) => matchTarget(m, sv.target)).length;
    return { survey: sv, row: surveyRow(sv), targetMatched: matched };
  }),
  A("PUT", "/surveys/:id", (c) => {
    const sv = getStore().surveys.find((x) => x.id === Number(c.params.id));
    if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
    if (sv.status !== "配信待ち") throw new ApiError(409, "配信済みのアンケートは編集できません。コピーして新しいアンケートを作成してください。");
    Object.assign(sv, surveyFromBody(c.body, sv));
    return { ok: true };
  }),
  A("DELETE", "/surveys/:id", (c) => {
    const s = getStore();
    const i = s.surveys.findIndex((x) => x.id === Number(c.params.id));
    if (i < 0) throw new ApiError(404, "アンケートが見つかりません。");
    const id = s.surveys[i].id;
    s.surveys.splice(i, 1);
    s.answers = s.answers.filter((a) => a.surveyId !== id);
    audit("admin", "アンケート削除", `アンケート#${id}`, "");
    return { ok: true };
  }),
  // コピー（複製） No.11
  A("POST", "/surveys/:id/copy", (c) => {
    const s = getStore();
    const src = s.surveys.find((x) => x.id === Number(c.params.id));
    if (!src) throw new ApiError(404, "アンケートが見つかりません。");
    const id = nextId("survey");
    const copy: Survey = {
      ...structuredClone(src), id, title: `${src.title}（コピー）`, shortUrl: `https://vinsight.example/enq/${(id * 7919).toString(36)}`,
      publicId: Math.random().toString(36).slice(2, 12), createdAt: new Date().toISOString(), valid: true, status: "配信待ち",
      startAt: new Date(Date.now() + 7 * 86400000).toISOString(), questions: src.questions.map((q) => ({ ...q, id: nextId("question") })),
    };
    s.surveys.unshift(copy);
    audit("admin", "アンケートコピー", `アンケート#${src.id}`, `→ #${id}`);
    return { ok: true, id };
  }),
  // テスト配信（管理者メールアドレスのみ） No.12
  A("POST", "/surveys/:id/test-delivery", (c) => {
    const s = getStore();
    const sv = s.surveys.find((x) => x.id === Number(c.params.id));
    if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
    const to = s.settings.adminEmail;
    const body = fillTemplate(sv.requestMail, { id: 0, question_id: sv.id, title: sv.title, end_date: sv.endKind === "date" ? fmtDT(sv.endValue) : "（上限数に達するまで）", end_count: sv.sampleTarget, count: 0, point: sv.points ?? 0 });
    sendMail(to, `【テスト配信】${sv.title}`, "テスト配信", body);
    return { ok: true, to };
  }),
  A("POST", "/surveys/:id/toggle", (c) => {
    const sv = getStore().surveys.find((x) => x.id === Number(c.params.id));
    if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
    if (sv.status === "配信中") { sv.status = "非公開"; sv.valid = false; }
    else if (sv.status === "非公開") { sv.status = "配信中"; sv.valid = true; }
    else throw new ApiError(409, "配信中または非公開のアンケートのみ切り替えできます。");
    return { ok: true, status: sv.status };
  }),
  A("PUT", "/surveys/:id/questions", (c) => {
    const sv = getStore().surveys.find((x) => x.id === Number(c.params.id));
    if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
    if (sv.status !== "配信待ち") throw new ApiError(409, "配信済みのアンケートの設問は変更できません。");
    sv.questions = surveyFromBody({ ...sv, ...c.body, target: sv.target }, sv).questions;
    return { ok: true };
  }),
  A("PUT", "/surveys/:id/target", (c) => {
    const sv = getStore().surveys.find((x) => x.id === Number(c.params.id));
    if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
    if (sv.status !== "配信待ち") throw new ApiError(409, "配信済みのアンケートの配信条件は変更できません。");
    sv.target = c.body.target ?? {};
    sv.targetSummary = summarizeTarget(sv.target);
    if (c.body.endKind) { sv.endKind = c.body.endKind === "date" ? "date" : "sample"; sv.sampleTarget = Math.trunc(num(c.body.sampleTarget, sv.sampleTarget)); sv.endValue = sv.endKind === "date" ? new Date(str(c.body.endValue) || Date.now()).toISOString() : String(sv.sampleTarget); }
    return { ok: true, matched: getStore().monitors.filter((m) => matchTarget(m, sv.target)).length };
  }),
  A("GET", "/surveys/:id/csv", (c) => {
    const sv = getStore().surveys.find((x) => x.id === Number(c.params.id));
    if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
    const kind = c.q.get("kind") ?? "raw";
    const names: Record<string, string> = { label: "ラベル対応表", raw: "ローデータ", raw0: "ローデータ(0無)", test: "テストローデータ", test0: "テストローデータ(0無)" };
    if (!names[kind]) throw new ApiError(400, "不正な種類です。");
    return file(`survey${sv.id}_${kind}.csv`, surveyCsv(sv, kind));
  }),
  // 回答者向けプレビュー（内部IDとは別採番のIDで公開）
  { method: "GET", path: "/preview/:publicId", handler: (c) => {
    const sv = getStore().surveys.find((x) => x.publicId === c.params.publicId);
    if (!sv) throw new ApiError(404, "プレビューが見つかりません。");
    return { id: sv.id, title: sv.title, type: sv.type, points: sv.points, preText: sv.preText, postText: sv.postText, questions: sv.questions };
  } },

  // ---------- A-2 デフォルト設定 ----------
  A("GET", "/default-texts", () => ({ ...getStore().settings.defaultTexts, vars: ["%%id%%", "%%question_id%%", "%%title%%", "%%end_date%%", "%%end_count%%", "%%count%%", "%%point%%"] })),
  A("PUT", "/default-texts", (c) => {
    const d = getStore().settings.defaultTexts;
    d.pre = str(c.body.pre); d.post = str(c.body.post); d.request = str(c.body.request);
    return { ok: true };
  }),

  // ---------- B 新着情報管理 ----------
  A("GET", "/news", (c) => {
    const q = str(c.q.get("q")).toLowerCase();
    const now = Date.now();
    let rows = getStore().news.filter((n) => !q || n.title.toLowerCase().includes(q)).map((n) => ({
      ...n, state: new Date(n.publishFrom).getTime() <= now && new Date(n.publishTo).getTime() >= now ? "公開中" : new Date(n.publishFrom).getTime() > now ? "公開前" : "公開終了",
    }));
    rows = sortBy(rows, (n) => (c.q.get("sort") === "title" ? n.title : n.date), order(c.q, "desc"));
    return { total: rows.length, items: rows };
  }),
  A("GET", "/news/:id", (c) => {
    const n = getStore().news.find((x) => x.id === Number(c.params.id));
    if (!n) throw new ApiError(404, "新着情報が見つかりません。");
    return { news: n };
  }),
  A("POST", "/news", (c) => {
    const s = getStore();
    const n: News = { ...newsFromBody(c.body), id: nextId("news"), createdAt: new Date().toISOString(), mailSent: false, mailSentCount: 0 };
    s.news.unshift(n);
    let sent = 0;
    if (n.published && c.body.sendMail) sent = deliverNews(n, "admin"); // 公開時メール同時配信 No.15
    return { ok: true, id: n.id, mailSent: sent };
  }),
  A("PUT", "/news/:id", (c) => {
    const n = getStore().news.find((x) => x.id === Number(c.params.id));
    if (!n) throw new ApiError(404, "新着情報が見つかりません。");
    Object.assign(n, newsFromBody(c.body));
    let sent = 0;
    if (n.published && c.body.sendMail && !n.mailSent) sent = deliverNews(n, "admin");
    return { ok: true, mailSent: sent };
  }),
  A("DELETE", "/news/:id", (c) => {
    const s = getStore();
    const i = s.news.findIndex((x) => x.id === Number(c.params.id));
    if (i < 0) throw new ApiError(404, "新着情報が見つかりません。");
    s.news.splice(i, 1);
    return { ok: true };
  }),

  // ---------- C ポイント交換管理 ----------
  A("GET", "/trades", (c) => {
    const rows = sortBy(filterTrades(c.q).map(tradeRow), tradeSortKey(c.q.get("sort") ?? "appliedAt"), order(c.q, "desc")); // 既定：申請日の降順 No.19
    return { total: getStore().trades.length, items: rows, itemOptions: [...EXCHANGE_ITEMS.map((e) => e.key as string), "図書券", "クオカード"] };
  }),
  A("GET", "/trades/csv", (c) => {
    const rows = sortBy(filterTrades(c.q), (t) => t.appliedAt, "desc");
    return file("trades.csv", toCsv([["申請日", "モニター番号", "氏名", "郵便番号", "住所", "電話番号", "メールアドレス", "交換商品", "消費ポイント", "状態", "備考"],
      ...rows.map((t) => [fmtDT(t.appliedAt), t.monitorId, t.name, t.postcode, `${t.prefecture}${t.address1}${t.address2}`, t.tel, t.email, t.items.map((i) => `${i.item}${i.units}口`).join("/"), t.pointsUsed, t.status, t.remark])]));
  }),
  A("POST", "/trades/bulk-status", (c) => {
    const ids = (Array.isArray(c.body.ids) ? c.body.ids : []).map(Number);
    const status = c.body.status === "未発送" ? "未発送" : "発送済み";
    if (!ids.length) throw new ApiError(422, "更新する申請を選択してください。");
    const s = getStore();
    let n = 0;
    s.trades.filter((t) => ids.includes(t.id)).forEach((t) => {
      if (t.status !== status) {
        t.status = status; t.shippedAt = status === "発送済み" ? new Date().toISOString() : null;
        if (status === "発送済み") sendMail(t.email, "【Vinsight】商品を発送しました", "商品発送メール", fillTemplate(s.settings.mailTexts.tradeShipped, { id: t.monitorId, name: t.name, item: t.items.map((i) => `${i.item} ${i.units}口`).join(" / ") }));
        n++;
      }
    });
    return { ok: true, updated: n };
  }),
  A("GET", "/trades/:id", (c) => {
    const t = getStore().trades.find((x) => x.id === Number(c.params.id));
    if (!t) throw new ApiError(404, "申請が見つかりません。");
    return { trade: t }; // 「発送済」後もモニター情報を保持して表示 No.18
  }),
  A("PUT", "/trades/:id", (c) => {
    const s = getStore();
    const t = s.trades.find((x) => x.id === Number(c.params.id));
    if (!t) throw new ApiError(404, "申請が見つかりません。");
    const status = c.body.status === "発送済み" ? "発送済み" : "未発送";
    if (t.status !== status) {
      t.status = status; t.shippedAt = status === "発送済み" ? new Date().toISOString() : null;
      if (status === "発送済み") sendMail(t.email, "【Vinsight】商品を発送しました", "商品発送メール", fillTemplate(s.settings.mailTexts.tradeShipped, { id: t.monitorId, name: t.name, item: t.items.map((i) => `${i.item} ${i.units}口`).join(" / ") }));
    }
    t.remark = str(c.body.remark);
    return { ok: true };
  }),

  // ---------- 新設：ポイント付与 / ポイント付与一覧 ----------
  A("GET", "/points", (c) => {
    const s = getStore();
    const mid = c.q.get("monitorId") ? Number(c.q.get("monitorId")) : null, kind = str(c.q.get("kind"));
    const from = c.q.get("from") ? new Date(c.q.get("from")!).getTime() : null, to = c.q.get("to") ? new Date(c.q.get("to")!).getTime() + 86399999 : null;
    let rows = s.grants.filter((g) => (mid == null || g.monitorId === mid) && (!kind || g.kind === kind) && (from == null || new Date(g.at).getTime() >= from) && (to == null || new Date(g.at).getTime() <= to))
      .map((g) => ({ ...g, monitorName: s.monitors.find((m) => m.id === g.monitorId)?.name ?? "" }));
    const k = c.q.get("sort") ?? "at";
    rows = sortBy(rows, (g) => (k === "monitorId" ? g.monitorId : k === "points" ? g.points : k === "expiresAt" ? g.expiresAt : g.at), order(c.q, "desc"));
    return { total: s.grants.length, items: rows.slice(0, 500), expiryMonths: s.settings.pointExpiryMonths };
  }),
  A("POST", "/points", (c) => {
    const s = getStore();
    const ids = [...new Set(csvList(String(c.body.monitorIds ?? "").replace(/[\s　]+/g, ",")).map(Number))];
    const points = Math.trunc(num(c.body.points, NaN));
    const errors: Record<string, string> = {};
    if (!ids.length) errors.monitorIds = "モニター番号を入力してください（複数はカンマ区切り）。";
    const targets = ids.map((id) => s.monitors.find((m) => m.id === id && m.status === "有効"));
    const missing = ids.filter((_, i) => !targets[i]);
    if (ids.length && missing.length) errors.monitorIds = `有効なモニターが見つかりません：${missing.join(", ")}`;
    if (!(points >= 1 && points <= 100000)) errors.points = "付与ポイントは1〜100000の半角数字で入力してください。";
    if (!str(c.body.reason)) errors.reason = "付与理由を入力してください。";
    let expiresAt: string | null = null;
    if (c.body.expiry === "custom") { if (!str(c.body.expiresAt)) errors.expiresAt = "有効期限を入力してください。"; else expiresAt = new Date(str(c.body.expiresAt)).toISOString(); }
    else if (c.body.expiry !== "none" && s.settings.pointExpiryMonths > 0) expiresAt = new Date(new Date().setMonth(new Date().getMonth() + s.settings.pointExpiryMonths)).toISOString();
    if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
    targets.forEach((m) => {
      m!.points += points;
      s.grants.unshift({ id: nextId("grant"), monitorId: m!.id, points, kind: "手動付与", reason: str(c.body.reason), at: new Date().toISOString(), expiresAt, by: "admin" });
      if (c.body.notify) sendMail(m!.email, "【Vinsight】ポイントが付与されました", "ポイント付与通知", `${m!.name} 様\n\n${points}ポイントが付与されました。\n理由：${str(c.body.reason)}`);
    });
    audit("admin", "手動ポイント付与", `モニター${ids.join(",")}`, `${points}pt / ${str(c.body.reason)}`);
    return { ok: true, count: targets.length };
  }),
  A("GET", "/points/expiring", (c) => {
    const days = num(c.q.get("days"), 60);
    const s = getStore();
    const items = s.monitors.filter((m) => m.status === "有効").flatMap((m) =>
      pointLots(m.id).filter((l) => l.expiresAt && new Date(l.expiresAt).getTime() - Date.now() <= days * 86400000).map((l) => ({ monitorId: m.id, name: m.name, points: l.points, expiresAt: l.expiresAt })));
    return { days, items: sortBy(items, (x) => x.expiresAt, "asc") };
  }),

  // ---------- D モニター管理 ----------
  A("GET", "/monitors", (c) => {
    const k = c.q.get("sort") ?? "id";
    const key: Record<string, (m: Monitor) => string | number | null> = {
      id: (m) => m.id, name: (m) => m.name, lastLogin: (m) => m.lastLoginAt, lastAnswered: (m) => m.lastAnsweredAt, points: (m) => m.points, registered: (m) => m.registeredAt, answerCount: (m) => m.answerCount,
    };
    const rows = sortBy(filterMonitors(c.q), key[k] ?? key.id, order(c.q, "asc")).map(monitorRow); // 既定：モニター番号の昇順 No.23
    return { total: getStore().monitors.filter((m) => m.status !== "仮登録").length, items: rows };
  }),
  A("GET", "/monitors/csv", (c) => {
    const rows = sortBy(filterMonitors(c.q), (m) => m.id, "asc");
    return file("monitors.csv", toCsv([MONITOR_CSV_HEAD, ...rows.map(monitorCsvRow)])); // No.25
  }),
  A("POST", "/monitors/import", (c) => {
    const rows = parseCsv(String(c.body.csv ?? ""));
    if (rows.length < 2) throw new ApiError(422, "CSVにデータ行がありません。");
    const head = rows[0];
    const col = (name: string) => head.indexOf(name);
    if (col("モニター番号") < 0) throw new ApiError(422, "ヘッダーに「モニター番号」列が必要です。");
    const s = getStore();
    let updated = 0, skipped = 0;
    const problems: string[] = [];
    rows.slice(1).forEach((r, i) => {
      const id = Number(r[col("モニター番号")]);
      const m = s.monitors.find((x) => x.id === id);
      if (!m) { skipped++; problems.push(`${i + 2}行目：モニター番号${r[col("モニター番号")]}が存在しません（新規作成はできません）`); return; }
      const merged = { ...m, email: r[col("メールアドレス")] ?? m.email, name: r[col("氏名")] ?? m.name, tel: r[col("電話番号")] ?? m.tel, postcode: r[col("郵便番号")] ?? m.postcode, city: r[col("市区町村")] ?? m.city, street: r[col("丁目・番地")] ?? m.street };
      const { v, errors } = validateProfile({ ...merged, married: m.married });
      if (Object.keys(errors).length) { skipped++; problems.push(`${i + 2}行目：${Object.values(errors)[0]}`); return; }
      Object.assign(m, v, { infoChangedAt: new Date().toISOString() });
      updated++;
    });
    audit("admin", "モニターCSVインポート", "モニター", `更新${updated}件 / スキップ${skipped}件`);
    return { ok: true, updated, skipped, problems };
  }),
  A("GET", "/monitors/:id", (c) => {
    const s = getStore();
    const m = s.monitors.find((x) => x.id === Number(c.params.id));
    if (!m) throw new ApiError(404, "モニターが見つかりません。");
    return {
      monitor: toSafeMonitor(m), age: ageOf(m.birth),
      trades: s.trades.filter((t) => t.monitorId === m.id).map(tradeRow), grants: s.grants.filter((g) => g.monitorId === m.id).slice(0, 30),
      withdrawal: s.withdrawals.find((w) => w.monitorId === m.id) ?? null,
    };
  }),
  // 管理画面でのモニター情報編集 No.32（入力規制 No.24・監査ログ付き）
  A("PUT", "/monitors/:id", (c) => {
    const s = getStore();
    const m = s.monitors.find((x) => x.id === Number(c.params.id));
    if (!m) throw new ApiError(404, "モニターが見つかりません。");
    const { v, errors } = validateProfile(c.body);
    if (!errors.email && s.monitors.some((x) => x.id !== m.id && x.email.toLowerCase() === v.email.toLowerCase() && x.status !== "退会")) errors.email = "このメールアドレスは既に登録されています。";
    const status = str(c.body.status);
    if (m.status !== "退会" && !["有効", "無効"].includes(status)) errors.status = "状態を選択してください。";
    if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
    const diffs = (Object.keys(v) as (keyof typeof v)[]).filter((k) => JSON.stringify(v[k]) !== JSON.stringify(m[k])).map(String);
    if (m.status !== status && m.status !== "退会") diffs.push("status");
    if (m.remark !== str(c.body.remark)) diffs.push("remark");
    Object.assign(m, v, { remark: str(c.body.remark), infoChangedAt: new Date().toISOString() });
    if (m.status !== "退会") m.status = status as Monitor["status"];
    audit("admin", "モニター情報編集", `モニター${m.id}`, diffs.join(", ") || "変更なし");
    return { ok: true, changed: diffs };
  }),

  // ---------- E サンプル数調査 ----------
  A("POST", "/sample-count", (c) => {
    const s = getStore();
    const f: TargetFilter = c.body ?? {};
    const valid = s.monitors.filter((m) => m.status === "有効");
    const matched = valid.filter((m) => matchTarget(m, f));
    return { total: valid.length, sample: matched.length };
  }),

  // ---------- F 退会管理 ----------
  A("GET", "/withdrawals", (c) => {
    const s = getStore();
    const k = c.q.get("sort") ?? "at";
    const rows = sortBy(s.withdrawals.map((w) => ({ ...w, monitorName: s.monitors.find((m) => m.id === w.monitorId)?.name ?? "" })),
      (w) => (k === "monitorId" ? w.monitorId : k === "reason" ? w.reason : w.at), order(c.q, "desc")); // 既定：退会日時の降順 No.28
    return { total: rows.length, items: rows };
  }),

  // ---------- G 設定 ----------
  A("GET", "/settings", () => {
    const st = getStore().settings;
    return { adminId: st.adminId, passwordMasked: "••••••••", fromAddress: st.fromAddress, toAddresses: st.toAddresses, adminEmail: st.adminEmail, pointExpiryMonths: st.pointExpiryMonths };
  }),
  A("PUT", "/settings", (c) => {
    const st = getStore().settings;
    const errors: Record<string, string> = {};
    const emailOk = (x: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
    if (!str(c.body.adminId)) errors.adminId = "IDを入力してください。";
    if (!emailOk(str(c.body.fromAddress))) errors.fromAddress = "送信元メールアドレスを正しく入力してください。";
    const tos = csvList(String(c.body.toAddresses ?? ""));
    if (!tos.length || !tos.every(emailOk)) errors.toAddresses = "送信先メールアドレスを正しく入力してください（複数はカンマ区切り）。";
    if (!emailOk(str(c.body.adminEmail))) errors.adminEmail = "管理者メールアドレス（テスト配信先）を正しく入力してください。";
    const months = Math.trunc(num(c.body.pointExpiryMonths, 0));
    if (months < 0 || months > 60) errors.pointExpiryMonths = "0〜60の数字で入力してください（0＝有効期限なし）。";
    const passwordProblem = str(c.body.newPassword) && checkPasswordPolicy(str(c.body.newPassword), { identifiers: [str(c.body.adminId)] });
    if (passwordProblem) errors.newPassword = passwordProblem;
    if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
    st.adminId = str(c.body.adminId); st.fromAddress = str(c.body.fromAddress); st.toAddresses = tos.join(", "); st.adminEmail = str(c.body.adminEmail); st.pointExpiryMonths = months;
    if (str(c.body.newPassword)) st.adminPasswordHash = hashPassword(str(c.body.newPassword)); // ハッシュ化して保管（画面には表示しない）
    return { ok: true };
  }),
  A("GET", "/mail-texts", () => ({ templates: MAIL_TEMPLATE_KEYS.map((t) => ({ ...t, text: getStore().settings.mailTexts[t.key] ?? "" })) })),
  A("PUT", "/mail-texts", (c) => {
    const st = getStore().settings;
    MAIL_TEMPLATE_KEYS.forEach((t) => { if (typeof c.body[t.key] === "string") st.mailTexts[t.key] = c.body[t.key]; });
    return { ok: true };
  }),

  // ---------- 問い合わせ / メール履歴 / 監査ログ ----------
  A("GET", "/inquiries", (c) => {
    const kind = str(c.q.get("kind")), status = str(c.q.get("status"));
    return { items: getStore().inquiries.filter((i) => (!kind || i.kind === kind) && (!status || i.status === status)) };
  }),
  A("PATCH", "/inquiries/:id", (c) => {
    const i = getStore().inquiries.find((x) => x.id === Number(c.params.id));
    if (!i) throw new ApiError(404, "お問い合わせが見つかりません。");
    i.status = c.body.status === "未対応" ? "未対応" : "対応済み";
    return { ok: true };
  }),
  A("GET", "/mail-log", () => ({ items: getStore().mailLogs.slice(0, 200) })),
  A("GET", "/audit-log", () => ({ items: getStore().audits.slice(0, 200) })),
];
