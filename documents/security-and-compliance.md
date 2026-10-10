# Security and Compliance Notes

All findings come from the source documents' own remarks plus direct implications of the specs. No penetration testing was done.

## 1. Findings

| # | Severity | Finding | Source | Recommendation |
|---|----------|---------|--------|----------------|
| S1 | **High** | Admin password displayed **unmasked** in G-1 and entered in a plain text field in G-1-1 | G-1-(2), G-1-1-(2) | Mask; store hashed; per-user admin accounts |
| S2 | **High** | **Monitor password e-mailed in plain text** via the password-enquiry mail (`%%password%%`) | G-2-(5) | Replace with reset-link flow; hashed storage (already planned: "パスワード（ハッシュ化）") |
| S3 | High | Legacy storage of monitor passwords apparently reversible (they can be mailed) | G-2 | Force reset on migration |
| S4 | Medium | Destructive/state-changing actions via GET links (`questionnaire_3`, `topics_3`, `*_5&is_open=`) | URL table | POST + CSRF tokens + confirmation |
| S5 | Medium | Admin console at a guessable path `/vin_root/` with a single shared account | G-1 | IP restrictions / MFA / per-user accounts / audit log |
| S6 | Low | Preview uses a separate obfuscated ID (positive; keep) | A-1-(15) | Keep pattern |
| S7 | Medium | Screen captures in the shared Excel files still contain real e-mail/password values (My Page A-1-3 capture warning) | 画面説明 note | Redact before sharing with vendors; handle files as confidential |
| S8 | Medium | Personal data in admin: addresses, phone, birth date, e-mail; admin may now **edit** these (Req. 32) | D-1-1 | Audit log, role permissions |
| S9 | Low | Social login via Facebook/Twitter | A-1 | Removed per Req. 4 |
| S10 | Medium | Legacy CSV lacks email/password – workaround could tempt unsafe data pulls | form sheet | Controlled migration |

## 2. Personal data inventory

| Category | Fields | Where |
|----------|--------|-------|
| Identity | name, birth date, gender, monitor ID | exchange form, profile, admin |
| Contact | e-mail, phone, postal address | profile, exchange form, admin |
| Sensitive-ish | marital status, children (new: school stages), occupation, industry, interests, media subscriptions | profile, new form |
| Credentials | password | profile, admin settings, mail |
| Behavioural | last login/answer, answers, points, exchange history, withdrawal reason | admin |
| Financial-like | Tamarun card number, gift destination e-mail | exchange |

## 3. Compliance points to confirm
- **APPI (個人情報保護法)** – privacy policy page `/privacy/` exists and names 協同組合岡山情報文化研究所 as operator; the replacement collects *more* data (name, phone, children's school stages, interest data) → update purpose statement, consent, and retention.
- **Withdrawal** – data "all deleted" per the withdrawal screen, but admin retains withdrawal reasons with monitor ID links (F-1 → D-1-1 shows monitor details for withdrawn IDs?). Define what remains after withdrawal.
- **Retention after shipping (Req. 18)** – keep monitor info after shipment vs. minimisation; define retention period.
- **Cookie / tracking** – open surveys have a Cookie control option; review under replacement.
- **Anti-spam** – CAPTCHA retained on public and exchange forms.
- **Point expiry (Req. 6)** – if adopted, check against Japanese rules on prepaid-type points / consumer notices, and the stated rule "points lapse on withdrawal".
