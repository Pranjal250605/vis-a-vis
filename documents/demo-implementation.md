# Demo Implementation

A working demo of the replacement lives in the project root (Next.js 16 / React 19 / TypeScript, **no database** – all data is dummy and kept in memory). See `../README.md` for how to run it.

## What was built

| Area | Where | Notes |
|------|-------|-------|
| Public site | `/`, `/register`, `/register/complete`, `/password-reset`, `/contact`, `/privacy` | Hero collage, login, registration (provisional → full), non-monitor inquiry |
| Monitor My Page | `/mypage`, `/mypage/trade`, `/mypage/edit`, `/mypage/secession`, `/mypage/contact`, `/mypage/topics/[id]`, `/mypage/survey/[id]` | Includes the survey answer screen that was never observed in the old system |
| Admin console | `/admin/*` | Groups A–G plus new menus: manual points, point grant list, inquiries, mail history, audit log, requirements coverage |
| Backend | `/api/*` (`src/server`) | REST handlers, cookie sessions, validation, CSV, mail log; 100+ automated checks passed against it |

## Requirement coverage (all 35 rows)

The admin screen **「要求事項 対応状況」** (`/admin/requirements`) lists every requirement No. with the implementation and a link. Summary:

| Group | Nos. | Where |
|-------|------|-------|
| Inquiry forms | 1, 3 | landing page + `/contact` (non-monitor); `/mypage/contact` (monitor, shows monitor info) |
| Naming | 2 | "モニター番号" everywhere |
| Removed | 4 | no SNS login block |
| My Page display | 5, 6, 7 | surveys grouped by type; point-expiry panel; previous login time |
| Exchange | 8, 16–20 | pull-down units; item search/column; info kept after shipping; sort (date desc); CSV |
| Surveys | 9-1, 9-2, 10–13 | free-word + detail search; sort; copy; test delivery to admin mail only |
| News | 14, 15 | individual delivery; simultaneous e-mail |
| Points | 33, 34 | manual grant; grant list |
| Monitors | 21–25, 32 | partial-match search; sort; new fields + input rules; admin edit; CSV export/import |
| Sample count | 26 | new attributes usable as filters (also used for delivery conditions) |
| Withdrawals | 27–29 | date-desc sort; no search/CSV added |
| Settings | 30, 31 | unchanged functionally; admin password hashed and never displayed |

## Decisions made where the source was undecided (要検討 items)

- **Point expiry (No.6):** implemented as a setting (months, 0 = off). Oldest points are consumed first.
- **Last login (No.7):** shows the *previous* login time on My Page.
- **Free-word search (No.9-1):** searches title, client, type, ID, status.
- **Delivery-condition search (No.9-2):** matches a text summary of the saved conditions.
- **CSV for exchanges (No.20):** provided as an optional feature.
- **Survey editing:** only surveys in 配信待ち can be edited; delivered ones are read-only and can be copied (matches the old system's behaviour).
- **Passwords:** hashed; the old "password enquiry" e-mail (plain text) is replaced by a reset-link e-mail.

## Known limits of the demo

- No real e-mail, no real persistence (restart resets data; a reset button exists).
- Hero assets missing from `public/images` (star, tv, train, signage, plane, logo, marquee and footer catch images) are not reproduced.
- Address auto-fill only knows a few Okayama postcodes.
- The monitor-site UI is Japanese only (surveys can be flagged English, but screens are not translated).
