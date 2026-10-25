"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}, public code?: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch("/api" + path, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: opts.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
    credentials: "same-origin",
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new ApiClientError(res.status, data?.error ?? "通信に失敗しました。", data?.fields ?? {}, data?.code);
  return data as T;
}

const TZ = "Asia/Tokyo";
export const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const p = new Intl.DateTimeFormat("ja-JP", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}.${g("month")}.${g("day")}`;
};
export const fmtDT = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("ja-JP", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";
export const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600000);
  return d.toISOString().slice(0, 16);
};
export const toDateInput = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() + 9 * 3600000).toISOString().slice(0, 10) : "");
export const yen = (n: number) => n.toLocaleString("ja-JP");

/** 管理画面のトースト通知（AdminShell が受信して右下に表示） */
export function toast(text: string, kind: "ok" | "err" | "info" = "ok") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("adm-toast", { detail: { text, kind } }));
}

/** GET を取得して状態を管理する簡易フック */
export function useApi<T = any>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [loading, setLoading] = useState(!!path);
  const seq = useRef(0);
  const load = useCallback(async () => {
    if (!path) return;
    const my = ++seq.current;
    setLoading(true);
    try {
      const d = await api<T>(path);
      if (my === seq.current) { setData(d); setError(null); }
    } catch (e) {
      if (my === seq.current) setError(e as ApiClientError);
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [path]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load, ...deps]);
  return { data, error, loading, reload: load, setData };
}

export function download(path: string) {
  window.location.href = "/api" + path;
}

export const qs = (o: Record<string, string | number | boolean | string[] | null | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return;
    p.set(k, Array.isArray(v) ? v.join(",") : String(v));
  });
  const s = p.toString();
  return s ? "?" + s : "";
};
