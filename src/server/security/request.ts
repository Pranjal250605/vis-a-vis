// Checks applied to every incoming API request, before any route code runs (PDF #1, #12, #13).
//
// The demo keeps its data in memory objects, so there is no SQL to inject into. The rule that would protect a real
// database is already enforced here: request data is only ever read as plain JSON values, and routes read it through
// str()/num()/strArr() and validate it on the server. When a database is added, queries must use bound parameters.
import { MAX_BODY_BYTES } from "./config";

export class RequestRejected extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Only the site's own pages may change data (a cross-site form post must not act with the member's cookie). */
export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) return;
  let originHost = "";
  try { originHost = new URL(origin).host; } catch { /* "null" and other junk fall through to the rejection */ }
  if (originHost !== req.headers.get("host")) throw new RequestRejected(403, "不正なリクエストです。");
}

/** Reads the JSON body with a size limit. An unreadable body is an error, not an empty form. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  if (req.method === "GET" || req.method === "DELETE") return {};
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) throw new RequestRejected(413, "送信データが大きすぎます。");
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new RequestRejected(413, "送信データが大きすぎます。");
  if (!text) return {};
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new RequestRejected(400, "送信データの形式が正しくありません。"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new RequestRejected(400, "送信データの形式が正しくありません。");
  return parsed as Record<string, unknown>;
}

/**
 * Address of the caller, used for throttling. Behind a trusted reverse proxy the first X-Forwarded-For entry is the client;
 * without a proxy that header can be forged, so a real deployment must set it at the proxy.
 */
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
