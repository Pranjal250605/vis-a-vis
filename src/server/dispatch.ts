import {
  ADMIN_COOKIE, ApiError, Ctx, FileResult, MONITOR_COOKIE, Route, createMonitorSession, createSession, monitorFromCookie, parseCookies, readSession,
} from "./http";
import { adminRoutes } from "./routes-admin";
import { siteRoutes } from "./routes-site";
import { serializeCookie } from "./security/cookies";
import { RequestRejected, assertSameOrigin, readJsonBody } from "./security/request";

const routes: Route[] = [...siteRoutes, ...adminRoutes];

function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split("/").filter(Boolean), b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

const json = (data: unknown, status = 200, headers: string[] = []) => {
  const h = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  headers.forEach((v) => h.append("set-cookie", v));
  return new Response(JSON.stringify(data), { status, headers: h });
};

export async function dispatch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const cookies = parseCookies(req.headers.get("cookie"));
  const setCookies: string[] = [];
  const touchedCookies = new Set<string>();
  const setCookie = (name: string, value: string | null) => { touchedCookies.add(name); setCookies.push(serializeCookie(name, value)); };
  try {
    assertSameOrigin(req);
    let found: { route: Route; params: Record<string, string> } | null = null;
    let pathMatched = false;
    for (const r of routes) {
      const params = match(r.path, path);
      if (!params) continue;
      pathMatched = true;
      if (r.method === req.method) { found = { route: r, params }; break; }
    }
    if (!found) throw new ApiError(pathMatched ? 405 : 404, pathMatched ? "許可されていないメソッドです。" : "APIが見つかりません。");

    const isAdmin = readSession(cookies[ADMIN_COOKIE])?.kind === "admin";
    const monitor = monitorFromCookie(cookies);
    if (found.route.guard === "admin" && !isAdmin) throw new ApiError(401, "管理者ログインが必要です。");
    if (found.route.guard === "monitor" && !monitor) throw new ApiError(401, "ログインが必要です。");
    if (monitor?.passwordChangeRequired && found.route.guard === "monitor" && !found.route.allowPendingPasswordChange) {
      throw new ApiError(403, "新しいパスワードの設定が必要です。", undefined, "PASSWORD_CHANGE_REQUIRED");
    }

    const body = await readJsonBody(req);
    const ctx: Ctx = { req, url, q: url.searchParams, params: found.params, body, monitor, isAdmin, origin: url.origin, setCookie };
    const result = await found.route.handler(ctx);

    // Idle timeout: every request by a signed-in user issues a fresh short-lived session (unless the route set one itself, e.g. login/logout).
    if (monitor && !touchedCookies.has(MONITOR_COOKIE)) setCookie(MONITOR_COOKIE, createMonitorSession(monitor));
    if (isAdmin && !touchedCookies.has(ADMIN_COOKIE)) setCookie(ADMIN_COOKIE, createSession({ kind: "admin" }));
    if (result && typeof result === "object" && (result as FileResult).__file) {
      const f = result as FileResult;
      return new Response(f.content, { headers: { "content-type": f.contentType, "content-disposition": `attachment; filename="${f.filename}"`, "cache-control": "no-store" } });
    }
    return json(result ?? { ok: true }, 200, setCookies);
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message, fields: e.fields, code: e.code }, e.status, setCookies);
    if (e instanceof RequestRejected) return json({ error: e.message }, e.status);
    console.error(e); // details stay in the server log; the browser only gets a generic message
    return json({ error: "サーバーエラーが発生しました。" }, 500);
  }
}
