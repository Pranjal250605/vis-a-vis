# E-mail Templates and Placeholders

Managed under admin **G-2 文章設定** (`?c=mail_text&new=1`), edited in **G-2-1** (`?c=mail_text_1&new=1`). Placeholders use the `%%name%%` syntax and are substituted at send time. The actual template text was not included in the materials.

## 1. System mails (G-2)

| # | Template | Trigger | Placeholders |
|---|----------|---------|--------------|
| (1) | 仮登録完了メール – provisional registration complete | After registration form submitted | `%%id%%` monitor no., `%%regist_url%%` full-registration URL, `%%mail%%` e-mail |
| (2) | 本登録完了メール – registration complete | After full-registration URL used | `%%id%%` |
| (3) | ポイント交換申込受付確認メール – exchange received | After exchange application | `%%id%%`, `%%item%%`, `%%postcode%%`, `%%pref%%`, `%%address1%%`, `%%address2%%`, `%%name%%`, `%%tel%%`, `%%mail%%` |
| (4) | 商品発送メール – shipped | Admin sets 発送済み | same as (3) |
| (5) | パスワードお問い合わせメール – password enquiry | Monitor requests password | `%%id%%`, `%%password%%` |
| (6) | 本登録URL | not a mail; a URL string inserted into (1) | – |

Placeholder legend shown in the edit screen:
- **Monitor info:** monitor number, e-mail, password
- **Exchange info** (only for (3) and (4)): requested item, postal code, prefecture, city, street, name, phone

## 2. Survey request mail (per survey, default in A-2)

Placeholders: `%%id%%`, `%%question_id%%`, `%%title%%`, `%%end_date%%`, `%%end_count%%`, `%%count%%`, `%%point%%`.

## 3. News images
Not mail, but same engine pattern: `%%img1%%`–`%%img3%%` inside news body.

## 4. Configuration (G-1)
- From-address: used for automated mail.
- To-address(es): comma-separated list receiving inquiries/notifications.

## 5. New mail features requested
| Req. | Feature |
|------|---------|
| 12 | Survey **test delivery** to the administrator's address only |
| 14 | **Individual** news/notice delivery (e.g. point-expiry guidance) |
| 15 | **Mail copy of news** upon publication |
| 1, 3 | Inquiry forms (two types) → notification to admin address |

## 6. Replacement considerations
- Drop `%%password%%` (see [security-and-compliance.md](security-and-compliance.md)); replace with password-reset link.
- Provide a template preview and test-send function for admins.
- Handle bounces (existing `mail_bounce_count`; "active member" = answered in 90 days **and** not bouncing).
- Use proper templates for HTML/plain-text; keep placeholders backward compatible for migrated surveys.
