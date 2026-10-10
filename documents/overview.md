# Overview

## 1. Purpose of the system

Vinsight is a **monitor (panel) management and online-survey platform**. Operators recruit members ("monitors"), distribute questionnaires to filtered subsets of them, reward respondents with **points**, and let monitors **exchange points for gift items**.

## 2. Actors

| Actor | Description | Entry point |
|-------|-------------|-------------|
| **Monitor (モニター)** | Registered member who answers surveys and earns points | `/mypage/` (login required) |
| **Non-monitor / prospective member (非モニター・新規)** | Visitor who is not yet a monitor; needs a contact form on the login/top page | Login / TOP page |
| **Administrator (管理者)** | Operator (staff of ビザビ / 研究所) | `/vin_root/` |
| **Client (クライアント)** | Company that orders a survey; recorded as a text field on the survey, not a system user |  — |
| **Vendor (業者)** | Development vendor that will quote and build the replacement; requirements are being prepared for submission to them | — |

## 3. Business capabilities

1. **Member registration & profile** – provisional registration → completion mail → profile (demographics, occupation, industry, address).
2. **Survey management** – create surveys (5 types, JP/EN), default texts, questions, delivery conditions, end conditions, CSV result export, preview, test delivery.
3. **Survey answering** – monitors see "surveys addressed to you", answer them, earn points.
4. **News (新着情報)** – announcements shown before login and/or in My Page.
5. **Point exchange** – QUOカードPay, Amazon gift voucher (e-mail type), たまルンポイント (Tamarun points, needs a Tamarun card). 1 unit = 500 points. Admin processes shipments (未発送 → 発送済み).
6. **Sample-size research (サンプル数調査)** – count monitors matching demographic filters before distributing a survey.
7. **Withdrawal (退会)** – monitor self-withdrawal with reason; admin reviews reasons.
8. **System settings** – admin credentials, notification addresses, e-mail templates.

## 4. Scale snapshot (mid-Sept 2026)

| Item | Count |
|------|-------|
| Surveys | 597 (single page, no paging) |
| News items | 221 (50/page) |
| Point-exchange requests | 5,835 (50/page) |
| Monitors | 3,810 (1,000/page) |
| Withdrawals | 333 (50/page) |
| Current admin screens | 9 menu screens + 10 child screens |

This is a small data volume; performance is not a driver, but data migration and continuity (points, history) are.

## 5. Project context

- **Origin:** Replacement of the current Vinsight site ("Vinsightリプレイス"). A related framing in the registration-form file is **"Vinsight × コンテンツリプレイス案"** – i.e. the replacement also repositions the monitor base with content-oriented attributes (food, outings, local media readership).
- **Author / owner:** 佐藤 (株式会社ビザビ). A reviewer named in the registration sheet title: **川合局長** (director) confirmed the personal-information comparison table.
- **Document timeline**

| Date | Item |
|------|------|
| 2026-09-17 | Admin console item list + annotated screenshots created |
| 2026-09-18 | Monitor My Page item list + annotated screenshots created |
| 2026-09-19 | Requirements draft Rev.1 created (internal) |
| 2026-09-25 | Registration form revision draft; this shared package |

- **Status:** Requirements are *draft*. 35 rows: 18 confirmed (確定), 11 "to be examined" (要検討), 6 "no action" (対応不要). See [requirements.md](requirements.md).

## 6. Scope of the replacement (as implied)

**In scope:** all current admin and monitor screens, plus the changes listed in the requirements (inquiry forms, copy/test-delivery of surveys, manual point granting, sorting/search additions, monitor editing, individual news delivery, mail notification on news, new profile fields, etc.).

**Probably out of scope / to be confirmed:** actual survey-answer screens (never observed), SNS-linked login (to be removed/hidden), external sites (Tamarun, Vis-à-vis).

## 7. Key risks (summary)

- Survey-answer flow and several child screens were **never observed** in the existing system → must be reverse-engineered or specified from scratch.
- Passwords are stored/displayed in **plain text** and e-mailed → must be redesigned (see [security-and-compliance.md](security-and-compliance.md)).
- Data migration: the existing CSV does **not** contain e-mail or password (fields marked "取得できず"), which blocks a naive migration (see [registration-form-redesign.md](registration-form-redesign.md)).
- Profile taxonomy changes (occupation/industry/job type) require mapping legacy values to new categories.
