# Design Notes

## 1. Current UI structure (observed)

| Aspect | Admin console | Monitor My Page |
|--------|---------------|-----------------|
| Navigation | Left-hand grouped menu (A–G) with non-link headings | Left side panel (monitor no., points, buttons, member menu); header with logo/MyPage/logout; footer links |
| List pattern | Search block → list table; sorting by header links on some columns | Scrollable news box; survey table with collapsible sections |
| Create/edit pattern | Separate screens with 登録 / キャンセル; some edit actions are JS buttons | Form → confirm screen (→ complete) |
| Rich content | CKEditor for news | Text only |
| Data per page | Inconsistent paging (all / 50 / 1,000) | n/a |
| Date input | Four separate pull-downs (Y/M/D/H) | Year text + month/day pull-downs |
| Bot protection | – | image CAPTCHA (exchange), reCAPTCHA (contact) |

## 2. Known design issues in the current system

| # | Issue | Where | Related requirement |
|---|-------|-------|--------------------|
| 1 | Inconsistent labels "ID" / "モニター番号" | My Page | 2 |
| 2 | Single inquiry form for everyone | Contact | 1, 3 |
| 3 | No sort on exchange/monitor/withdrawal lists | C-1, D-1, F-1 | 19, 23, 28 |
| 4 | No free-word search | A-1, D-1 | 9-1, 21 |
| 5 | News only visible after login | News | 15 |
| 6 | Survey "edit" screen is effectively read-only after delivery; no copy function | A-1-2 | 11 |
| 7 | "Edit" button on defaults does not respond (works via direct URL) | A-2 | – |
| 8 | Admin monitor view can't be edited (except remark) | D-1-1 | 32 |
| 9 | Name column blank in many exchange rows; monitor info lost after shipping | C-1 | 18 |
| 10 | Monitor can only type unit counts for exchange | A-1-2 | 8 |
| 11 | Last-answer date shows "0" for no answer | D-1 | – |
| 12 | SNS login block shows but is unused | A-1 | 4 |
| 13 | Footer links (contact, privacy) missing from the item-list Excel | A-1-7/8 | – |
| 14 | Different paging policy per list | lists | – |
| 15 | Survey list loads 597 rows at once | A-1 | – |

## 3. Design principles implied for the replacement

1. **One naming** for identifiers: pick “モニター番号” or “ID”, use it consistently.
2. **Consistent list behaviour**: search + sort + paging + CSV where useful, with documented defaults (applications: date desc; monitors: ID asc; withdrawals: date desc).
3. **Separation of audiences**: non-monitor vs monitor inquiries; public site vs My Page vs admin.
4. **Notify, don't wait**: important information (news, expiry) should reach monitors by e-mail.
5. **Safe operation**: copy survey, test delivery to admin only, confirm screens for irreversible actions (exchange, withdrawal).
6. **Respect profile completeness**: required basic info before answering surveys; replacement adds more fields, so progressive profile completion is needed.
7. **Look & feel**: not specified in the materials. Only screenshots (not analysed) carry visual design; existing design may be kept or refreshed — decision pending.

## 4. Documentation conventions used in the sources

- Codes: `A`, `A-1`, `A-1-1`, `A-1-(n)`, `A-1-1-(n)` (see [sitemap-and-urls.md](sitemap-and-urls.md)).
- Colour per group letter; solid vs dashed lines for verified vs inferred.
- Each package has two Excel files: **＜画面説明＞** (annotated screenshots with overlaid code badges, movable images) and **＜設計図＞** (tabular item lists), plus a **＜画面遷移図＞** PDF.
- Personal data, passwords and admin credentials were deliberately *not* transcribed.

## 5. Requirements-sheet design conventions
Red No. = marked on a capture; black = new feature without existing screen; capture tabs exist per screen (`【モニター】ログイン画面`, `モニター画面_A₋1`, `A₋2`, `管理画面_A–G`).
