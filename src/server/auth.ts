// Sign-in and password-change rules, kept apart from the route table so each route stays a few lines.
import { ApiError } from "./http";
import { loginWaitMs, recordLoginFailure, recordLoginSuccess } from "./security/login-throttle";
import { hashPassword, verifyAgainstDecoy, verifyPassword } from "./security/passwords";
import { audit, getStore, sendMail } from "./store";
import type { Monitor } from "@/lib/types";

const LOGIN_FAILED = "メールアドレス（またはモニター番号）かパスワードが正しくありません。";

function assertNotThrottled(account: string, ip: string) {
  const wait = loginWaitMs(account, ip);
  if (wait > 0) throw new ApiError(429, `ログインの試行回数が多すぎます。${Math.ceil(wait / 1000)}秒ほど待ってから、もう一度お試しください。`, undefined, "TOO_MANY_ATTEMPTS");
}

/** Wrong credentials always look the same, whether the account exists or not (PDF #8). */
function fail(account: string, ip: string, message: string): never {
  recordLoginFailure(account, ip);
  audit("system", "ログイン失敗", account, `from ${ip}`);
  throw new ApiError(401, message);
}

/** Checks a member's e-mail address (or monitor number) and password and returns the member. Status checks come after the password. */
export function authenticateMonitor(identifier: string, password: string, ip: string): Monitor {
  const login = identifier.toLowerCase();
  const account = `monitor:${login}`;
  assertNotThrottled(account, ip);

  const m = getStore().monitors.find((x) => x.email.toLowerCase() === login || String(x.id) === login);
  const passwordOk = m ? verifyPassword(password, m.passwordHash) : (verifyAgainstDecoy(password), false);
  if (!m || !passwordOk) fail(account, ip, LOGIN_FAILED);

  recordLoginSuccess(account);
  if (m.status === "仮登録") throw new ApiError(403, "本登録が完了していません。仮登録完了メールのURLから本登録を完了してください。");
  if (m.status !== "有効") throw new ApiError(403, "このアカウントではログインできません。");
  audit(`monitor:${m.id}`, "ログイン", String(m.id), `from ${ip}`);
  return m;
}

export function authenticateAdmin(id: string, password: string, ip: string) {
  const { adminId, adminPasswordHash } = getStore().settings;
  const account = `admin:${id.toLowerCase()}`;
  assertNotThrottled(account, ip);
  const passwordOk = id === adminId ? verifyPassword(password, adminPasswordHash) : (verifyAgainstDecoy(password), false);
  if (!passwordOk) fail(account, ip, "IDまたはパスワードが正しくありません。");
  recordLoginSuccess(account);
  audit(`admin:${adminId}`, "管理者ログイン", adminId, `from ${ip}`);
}

/** Re-asks for the current password before a change, so a stolen session alone cannot take over the account. */
export function assertCurrentPassword(m: Monitor, password: string, ip: string) {
  const account = `change-password:${m.id}`;
  assertNotThrottled(account, ip);
  if (!verifyPassword(password, m.passwordHash)) {
    recordLoginFailure(account, ip);
    throw new ApiError(422, "入力内容に誤りがあります。", { currentPassword: "現在のパスワードが正しくありません。" });
  }
  recordLoginSuccess(account);
}

/**
 * Stores a new password and tells the member by e-mail. Every session made before this moment stops working
 * (sessions carry a stamp of the old password), so the caller must issue a new session cookie if the member stays signed in.
 */
export function setMonitorPassword(m: Monitor, newPassword: string, how: string) {
  m.passwordHash = hashPassword(newPassword);
  m.passwordChangeRequired = false;
  audit(`monitor:${m.id}`, "パスワード変更", String(m.id), how);
  sendMail(m.email, "【Vinsight】パスワードを変更しました", "パスワード変更完了メール",
    `${m.name} 様\n\nVinsightのパスワードが変更されました。\nお心当たりがない場合は、お問い合わせフォームからすぐにご連絡ください。\n\n※ Vinsightがメールや電話でパスワードをお聞きすることはありません。`);
}
