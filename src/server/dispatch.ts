import { ADMIN_COOKIE, ApiError, Ctx, FileResult, MONITOR_COOKIE, Route, monitorFromCookie, parseCookies, readSession } from "./http";
import { adminRoutes } from "./routes-admin";
import { siteRoutes } from "./routes-site";

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
  try {
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

    let body: any = {};
    if (req.method !== "GET" && req.method !== "DELETE") {
      try { body = await req.json(); } catch { body = {}; }
    }
    const ctx: Ctx = {
      req, url, q: url.searchParams, params: found.params, body, monitor, isAdmin, origin: url.origin,
      setCookie: (name, value) =>
        setCookies.push(value === null ? `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` : `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax`),
    };
    const result = await found.route.handler(ctx);
    if (result && typeof result === "object" && (result as FileResult).__file) {
      const f = result as FileResult;
      return new Response(f.content, { headers: { "content-type": f.contentType, "content-disposition": `attachment; filename="${f.filename}"`, "cache-control": "no-store" } });
    }
    return json(result ?? { ok: true }, 200, setCookies);
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message, fields: e.fields }, e.status, setCookies);
    console.error(e);
    return json({ error: "サーバーエラーが発生しました。" }, 500);
  }
}
