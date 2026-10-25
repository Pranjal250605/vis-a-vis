// Cookie serialization with the protective flags in one place (PDF #9).
import { IS_PRODUCTION } from "./config";

/** HttpOnly keeps scripts away from the cookie; SameSite=Lax blocks it on cross-site POSTs; Secure keeps it off plain HTTP. */
export function serializeCookie(name: string, value: string | null): string {
  const attrs = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (IS_PRODUCTION) attrs.push("Secure");
  if (value === null) attrs.push("Max-Age=0");
  return `${name}=${value === null ? "" : encodeURIComponent(value)}; ${attrs.join("; ")}`;
}
