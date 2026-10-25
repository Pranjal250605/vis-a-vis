// Brute-force protection for login forms (PDF #8).
// Failures make the wait before the next try grow (it never locks the account for good, so nobody can lock a member out),
// and one address failing against many different accounts is blocked outright. In memory: fine for one demo server.
import { LOGIN_THROTTLE as T } from "./config";

interface Entry { failures: number; lastAt: number }

const byAccount = new Map<string, Entry>();
const byIp = new Map<string, Map<string, number>>(); // ip -> account -> last failure time

const fresh = (at: number, now: number) => now - at < T.windowMs;

function accountWait(key: string, now: number): number {
  const e = byAccount.get(key);
  if (!e || !fresh(e.lastAt, now) || e.failures <= T.freeAttempts) return 0;
  const delay = Math.min(T.baseDelayMs * 2 ** (e.failures - T.freeAttempts - 1), T.maxDelayMs);
  return Math.max(0, e.lastAt + delay - now);
}

function ipBlocked(ip: string, now: number): boolean {
  const accounts = byIp.get(ip);
  if (!accounts) return false;
  let recent = 0;
  for (const [account, at] of accounts) {
    if (fresh(at, now)) recent++; else accounts.delete(account);
  }
  return recent >= T.maxAccountsPerIp;
}

/** Milliseconds the caller must still wait, or 0 when an attempt is allowed. */
export function loginWaitMs(account: string, ip: string, now = Date.now()): number {
  return ipBlocked(ip, now) ? T.maxDelayMs : accountWait(account, now);
}

export function recordLoginFailure(account: string, ip: string, now = Date.now()) {
  const e = byAccount.get(account);
  byAccount.set(account, { failures: e && fresh(e.lastAt, now) ? e.failures + 1 : 1, lastAt: now });
  if (!byIp.has(ip)) byIp.set(ip, new Map());
  byIp.get(ip)!.set(account, now);
}

export function recordLoginSuccess(account: string) {
  byAccount.delete(account);
}
