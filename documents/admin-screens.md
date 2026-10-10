# Admin Console – Screen Specifications

Source: `Vinsight管理画面＜設計図＞20260917.xlsx` (item lists) and `＜画面遷移図＞.pdf`. Base: `https://vinsight.jp/vin_root/index.php`. Item codes follow `[Screen]-(n)`.

Legend for "Type": TXT text input · PD pull-down · CB checkbox · RB radio · BTN button · DISP display only.

## TOP menu (管理者専用メニュー)
Sidebar headings (not links): A アンケート管理 · B 新着情報管理 · C ポイント交換管理 · D モニター管理 · E サンプル数調査 · F 退会管理 · G 設定; plus logout.

---
## A-1 Survey list (アンケート一覧) `?c=questionnaire&new=1&odr=1`
Shows "597件中 1-597件目" – all on one page.

**Search area**
| Code | Item | Type | Detail |
|------|------|------|--------|
| (1) | Delivery start (from) | PD ×4: year 2010–2027 / month / day / hour 0–23 | |
| (2) | Delivery start (to) | same | |
| (3) | Status | CB multi | 配信中 / 非公開 / 配信待ち / 配信終了 |
| (4) | Client name | TXT | match type unknown |
| (5) | Search | BTN | |
| (6) | New | BTN (JS) | → A-1-1 |

**List columns**
| Code | Column | Content / sortable |
|------|--------|--------------------|
| (7) | 有効 / 状態 | validity flag + delivery status; status sortable (`sort=status`) |
| (8) | ID / 発行ポイント | ID default order; points sortable (`sort=point`); blank possible |
| (9) | タイトル / クライアント | title sortable (`sort=title`); title click expands row in place (accordion); client blank for "main survey" rows |
| (10) | 設問数 / サンプル数 | question count sortable (`sort=question_num`) |
| (11) | 回答数 / 回答率 | both sortable (`ans_num`, `ans_par`); waiting surveys show 0 / 0% |
| (12) | 種別 / 配信開始日 | start date sortable (`start_date2`) |
| (13) | 設問設定 / 配信条件 | links → A-1-3 / A-1-4 |
| (14) | CSV | 5 downloads: ラベル対応表, ローデータ, ローデータ(0無), テストローデータ, テストローデータ(0無) |
| (15) | 基本情報 | プレビュー｜編集｜削除, テスト配信 |

**Planned changes:** free-word search (9-1), detail search (9-2), copy (11), test delivery to admin (12).

## A-1-1 New survey `?c=questionnaire_1&new=1`
| Code | Item | Type / options |
|------|------|----------------|
| (1) | Language | RB 日本語 / English |
| (2) | Client name | TXT |
| (3) | Title | TXT |
| (4) | Survey type | RB: 事前 / 本 / オープン / ウェルカム / カラーイメージ |
| (5) | Cookie control (open surveys) | CB "disable" |
| (6) | Reward points | TXT |
| (7) | Pre-text / post-text / request mail | TEXTAREA ×3, prefilled from A-2 |
| (8) | Short URL | DISP, `https://vinsight.jp/enq/…` |
| (9) | Created / status / URL / valid | DISP + CB |
| (10) | Register / Cancel | BTN |

## A-1-2 Survey "edit" `?c=questionnaire_1&pk=ID&new=1`
Same fields as A-1-1 in **read-only** form plus ID, sample count, question count, answer count/rate. Only a Cancel button and a "valid" checkbox (clickability unknown). ⚠ Looks view-only; all surveys were "delivered" on 2026-09-17 so edit was unavailable (annotation in source).

## A-1-3 Questions `?c=question&questionnaire_pk=ID`
(1) count ("21件中1-21件目"); (2) question text list only (answer formats not shown); (3) preview button (JS, target unknown).

## A-1-4 Delivery conditions `?c=target&questionnaire_pk=ID`
(1) condition (attribute filter, "登録はありません" if none); (2) delivery start datetime; (3) end condition, e.g. "sample-limit end: 400". Delivered surveys hide register/edit buttons; pre-delivery appearance not observed.

## A-2 Default texts `?c=default_text&new=1`
(1) pre-survey text (confidentiality notice etc.), (2) post-survey text, (3) request mail template, (4) single 編集 button (JS). Mail placeholders: `%%id%% %%question_id%% %%title%% %%end_date%% %%end_count%% %%count%% %%point%%`.

## A-2-1 Edit defaults `?c=default_text_1&new=1`
TEXTAREA ×3 + 登録/キャンセル. The Edit button on A-2 appeared to do nothing; direct URL works (possible JS bug).

---
## B-1 News list `?c=topics&new=1`
221 items, 50/page. Columns: 公開 (published flag), 状態 (公開中/公開終了), 作成日, タイトル (link to public page), 公開開始, 公開終了, 操作 (編集 / 削除), hidden row-expand link `topics_5`. Button: 新規登録.

## B-1-1 News create/edit `?c=topics_1[&pk=ID]&new=1`
Date (Y/M/D PD) · publish start/end (Y/M/D/H PD) · title · body (**CKEditor**, source view) · images 1–3 (file + `%%img1%%..%%img3%%` tokens) · display place CB (before login / My Page) · publish CB · register/cancel.

**Planned:** individual delivery (14), simultaneous mail (15).

---
## C-1 Exchange requests `?c=trade&new=1`
5,835 items, 50/page.

Search: monitor ID from/to · name · status PD (未発送/発送済み) · search button.
List: 申請日, モニターID, 名前 (often blank), 交換商品 (e.g. クオカード, 図書券), 状態, 操作 (→ C-1-1), 発送 checkbox per row, "発送状態を更新" bulk button.

**Planned:** search by item (16) and show it (17), keep monitor info after shipping (18), sort default application date desc (19), CSV maybe (20).

## C-1-1 Shipping `?c=trade_1&pk=ID&new=1`
Display: name, address, phone, e-mail; items with unit counts (図書券 / クオカード / Amazonギフト券 / たまルンポイント – Tamarun shows card number); points used. Editable: status PD, remark. Buttons: register/cancel.

---
## D-1 Monitor list `?c=monitor&new=1`
3,810 monitors, 1,000/page. Search: monitor ID from/to. CSV import (file + button), export (JS button).
Columns: 状態 (有効/無効), モニターID, 最終ログイン (blank if never), 最終回答 (shows "0" if never), 現在ポイント, 閲覧 link.

## D-1-1 Monitor view `?c=monitor_1&pk=ID&new=1`
Display only except **備考** (remark, with 登録). Shows: ID, birth date, gender, marital, children, occupation, industry, address (to city-level in sample), registered / last login / last answered / personal-info changed dates, answer count, points, exchange count, total exchanged points, mail bounce count. 閉じる button. (Also reached from F-1.)

**Planned:** searches (21), more columns (22), sorting (23), new fields (24), CSV output (25), admin edit (32).

## E-1 Sample count `?c=sample&new=1`
Filters: birth date range · age range · gender · marital · child count range · occupation (13) · industry (26) · postcode · prefecture (47) · city · "active members only (answered ≤90 days & mail OK)". Button 表示 → "全体n人 / サンプル数n人". No list output.

Occupation values: 公務員, 経営者・役員, 会社員(技術系/事務系/その他), 自営業, 自由業, 専業主婦(主夫), パート・アルバイト, 学生, 高校生, 無職, その他.
Industry values: 製造業 ×7 sub-types, 流通・販売 ×7 sub-types, 農林水産畜産, 建築・不動産・住宅, 運送・物流, 金融・保険, 通信, 医療, 商社, レストラン・飲食・外食, サービス業, 広告・マスコミ・市場調査, 官公庁・財団・社団, その他.

## F-1 Withdrawal reasons `?c=secession&new=1`
333 items, 50/page. Columns: 退会日時, ID (link → D-1-1), 退会理由 (free text; often blank). Planned: sort default desc by date (28).

---
## G-1 Admin settings `?c=m_admin&new=1` / G-1-1 edit `?c=m_admin_1&new=1`
ID, **password (shown unmasked, also plain text input in edit)**, from-address, to-address(es) (comma separated). Single JS 編集 button.

## G-2 Text settings `?c=mail_text&new=1` / G-2-1 edit `?c=mail_text_1&new=1`
Six templates (see [email-templates.md](email-templates.md)); edit screen has 6 text areas including the separate "本登録URL", plus a legend of placeholders, register/cancel.
