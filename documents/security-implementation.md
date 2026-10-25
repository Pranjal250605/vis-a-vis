# Security implementation (demo)

How the first security measures from `VIS-À-VIS セキュリティ対策のご説明（第2版）` are done in this demo. Numbers are the PDF's item numbers.

All security code is in `src/server/security/`; the sign-in rules are in `src/server/auth.ts`.

| # | Measure | Where | What the demo does |
|---|---------|-------|--------------------|
| 1 | Input handling (SQL injection) | `security/request.ts`, `validate.ts` | The demo has no SQL database, so there is nothing to inject into. Requests are read only as plain JSON (size limit, bad JSON rejected, cross-site POSTs rejected) and validated on the server. Errors never show internals. A real database must use bound parameters. |
| 2 | Secrets and old credentials | `security/config.ts` | The signing key comes from `VINSIGHT_SECRET`; with `VINSIGHT_ENV=production` the server refuses to start without a 32+ character key. Changing the key logs everyone out and kills all reset links. |
| 3 | Server settings | `next.config.mjs`, `security/cookies.ts` | Security headers on every response (CSP, HSTS, no framing, no sniffing, referrer and permissions policy), no `X-Powered-By`, cookies are HttpOnly + SameSite=Lax (+ Secure in production). |
| 4 | Password reset for existing members | `store.ts`, `auth.ts`, `routes-site.ts` | Every seeded member is a member from the old site (`passwordChangeRequired`). **Demo behaviour:** they log in once with the old password and are held on `/password-change` until they set a new one. After that the flag is cleared and the page never shows again. (The PDF is stricter: the old password is not accepted at all and the member must use an e-mailed reset link.) |
| 5 | Password storage | `security/passwords.ts` | scrypt with a random salt per password; plain passwords are never stored or logged. |
| 6 | Reset links | `tokens.ts` | Signed, expire in 1 hour, stop working once the password changed. |
| 8 | Brute force | `security/login-throttle.ts` | After 3 failures the wait doubles each time (max 5 min); one address failing on 10+ accounts is blocked. Accounts are never locked for good. Unknown accounts take as long to answer as wrong passwords, and the message is the same. No CAPTCHA on login yet. |
| 9 | Sessions | `dispatch.ts`, `tokens.ts` | Idle timeout 30 min (members) / 15 min (admin), renewed on each request. A session dies when its member's password changes. |
| 4/5 | Password policy | `security/passwords.ts` | 10+ characters, 2+ character types, not the monitor number or e-mail, not a common password, not the old one. |
| 22 | Logging | `store.ts` `audit()` | Logins, failed logins and password changes are written to the audit log (capped at 5000 entries). |

Not done yet: 7 (identity check for members without e-mail), 16 (two-step login), 18 (admin IP restriction), WAF, CAPTCHA on login, and the rest of the PDF.
