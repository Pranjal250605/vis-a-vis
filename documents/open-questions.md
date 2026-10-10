# Open Questions and Unknowns

## 1. Decisions pending (from the requirements sheet, status 要検討)

| Req. | Question |
|------|----------|
| 5 | Should My Page display surveys differently by type (pre vs main)? Is it needed at all? |
| 6 | Will points have an **expiry**? If so display it (and notice via Req. 14). |
| 7 | Will there be a **last-login limit** rule? Only then show last-login info. |
| 9-1 | Which fields does the free-word (partial-match) search cover? |
| 9-2 | Can survey search by delivery-condition detail / granted-points detail be supported given the list has no such fields? |
| 16 | Is search by exchange item needed? |
| 20 | Is CSV for exchanges still needed once sorting exists? |
| 21 | Final search fields for monitors (name, phone, e-mail partial match). |
| 24 | Exact additional monitor fields and validation rules (half/full width). |
| 25 | CSV output field set for monitors. |
| 26 | Which extra attributes are usable in sample-count filters? |
| 33 | Should manual point grant live in the monitor-management screen (Req. 32)? Where in the menu (group/code "？")? |

## 2. Unobserved parts of the existing system

| Area | Gap |
|------|-----|
| Monitor login screen | Not surveyed |
| Registration (public) screens, complete/provisional flow | Not in materials |
| Survey answering (A-1-5) | No open survey available; answer screen, question types, branching unknown |
| Confirm / complete screens | Exchange, profile change, withdrawal |
| Question editing | A-1-3 shows only a list; how questions are created/edited and which answer formats exist is unknown |
| Delivery condition editing | A-1-4 shows read-only; how conditions are set is unknown (pre-delivery view unseen) |
| Survey editing | Whether editing is possible before delivery; all 597 are delivered |
| Delivery (send) mechanics | Who gets the request mail, timing, batch size, queue |
| Status toggle, delete, test delivery | Deliberately not executed |
| Monitor valid/invalid toggle | Inferred only (`monitor_5`) |
| CSV import/export | Column spec, overwrite rules, scope unknown |
| Row-expand link `topics_5` | Purpose unknown |
| Point accrual rules | How/when points are added to a monitor after answering |
| Point ledger | Whether history exists beyond the balance |
| "(0無)" CSV variants | Probably excludes zero values; not confirmed |
| `login_3` | Is it the same screen as admin login? |
| Hosting, DB, versions, source code | Not provided |
| Page visuals | Screenshots in Excel files not analysed here |

## 3. Data questions

1. Why does the exchange list show blank names, and why did data persist for some records after 2021-07-19 only? (Req. 18)
2. What happens to monitors' data on withdrawal – deleted or flagged?
3. How many of the 3,810 monitors are "active" (answered ≤90 days, mail OK)?
4. How are survey "sample counts" (target) vs answers tracked?
5. Can legacy e-mail/password data be extracted from the DB if the CSV excludes it?
6. Legacy occupation/industry → new taxonomy mapping rules?
7. Are legacy exchange items (図書券, クオカード) still offered, or only QUOカードPay/Amazon/Tamarun?
8. Is the "18 vs 24 vs 26" industry option discrepancy a bug? (Admin sample filter: 26, My Page select: 24)

## 4. Source-document inconsistencies to correct
- `UI項目一覧_G-1_管理者設定` sheet title says "文章設定 (G-2)".
- `UI項目一覧_A-1-2_ポイント交換申込` sheet title says "新着情報詳細 (A-1-1)".
- Menu name for group C differs (ポイント交換管理 vs 申請一覧).
- The admin screen-description workbook has a `D-1` tab and the item list has a `G-1` tab, but the overview tab of the screen-description workbook lists neither.
- Row-ordering in the requirements sheet: Nos. 33–34 placed before 21; 32 after 24.

## 5. Organisational questions
- Who finalises priority (◎○△) — 佐藤 or director 川合局長?
- What is the schedule/budget for the replacement and who is the vendor?
- Is the "content replace" (regional media audience) in scope of the first release?
