# Registration Form Redesign

Source: `登録フォーム改定（案）2026-9-25.xlsx` – sheet "（川合局長確認）個人情報取得対照表" (personal-information comparison table confirmed by the director, 川合局長). Left side = **current Vinsight new-member form**; right side = **proposed "Vinsight × コンテンツリプレイス案"**. This is the "別資料" referenced by Req. 24.

Colour legend in the sheet: field not in form but present in CSV · field in form but not verifiable in CSV · current form field · sub-menu of current field · **new field** · sub-menu of new field. Column H labels the rationale of each new item.

## 1. Core fields: current vs proposed

| # | Current form | Proposed form | Change |
|---|--------------|---------------|--------|
| 1 | Email | Email | – |
| 2 | Password | Password **(hashed)** | storage change |
| 3 | Email (confirm) | Email (confirm) | – |
| 4 | Password (confirm) | Password (confirm) | – |
| 5 | Birth date | **Full name (氏名)** | new |
| 6 | Gender | **Postal code** | moved/new |
| 7 | Marital status | **Prefecture** | |
| 8 | Children count | **City** | |
| 9 | Occupation (PD, 13) | **Phone number** | new |
| 10 | Industry (PD, 26) | Birth date | |
| 11 | Postal code | Gender | |
| 12 | Prefecture | Married (spouse) / Unmarried | |
| 13 | City | Number of children (free text) | |
| 14 | Street/number | **Children – multiple answer** (MA) | new |
| 15 | CAPTCHA | **Industry (PD)** – realigned | changed list |
| 16 | – | **Job type (職種, PD)** | new |
| 17 | – | **Employment type (就業形態, PD)** | new (replaces 職業) |
| 18 | – | **Outing interests** | new |
| 19 | – | **Gourmet interests – genre** | new |
| 20 | – | **Gourmet interests – occasion/purpose** | new |
| 21 | – | **Information wanted** | new |
| 22 | – | **Life-information interests** | new |
| 23 | – | **Media/community used** | new |

Observations:
- **Street/block number (丁目・番地)** is not in the proposed form (only prefecture + city + postal code).
- **Occupation** is replaced by *job type* + *employment type*, aligned with the national census.
- **Name and phone** become collected for all members (previously only at point-exchange).
- The CAPTCHA is not listed in the proposed form (probably still expected).

## 2. New / changed option lists

### Children (MA, new): 未就学 (0–6) · 小学生 · 中学生 · 高校生 · 大学・短大・専門学校・大学院 · 学校卒業後(就職・その他)

### Industry (aligned to Japan Standard Industrial Classification) – 29 options
農業・林業・漁業 · 建設業(鉱業含む) · 製造業(食品・飲料 / 自動車・輸送用機器 / 電気機器・電子部品 / 化学・医薬品・化粧品・日用品 / その他) · 電気・ガス・水道 · 情報サービス・ソフトウェア・インターネット · 通信 · 放送・新聞・出版 · 運輸・郵便・物流 · 卸売業・商社 · 小売業(百貨店・スーパー・コンビニ・ドラッグストア / 自動車販売・家電・専門店・通販) · 金融・保険 · 不動産・レンタル・リース · 専門サービス・研究 · 広告・市場調査 · 宿泊業 · 飲食店 · 生活サービス・娯楽 · 教育・学習支援 · 医療 · 福祉・介護・保育 · 郵便局・協同組合(JA等) · その他のサービス · 国・地方自治体 · その他

(Legacy: 26 options with “manufacturing ×7 / retail ×7” by sector.)

### Job type (census-aligned) – 15 options
管理職 · 専門職 · 技術職 · クリエイティブ職 · 事務職 · 営業職 · 販売職 · サービス職 · 保安職 · 農林漁業 · 製造・生産工程 · 運転・輸送 · 建設・土木・設備工事 · 運搬・清掃・包装・軽作業 · その他

### Employment type – 14 options
会社員(正社員) · 契約社員・派遣社員 · パート・アルバイト · 会社役員・経営者 · 自営業 · 自由業・フリーランス · 公務員 · 団体職員 · 専業主婦・主夫 · 学生 · 高校生 · 年金生活 · 無職(求職中含む) · その他

### Interest lists (content-member viewpoint)
| Field | # options | Examples |
|-------|-----------|----------|
| Outing destinations | 16 | グルメ・食べ歩き, カフェ・スイーツ, 温泉・日帰り旅・ドライブ, 歴史・文化・アート, ご当地ロケ・撮影地, 懐かしスポット・レトロ |
| Gourmet genre | 13 | 和食・寿司, ラーメン, 焼肉, 郷土料理・特産品, パン, カフェ, 居酒屋 |
| Gourmet occasion | 11 | ランチ, モーニング, ディナー, デート・記念日, 家族・子ども連れ, ヘルシー, テイクアウト |
| Information wanted | 5 | 新店・オープン情報, 店主インタビュー, ランキング・特集, クーポン・会員特典, 季節限定メニュー |
| Life information | 29 | ブライダル, ギフト, 防災, まちづくり, 就農・起業, DIY, IT, ゲーム, … |
| Media / community | 7 | 定期購読契約者, ラーメン本(Lステップ会員), パン本(Lステップ会員), WEBタウン情報おかやま, タウン情報おかやま読者, オセラ読者, おいしい店ごっつぉ読者 |

These interests make the panel usable as an **Okayama regional content/media audience**, not just a survey panel.

## 3. CSV field comparison (migration view)

Legacy monitor CSV fields (the data available for migration): モニターID, 生年月日, 性別, 未婚・既婚, 子供の人数, 職業, 業種, 郵便番号, 都道府県, 市区町村, 丁目・番地, 登録日時, 最終ログイン日時, 最終回答日時, 個人情報変更日時, 現在のポイント数, メール不達回数, 状態.

Marked in the sheet: **メールアドレス and パスワード are "取得できず" (cannot be obtained)** from the legacy CSV.

Proposed CSV: monitor ID, e-mail, password (hashed), name, postcode, prefecture, city, phone, birth date, gender, marital, children, children detail, industry, job type, employment type, outing / gourmet genre / gourmet scene / information wanted / life information / media, registered/last login/last answered/info-changed timestamps, points, mail-bounce count, status.

### Migration implications
| Issue | Impact |
|-------|--------|
| No e-mail / password in legacy CSV | Cannot log in existing monitors without a re-activation process (set-password mail) or direct DB extraction |
| New mandatory-looking fields (name, phone, job type, employment type, interests) absent for existing monitors | Need a "complete your profile" flow (matches the My Page notice that basic info is required to answer surveys) |
| Legacy occupation (13) → job type (15) + employment type (14) | Not 1:1; need mapping/default and user confirmation |
| Legacy industry (26) → new industry (29) | Mapping table required |
| Street/number dropped | Existing data retained or discarded? Exchange form still needs full address |
| Admin/sample-count filters (E-1) | Must be extended to new attributes (Req. 26) |

## 4. Validation (Req. 24)
"入力規制条件（半角、全角など）要検討" – half-/full-width rules per field are not yet defined. Existing hints: phone is half-width digits in 3 parts; postal code in 2 parts; birth year as numeric text.
