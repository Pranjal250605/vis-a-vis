/**
 * 開発サーバー（next dev）専用のウォームアップ。
 * dev では各ページが「初めて開かれた時」にコンパイルされるため、サイドメニューを素早く何度もクリックすると
 * 1回目の遷移が終わる前に次のクリックで取り消され、画面が固まったように見える。
 * ログイン画面／トップを開いた時点で全ページを順番に先読みして、コンパイル待ちを先に済ませておく。
 * 本番（next build → next start）では何もしない。
 */
let started = false;

export function warmRoutes(routes: string[]) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production" || started) return;
  started = true;
  const run = async () => {
    for (const r of routes) {
      try { await fetch(r, { credentials: "same-origin", cache: "no-store", headers: { "x-warmup": "1" } }); } catch { /* ignore */ }
      await new Promise((res) => setTimeout(res, 30));
    }
  };
  const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
  if (w.requestIdleCallback) w.requestIdleCallback(() => { void run(); }); else setTimeout(() => { void run(); }, 400);
}

export const ADMIN_ROUTES = [
  "/admin", "/admin/surveys", "/admin/surveys/new", "/admin/surveys/701", "/admin/default-texts", "/admin/news", "/admin/news/new", "/admin/news/1",
  "/admin/trades", "/admin/trades/1", "/admin/points", "/admin/points/grant", "/admin/monitors", "/admin/monitors/1001", "/admin/sample",
  "/admin/withdrawals", "/admin/settings", "/admin/mail-texts", "/admin/inquiries", "/admin/mail-log", "/admin/audit-log", "/admin/requirements",
];

export const SITE_ROUTES = [
  "/mypage", "/mypage/trade", "/mypage/edit", "/mypage/contact", "/mypage/secession", "/mypage/topics/1", "/mypage/survey/1",
  "/register", "/register/complete", "/password-reset", "/password-reset/x", "/contact", "/privacy", "/preview/x",
];
