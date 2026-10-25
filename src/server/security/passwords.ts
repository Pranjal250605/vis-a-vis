// Password storage and policy (PDF #4, #5).
// Storage uses scrypt with a random salt per password (Node built-in; Argon2id/bcrypt would need an extra dependency).
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { PASSWORD_POLICY } from "./config";

const KEY_LEN = 32;
const COST = { N: 16384, r: 8, p: 1 };

/** Stored form: scrypt$<salt>$<hash>, both base64url. The plain password is never stored or logged. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN, COST);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, Buffer.from(salt, "base64url"), expected.length, COST);
  return timingSafeEqual(actual, expected);
}

// Used when the account does not exist, so "unknown account" takes as long as "wrong password".
const DECOY_HASH = hashPassword(randomBytes(8).toString("hex"));
export const verifyAgainstDecoy = (password: string) => { verifyPassword(password, DECOY_HASH); };

/**
 * A short fingerprint of the current password hash. Sessions and reset links carry it,
 * so they stop working as soon as the password changes.
 */
export const passwordStamp = (storedHash: string) => createHash("sha256").update(storedHash).digest("base64url").slice(0, 16);

// Passwords that are used all the time. A real deployment would also check a breached-password list.
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "passw0rd", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "iloveyou1", "admin123", "admin1234", "monitor123", "letmein123", "welcome123", "abc12345", "abcd1234", "vinsight123",
]);

const charClasses = (pw: string) =>
  [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;

export interface PasswordContext {
  /** Values the password must not equal (monitor number, e-mail address, ...). */
  identifiers: string[];
  /** The password being replaced; the new one must differ. */
  current?: string;
}

/** Returns an error message in Japanese, or null when the password is acceptable. */
export function checkPasswordPolicy(password: string, ctx: PasswordContext): string | null {
  const { minLength, maxLength, minCharClasses } = PASSWORD_POLICY;
  if (password.length < minLength || password.length > maxLength) return `パスワードは${minLength}文字以上${maxLength}文字以内で入力してください。`;
  if (!/^[\x21-\x7E]+$/.test(password)) return "パスワードは半角英数字・記号で入力してください（スペースは使えません）。";
  if (charClasses(password) < minCharClasses) return "パスワードには、英大文字・英小文字・数字・記号のうち2種類以上を含めてください。";
  const lower = password.toLowerCase();
  if (ctx.identifiers.some((id) => id && lower === id.toLowerCase())) return "モニター番号やメールアドレスと同じパスワードは使えません。";
  if (COMMON_PASSWORDS.has(lower)) return "よく使われるパスワードのため使えません。別のパスワードにしてください。";
  if (ctx.current !== undefined && password === ctx.current) return "現在のパスワードと同じものは使えません。";
  return null;
}
