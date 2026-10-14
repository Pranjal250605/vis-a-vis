// Stateless signed tokens (HMAC-SHA256) for sessions, the image CAPTCHA and password-reset links.
//
// Why stateless: the demo keeps its data in memory, and a server restart used to wipe the in-memory session table,
// so a browser that was still logged in suddenly got "401" and was sent back to the login page on the next click.
// A signed token lives in the browser cookie and is verified with the secret, so a logged-in browser stays logged in
// across server restarts (as long as the account still exists in the seed data).
import { createHmac, timingSafeEqual } from "node:crypto";

// Demo secret. In a real deployment set VINSIGHT_SECRET to a long random value.
const SECRET = process.env.VINSIGHT_SECRET || "vinsight-demo-secret-change-me-in-production";

const mac = (data: string) => createHmac("sha256", SECRET).update(data).digest();

export function signToken(payload: Record<string, unknown>, ttlMs: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  return `${body}.${mac(body).toString("base64url")}`;
}

export function verifyToken<T extends Record<string, unknown> = Record<string, unknown>>(token?: string | null): (T & { exp: number }) | null {
  if (!token || token.length > 4000) return null;
  const i = token.indexOf(".");
  if (i < 1) return null;
  const body = token.slice(0, i);
  let given: Buffer;
  try { given = Buffer.from(token.slice(i + 1), "base64url"); } catch { return null; }
  const expected = mac(body);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof p?.exp !== "number" || p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}

// ---- sessions ----
export type Session = { kind: "monitor" | "admin"; monitorId?: number };
export const SESSION_TTL = 12 * 60 * 60 * 1000;
export const createSessionToken = (s: Session) => signToken({ k: "sess", kind: s.kind, monitorId: s.monitorId }, SESSION_TTL);
export function readSessionToken(t?: string | null): Session | undefined {
  const p = verifyToken<{ k: string; kind: Session["kind"]; monitorId?: number }>(t);
  if (!p || p.k !== "sess" || (p.kind !== "monitor" && p.kind !== "admin")) return undefined;
  return { kind: p.kind, monitorId: p.monitorId };
}

// ---- image CAPTCHA: the id carries a keyed hash of the answer ----
const capHash = (text: string) => mac("captcha:" + text).toString("base64url").slice(0, 24);
export const makeCaptchaId = (text: string) => signToken({ k: "cap", h: capHash(text) }, 15 * 60 * 1000);
export function checkCaptcha(id: unknown, text: unknown): boolean {
  const p = verifyToken<{ k: string; h: string }>(typeof id === "string" ? id : "");
  return !!p && p.k === "cap" && typeof text === "string" && p.h === capHash(text.trim());
}

// ---- password reset links: bound to the current password hash, so a link stops working once it was used ----
export const makeResetToken = (monitorId: number, passwordHash: string) => signToken({ k: "reset", id: monitorId, pw: passwordHash.slice(0, 16) }, 60 * 60 * 1000);
export function readResetToken(t: unknown): { id: number; pw: string } | null {
  const p = verifyToken<{ k: string; id: number; pw: string }>(typeof t === "string" ? t : "");
  return p && p.k === "reset" ? { id: p.id, pw: p.pw } : null;
}
