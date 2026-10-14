import { getStore } from "./store";
import { createSessionToken, readSessionToken, type Session } from "./tokens";
import type { Monitor } from "@/lib/types";

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export interface Ctx {
  req: Request;
  url: URL;
  q: URLSearchParams;
  params: Record<string, string>;
  body: any;
  monitor?: Monitor;
  isAdmin: boolean;
  origin: string;
  setCookie: (name: string, value: string | null) => void;
}

export interface FileResult {
  __file: true;
  filename: string;
  contentType: string;
  content: string;
}
export const file = (filename: string, content: string, contentType = "text/csv; charset=utf-8"): FileResult => ({
  __file: true, filename, contentType, content: contentType.startsWith("text/csv") ? "﻿" + content : content,
});

export type Handler = (ctx: Ctx) => unknown | Promise<unknown>;
export interface Route {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  guard?: "monitor" | "admin";
  handler: Handler;
}

// ---- sessions: signed cookie tokens (survive server restarts; see tokens.ts) ----
export const MONITOR_COOKIE = "vin_m";
export const ADMIN_COOKIE = "vin_a";

export const createSession = (s: Session) => createSessionToken(s);
/** ログアウトはブラウザ側のCookie削除で行う（トークン自体はサーバーに保存しない） */
export const destroySession = (_t?: string) => { void _t; };
export const readSession = (t?: string) => readSessionToken(t);

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  (header ?? "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function monitorFromCookie(cookies: Record<string, string>): Monitor | undefined {
  const s = readSession(cookies[MONITOR_COOKIE]);
  if (!s || s.kind !== "monitor") return undefined;
  const m = getStore().monitors.find((x) => x.id === s.monitorId);
  return m && m.status === "有効" ? m : undefined;
}

export function toSafeMonitor(m: Monitor) {
  const { passwordHash: _p, token: _t, ...rest } = m;
  void _p; void _t;
  return rest;
}

// ---- small helpers ----
export const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
export const num = (v: unknown, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
export const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
export const csvList = (v: string | null) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []);

export function sortBy<T>(arr: T[], keyFn: (t: T) => string | number | null, order: "asc" | "desc") {
  const dir = order === "desc" ? -1 : 1;
  return [...arr].sort((a, b) => {
    const x = keyFn(a), y = keyFn(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1; // nulls last
    if (y == null) return -1;
    if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
    return String(x).localeCompare(String(y), "ja") * dir;
  });
}

export const order = (q: URLSearchParams, d: "asc" | "desc") => (q.get("order") === "asc" ? "asc" : q.get("order") === "desc" ? "desc" : d);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvEscape).join(",")).join("\r\n") + "\r\n";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], f = "", inQ = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else inQ = false; } else f += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { cur.push(f); f = ""; }
    else if (c === "\n") { cur.push(f); rows.push(cur); cur = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f !== "" || cur.length) { cur.push(f); rows.push(cur); }
  return rows.filter((r) => r.some((x) => x !== ""));
}
