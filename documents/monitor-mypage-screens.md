# Monitor My Page – Screen Specifications

Source: `Vinsightモニター_マイページ＜設計図＞20260918.xlsx` and `＜画面遷移図＞.pdf`. Base: `https://vinsight.jp/mypage/`.

Not surveyed: the monitor **login screen**, **registration**, **survey answering**, **confirmation/complete pages**, and **SNS linking**.

## A-1 My Page top `/mypage/`

**Header (all pages):** logo → vinsight.jp top · "マイページトップへ" button · logout (`?c=login_2`).

**Left panel:** your monitor number · current reward points (point) · **ポイント交換申込み** button (→ A-1-2) · "会員モニター様用メニュー": 登録情報の確認・変更 (→ A-1-3), 退会 (→ A-1-4).

**News:** scrollable list (date + title, with up/down buttons); title → A-1-1.

**Survey / SNS area:** heading "あなたに届いているアンケート"; Facebook and Twitter link blocks (JS, showing "連携していません"); survey table with two collapsible sections 事前アンケート / 本アンケート – columns date, survey no., title, reward points, answer status (回答済み/終了; non-clickable; "answer" link not observed).

**Exchange status table:** "現在謝礼ポイント交換申請はありません。" when empty.

**Footer (all pages):** 個人情報保護方針 `/privacy/` · 運営団体について (Vis-à-vis) · お問い合わせ `/contact/`.

**Planned changes:** unify ID/モニター番号 (2); monitor inquiry form with monitor info (3); remove SNS (4); survey-type display (5?); point expiry (6?); last login (7?).

## A-1-1 News detail `/mypage/topics/index.php?c=topics_view&pk=ID`
Title + date · body (free text; may contain contact link) · back link/breadcrumb.

## A-1-2 Point exchange `/mypage/trade/index.php`
| Code | Item | Notes |
|------|------|-------|
| (1) | Current points | DISP |
| (2) | QUOカードpay block | units input, auto-computed points, 500 pt/unit, digital gift to e-mail |
| (3) | Amazonギフト券 e-mail type | same |
| (4) | たまルンポイント | Tamarun card no. + units, total; 500 pt/unit; Tamarun members only; "0526" fixed prefix |
| (5)(6) | Links to tamarun.jp | apply / about (external) |
| (7)–(11) | Applicant: name, address (postcode ×2, prefecture, city, street), phone ×3, e-mail, birth date | all required, prefilled from profile; PC mail recommended |
| (12) | CAPTCHA | image |
| (13) | Back | |
| (14) | 入力内容を確認する | → confirm screen ⚠ unobserved |

**Planned:** pull-down selection instead of typing units (Req. 8).

## A-1-3 Registered info (profile) `/mypage/edit/index.php`
| Group | Fields |
|-------|--------|
| Login | e-mail + confirm, password + confirm (all required) |
| Notice | "To answer surveys you must complete basic information" |
| Basic | birth date (year text + month/day PD), gender (RB), marital (RB), number of children (number), occupation (PD, 13), industry (PD, 24) |
| Address | postcode (2 parts) + "auto-fill" button, prefecture (PD 47), city, street/building |
| Submit | back, 入力内容を確認する → confirm ⚠ |

Replacement fields: see [registration-form-redesign.md](registration-form-redesign.md).

## A-1-4 Withdrawal `/mypage/secession/index.php`
Four warnings (all data deleted; points lapse; no re-issue after re-registration; withdrawal may cross with survey-request mails) → reason textarea (required? unknown) → agree checkbox → 退会する → completion page ⚠ unobserved.

## A-1-5 Survey answer ⚠ unobserved
No open survey was available at crawl time; answered/ended rows are not links.

## A-1-6 SNS link ⚠ unobserved
JS OAuth (Facebook / Twitter). **Slated for removal** (Req. 4).

## A-1-7 Contact `/contact/`
Fields: ID, company name, name, e-mail, phone, inquiry body, reCAPTCHA. *Not in the original item list – to be appended.* Replacement: split into monitor form (Req. 3) and non-monitor form on login (Req. 1).

## A-1-8 Privacy policy `/privacy/`
Static page; operator 協同組合岡山情報文化研究所. *Not in the original item list.*

## A-1-9 About the operator
External: `http://www.vis-a-vis.co.jp/bunka/`. No capture.
