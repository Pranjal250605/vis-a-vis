// Public + monitor-facing API routes.
import { EXCHANGE_ITEMS, POINTS_PER_UNIT } from "@/lib/constants";
import { RE } from "@/lib/rules";
import {
  ADMIN_COOKIE, ApiError, Route, createSession, csvList, destroySession, MONITOR_COOKIE, parseCookies, EMAIL_RE, num, str, strArr, toSafeMonitor,
} from "./http";
import { fillTemplate, getStore, hashPassword, isActiveMember, matchTarget, newToken, nextId, pointLots, sendMail } from "./store";
import { validatePassword, validateProfile } from "./validate";
import type { Monitor } from "@/lib/types";

import { checkCaptcha, makeCaptchaId, makeResetToken, readResetToken } from "./tokens";

function visibleNews(m: Monitor | null, place: "ログイン前" | "マイページ内") {
  const now = Date.now();
  return getStore().news
    .filter((n) => n.published && n.places.includes(place) && new Date(n.publishFrom).getTime() <= now && new Date(n.publishTo).getTime() >= now)
    .filter((n) => n.recipientIds.length === 0 || (m && n.recipientIds.includes(m.id)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function fillMonitorMail(kind: string, m: Monitor, extra: Record<string, string | number> = {}) {
  const s = getStore();
  const body = fillTemplate(s.settings.mailTexts[kind] ?? "", { id: m.id, mail: m.email, name: m.name, tel: m.tel, postcode: m.postcode, pref: m.prefecture, address1: m.city, address2: m.street, ...extra });
  return body;
}

export const siteRoutes: Route[] = [
  // ---------- 認証 ----------
  {
    method: "POST", path: "/auth/login",
    handler: (c) => {
      const email = str(c.body.email).toLowerCase();
      const m = getStore().monitors.find((x) => x.email.toLowerCase() === email || String(x.id) === email);
      if (!m || m.passwordHash !== hashPassword(str(c.body.password))) throw new ApiError(401, "メールアドレス（またはモニター番号）かパスワードが正しくありません。");
      if (m.status === "仮登録") throw new ApiError(403, "本登録が完了していません。仮登録完了メールのURLから本登録を完了してください。");
      if (m.status !== "有効") throw new ApiError(403, "このアカウントではログインできません。");
      m.prevLoginAt = m.lastLoginAt;
      m.lastLoginAt = new Date().toISOString();
      c.setCookie(MONITOR_COOKIE, createSession({ kind: "monitor", monitorId: m.id }));
      return { ok: true };
    },
  },
  {
    method: "POST", path: "/auth/logout",
    handler: (c) => {
      const ck = parseCookies(c.req.headers.get("cookie"));
      destroySession(ck[MONITOR_COOKIE]);
      c.setCookie(MONITOR_COOKIE, null);
      return { ok: true };
    },
  },
  {
    method: "GET", path: "/auth/me",
    handler: (c) => {
      const ck = parseCookies(c.req.headers.get("cookie"));
      return { monitor: c.monitor ? { id: c.monitor.id, name: c.monitor.name } : null, admin: c.isAdmin, hasAdminCookie: !!ck[ADMIN_COOKIE] };
    },
  },

  // ---------- 新規登録（仮登録 → 本登録） ----------
  {
    method: "POST", path: "/register",
    handler: (c) => {
      const { v, errors } = validateProfile(c.body, { emailConfirm: true });
      validatePassword(str(c.body.password), str(c.body.passwordConfirm), errors);
      const s = getStore();
      if (!errors.email && s.monitors.some((m) => m.email.toLowerCase() === v.email.toLowerCase() && m.status !== "退会")) errors.email = "このメールアドレスは既に登録されています。";
      if (c.body.agree !== true) errors.agree = "個人情報保護方針への同意が必要です。";
      if (!checkCaptcha(c.body.captchaId, c.body.captcha)) errors.captcha = "画像認証の文字が正しくありません。";
      if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
      const id = Math.max(...s.monitors.map((m) => m.id)) + 1;
      const token = newToken();
      const m: Monitor = {
        ...v, id, passwordHash: hashPassword(str(c.body.password)), registeredAt: new Date().toISOString(), lastLoginAt: null, lastAnsweredAt: null,
        infoChangedAt: null, answerCount: 0, points: 0, exchangeCount: 0, exchangePointsTotal: 0, mailBounce: 0, status: "仮登録", remark: "", token,
      };
      s.monitors.push(m);
      const registUrl = `${c.origin}/register/complete?token=${token}`;
      sendMail(m.email, "【Vinsight】仮登録完了のお知らせ", "仮登録完了メール", fillMonitorMail("provisional", m, { regist_url: registUrl }));
      return { ok: true, id, registUrl };
    },
  },
  {
    method: "POST", path: "/register/complete",
    handler: (c) => {
      const s = getStore();
      const m = s.monitors.find((x) => x.token && x.token === str(c.body.token) && x.status === "仮登録");
      if (!m) throw new ApiError(404, "本登録URLが無効、または既に本登録済みです。");
      m.status = "有効"; m.token = undefined;
      sendMail(m.email, "【Vinsight】本登録完了のお知らせ", "本登録完了メール", fillMonitorMail("registered", m));
      return { ok: true, id: m.id };
    },
  },

  // ---------- パスワード再設定（平文のパスワードはメールしない） ----------
  {
    method: "POST", path: "/password-reset/request",
    handler: (c) => {
      const m = getStore().monitors.find((x) => x.email.toLowerCase() === str(c.body.email).toLowerCase() && x.status === "有効");
      let resetUrl: string | null = null;
      if (m) {
        const t = makeResetToken(m.id, m.passwordHash);
        resetUrl = `${c.origin}/password-reset/${t}`;
        sendMail(m.email, "【Vinsight】パスワード再設定", "パスワード再設定メール", fillMonitorMail("passwordReset", m, { reset_url: resetUrl }));
      }
      return { ok: true, resetUrl }; // デモのため再設定URLを返す（本番では返さない）
    },
  },
  {
    method: "POST", path: "/password-reset/confirm",
    handler: (c) => {
      const t = readResetToken(c.body.token);
      const m = t ? getStore().monitors.find((x) => x.id === t.id && x.status === "有効") : undefined;
      // パスワードを変更済みなら、同じURLは使えない（トークンに現在のパスワードの印が入っている）
      if (!m || !t || m.passwordHash.slice(0, 16) !== t.pw) throw new ApiError(404, "再設定URLが無効、または有効期限が切れています。");
      const errors: Record<string, string> = {};
      validatePassword(str(c.body.password), str(c.body.passwordConfirm), errors);
      if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
      m.passwordHash = hashPassword(str(c.body.password));
      return { ok: true };
    },
  },

  // ---------- 画像認証（デモ用SVG） ----------
  {
    method: "GET", path: "/captcha",
    handler: () => {
      const text = String(Math.floor(1000 + Math.random() * 9000));
      const id = makeCaptchaId(text);
      const chars = text.split("").map((ch, i) => `<text x="${12 + i * 24}" y="${30 + (i % 2) * 4}" font-size="${26 + (i % 3) * 2}" font-family="Jost,sans-serif" font-weight="700" fill="#002c83" transform="rotate(${(i % 2 ? 1 : -1) * 8} ${12 + i * 24} 28)">${ch}</text>`).join("");
      const noise = Array.from({ length: 4 }, (_, i) => `<line x1="${5 + i * 5}" y1="${8 + i * 9}" x2="${100 - i * 6}" y2="${38 - i * 7}" stroke="#fcc800" stroke-width="1.5"/>`).join("");
      return { id, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="46" viewBox="0 0 112 46"><rect width="112" height="46" fill="#f4f2f2"/>${noise}${chars}</svg>` };
    },
  },

  // ---------- 公開情報 ----------
  { method: "GET", path: "/public/news", handler: () => ({ items: visibleNews(null, "ログイン前").map((n) => ({ id: n.id, date: n.date, title: n.title, body: n.body })) }) },
  {
    // 非モニター（一般）用の問い合わせフォーム（要求事項 No.1）
    method: "POST", path: "/inquiries/visitor",
    handler: (c) => {
      const errors: Record<string, string> = {};
      const name = str(c.body.name), email = str(c.body.email), body = str(c.body.body);
      if (!name) errors.name = "お名前を入力してください。";
      if (!EMAIL_RE.test(email)) errors.email = "メールアドレスを正しく入力してください。";
      if (!body) errors.body = "お問い合わせ内容を入力してください。";
      if (!checkCaptcha(c.body.captchaId, c.body.captcha)) errors.captcha = "画像認証の文字が正しくありません。";
      if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
      const s = getStore();
      s.inquiries.unshift({ id: nextId("inquiry"), kind: "非モニター", monitorId: null, name, company: str(c.body.company), email, tel: str(c.body.tel), body, at: new Date().toISOString(), status: "未対応" });
      csvList(s.settings.toAddresses).forEach((to) => sendMail(to, "【Vinsight】お問い合わせ（非モニター）", "お問い合わせ通知", `${name} 様からお問い合わせがありました。\n\n${body}`));
      return { ok: true };
    },
  },

  // ---------- マイページ（モニター） ----------
  {
    method: "GET", path: "/mypage", guard: "monitor",
    handler: (c) => {
      const s = getStore();
      const m = c.monitor!;
      const answered = new Set(s.answers.filter((a) => a.monitorId === m.id).map((a) => a.surveyId));
      const surveys = s.surveys
        .filter((sv) => (sv.status === "配信中" && matchTarget(m, sv.target)) || answered.has(sv.id) || (sv.status === "配信終了" && matchTarget(m, sv.target)))
        .map((sv) => ({
          id: sv.id, date: sv.startAt, type: sv.type, title: sv.title, points: sv.points,
          state: answered.has(sv.id) ? "回答済み" : sv.status === "配信中" ? "回答する" : "終了",
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 40);
      const lots = pointLots(m.id);
      const soon = lots.filter((l) => l.expiresAt && new Date(l.expiresAt).getTime() - Date.now() <= 60 * 86400000);
      return {
        monitor: toSafeMonitor(m),
        news: visibleNews(m, "マイページ内").map((n) => ({ id: n.id, date: n.date, title: n.title, individual: n.recipientIds.length > 0 })),
        surveys,
        trades: s.trades.filter((t) => t.monitorId === m.id && t.status === "未発送").map((t) => ({ id: t.id, appliedAt: t.appliedAt, items: t.items, pointsUsed: t.pointsUsed, status: t.status })),
        expiry: { months: s.settings.pointExpiryMonths, lots, soon, soonTotal: soon.reduce((a, l) => a + l.points, 0), nextExpiry: lots.filter((l) => l.expiresAt).sort((a, b) => a.expiresAt!.localeCompare(b.expiresAt!))[0] ?? null },
        active: isActiveMember(m),
      };
    },
  },
  {
    method: "GET", path: "/mypage/news/:id", guard: "monitor",
    handler: (c) => {
      const n = visibleNews(c.monitor!, "マイページ内").find((x) => x.id === Number(c.params.id));
      if (!n) throw new ApiError(404, "お知らせが見つかりません。");
      return { id: n.id, date: n.date, title: n.title, body: n.body };
    },
  },
  {
    method: "GET", path: "/mypage/trade", guard: "monitor",
    handler: (c) => ({ monitor: toSafeMonitor(c.monitor!), items: EXCHANGE_ITEMS, unit: POINTS_PER_UNIT }),
  },
  {
    // ポイント交換申込み（要求事項 No.8：口数はプルダウンで選択）
    method: "POST", path: "/mypage/trade", guard: "monitor",
    handler: (c) => {
      const m = c.monitor!;
      const s = getStore();
      const errors: Record<string, string> = {};
      const items = (Array.isArray(c.body.items) ? c.body.items : [])
        .map((i: any) => ({ item: str(i.item), units: Math.trunc(num(i.units)), cardNo: str(i.cardNo) }))
        .filter((i: any) => i.units > 0 && EXCHANGE_ITEMS.some((e) => e.key === i.item));
      const used = items.reduce((a: number, i: any) => a + i.units * POINTS_PER_UNIT, 0);
      if (!items.length) errors.items = "交換する商品の口数を選択してください。";
      if (used > m.points) errors.items = `保有ポイント（${m.points}）を超えています。`;
      const tama = items.find((i: any) => i.item === "たまルンポイント");
      if (tama && !/^0526\d{9}$/.test(tama.cardNo)) errors.cardNo = "たまルンカード番号は「0526」から始まる13桁の半角数字で入力してください。";
      const { v, errors: pe } = validateProfile({ ...m, ...c.body, city: c.body.address1 ?? m.city, street: c.body.address2 ?? m.street, birth: c.body.birth || m.birth, industry: m.industry, jobType: m.jobType, employment: m.employment, gender: m.gender });
      ["name", "postcode", "prefecture", "city", "tel", "email"].forEach((k) => { if (pe[k]) errors[k] = pe[k]; });
      if (!checkCaptcha(c.body.captchaId, c.body.captcha)) errors.captcha = "画像認証の文字が正しくありません。";
      if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
      const t = {
        id: nextId("trade"), appliedAt: new Date().toISOString(), monitorId: m.id, name: v.name, postcode: v.postcode, prefecture: v.prefecture, address1: v.city,
        address2: v.street, tel: v.tel, email: v.email, birth: v.birth, items, pointsUsed: used, status: "未発送" as const, remark: "", shippedAt: null,
      };
      s.trades.unshift(t);
      m.points -= used; m.exchangeCount += 1; m.exchangePointsTotal += used;
      sendMail(v.email, "【Vinsight】ポイント交換のお申し込みを受け付けました", "ポイント交換申込受付確認メール",
        fillMonitorMail("tradeReceived", { ...m, ...v }, { item: items.map((i: any) => `${i.item} ${i.units}口`).join(" / ") }));
      return { ok: true, id: t.id, used, balance: m.points };
    },
  },
  { method: "GET", path: "/mypage/profile", guard: "monitor", handler: (c) => ({ monitor: toSafeMonitor(c.monitor!) }) },
  {
    method: "PUT", path: "/mypage/profile", guard: "monitor",
    handler: (c) => {
      const m = c.monitor!;
      const { v, errors } = validateProfile(c.body, { emailConfirm: true });
      const s = getStore();
      if (!errors.email && s.monitors.some((x) => x.id !== m.id && x.email.toLowerCase() === v.email.toLowerCase() && x.status !== "退会")) errors.email = "このメールアドレスは既に登録されています。";
      if (str(c.body.password)) validatePassword(str(c.body.password), str(c.body.passwordConfirm), errors);
      if (Object.keys(errors).length) throw new ApiError(422, "入力内容に誤りがあります。", errors);
      Object.assign(m, v, { infoChangedAt: new Date().toISOString() });
      if (str(c.body.password)) m.passwordHash = hashPassword(str(c.body.password));
      return { ok: true };
    },
  },
  {
    method: "POST", path: "/mypage/withdraw", guard: "monitor",
    handler: (c) => {
      if (c.body.agree !== true) throw new ApiError(422, "注意事項への同意が必要です。", { agree: "「上記内容に同意する」にチェックしてください。" });
      const m = c.monitor!;
      const s = getStore();
      s.withdrawals.unshift({ id: nextId("withdrawal"), monitorId: m.id, at: new Date().toISOString(), reason: str(c.body.reason) });
      m.status = "退会";
      const ck = parseCookies(c.req.headers.get("cookie"));
      destroySession(ck[MONITOR_COOKIE]);
      c.setCookie(MONITOR_COOKIE, null);
      return { ok: true };
    },
  },
  {
    // モニター用お問い合わせ（要求事項 No.3：モニター情報を表示・同時送信。非モニター用と分離）
    method: "POST", path: "/mypage/inquiry", guard: "monitor",
    handler: (c) => {
      const body = str(c.body.body);
      if (!body) throw new ApiError(422, "入力内容に誤りがあります。", { body: "お問い合わせ内容を入力してください。" });
      const m = c.monitor!;
      const s = getStore();
      s.inquiries.unshift({ id: nextId("inquiry"), kind: "モニター", monitorId: m.id, name: m.name, company: str(c.body.company), email: m.email, tel: m.tel, body, at: new Date().toISOString(), status: "未対応" });
      csvList(s.settings.toAddresses).forEach((to) => sendMail(to, `【Vinsight】お問い合わせ（モニター番号 ${m.id}）`, "お問い合わせ通知", `モニター番号：${m.id}\n氏名：${m.name}\n\n${body}`));
      return { ok: true };
    },
  },
  {
    method: "GET", path: "/mypage/surveys/:id", guard: "monitor",
    handler: (c) => {
      const s = getStore();
      const sv = s.surveys.find((x) => x.id === Number(c.params.id));
      if (!sv) throw new ApiError(404, "アンケートが見つかりません。");
      const done = s.answers.some((a) => a.surveyId === sv.id && a.monitorId === c.monitor!.id);
      if (done) throw new ApiError(409, "このアンケートは回答済みです。");
      if (sv.status !== "配信中") throw new ApiError(409, "このアンケートは終了しました。");
      if (!matchTarget(c.monitor!, sv.target)) throw new ApiError(403, "このアンケートの配信対象ではありません。");
      return { id: sv.id, title: sv.title, type: sv.type, points: sv.points, preText: sv.preText, postText: sv.postText, questions: sv.questions };
    },
  },
  {
    method: "POST", path: "/mypage/surveys/:id/answer", guard: "monitor",
    handler: (c) => {
      const s = getStore();
      const m = c.monitor!;
      const sv = s.surveys.find((x) => x.id === Number(c.params.id));
      if (!sv || sv.status !== "配信中" || !matchTarget(m, sv.target)) throw new ApiError(409, "このアンケートには回答できません。");
      if (s.answers.some((a) => a.surveyId === sv.id && a.monitorId === m.id)) throw new ApiError(409, "このアンケートは回答済みです。");
      const answers: Record<number, string | string[]> = {};
      const errors: Record<string, string> = {};
      sv.questions.forEach((q) => {
        const raw = c.body.answers?.[q.id];
        if (q.kind === "複数選択") {
          const arr = strArr(raw).filter((x) => q.options.includes(x));
          if (!arr.length) errors[`q${q.id}`] = "1つ以上選択してください。";
          answers[q.id] = arr;
        } else if (q.kind === "単一選択") {
          if (!q.options.includes(str(raw))) errors[`q${q.id}`] = "選択してください。";
          answers[q.id] = str(raw);
        } else answers[q.id] = str(raw);
      });
      if (Object.keys(errors).length) throw new ApiError(422, "未回答の設問があります。", errors);
      s.answers.push({ id: nextId("answer"), surveyId: sv.id, monitorId: m.id, at: new Date().toISOString(), answers });
      m.answerCount += 1; m.lastAnsweredAt = new Date().toISOString();
      const pts = sv.points ?? 0;
      if (pts > 0) {
        const months = s.settings.pointExpiryMonths;
        const exp = months > 0 ? new Date(new Date().setMonth(new Date().getMonth() + months)).toISOString() : null;
        s.grants.push({ id: nextId("grant"), monitorId: m.id, points: pts, kind: "アンケート回答", reason: `「${sv.title}」回答謝礼`, at: new Date().toISOString(), expiresAt: exp, by: "システム" });
        m.points += pts;
      }
      const cnt = s.answers.filter((a) => a.surveyId === sv.id).length;
      if (sv.endKind === "sample" && cnt >= Number(sv.endValue)) sv.status = "配信終了";
      return { ok: true, points: pts, postText: sv.postText };
    },
  },
];

void RE;
