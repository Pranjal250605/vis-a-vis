# Vinsight Replacement Project – Documentation Hub

> Derived from the shared materials dated 2026-09-25 (prepared by Sato, 株式会社ビザビ / Vis-à-vis).
> These documents are an English-language digest of the Japanese source files. Japanese UI labels are kept in parentheses where useful.

## What is Vinsight?

**Vinsight** (`https://vinsight.jp`) is an online **survey-monitor panel system** run by 株式会社ビザビ / 協同組合岡山情報文化研究所 (Okayama). It has two sides:

| Side | Users | Purpose |
|------|-------|---------|
| **Monitor My Page** (`/mypage/`) | Registered survey respondents ("monitors") | Answer surveys, earn reward points, exchange points for gift cards, manage profile, withdraw |
| **Admin console** (`/vin_root/`) | Operators | Create/distribute surveys, publish news, process point-exchange requests, manage monitors, count sample sizes, review withdrawals, configure mail templates |

The project is a **replacement (リプレイス) of the existing PHP system**, combined with a new set of improvements and a redesigned registration form aimed at also serving "content members" (regional media readers – Okayama food/town magazines).

## Document map

| # | File | What it answers |
|---|------|-----------------|
| 1 | [overview.md](overview.md) | Business context, goals, actors, scope, project status |
| 2 | [requirements.md](requirements.md) | All 35 change requests (要求事項) with priority/status, grouped and analysed |
| 3 | [architecture.md](architecture.md) | Current system architecture (as inferred) and replacement considerations |
| 4 | [sitemap-and-urls.md](sitemap-and-urls.md) | Screen hierarchy, numbering scheme (A, A-1, A-1-1…), URL/route table |
| 5 | [flows.md](flows.md) | Screen-transition and business-process flows (Mermaid diagrams) |
| 6 | [admin-screens.md](admin-screens.md) | Per-screen field spec of the admin console (A–G) |
| 7 | [monitor-mypage-screens.md](monitor-mypage-screens.md) | Per-screen field spec of the Monitor My Page |
| 8 | [data-model.md](data-model.md) | Inferred entities, attributes, relationships, state machines |
| 9 | [registration-form-redesign.md](registration-form-redesign.md) | Old vs. proposed registration form / profile items |
| 10 | [email-templates.md](email-templates.md) | System emails and `%%placeholder%%` variables |
| 11 | [design-notes.md](design-notes.md) | UI/UX conventions, documentation conventions, design observations |
| 12 | [security-and-compliance.md](security-and-compliance.md) | Security findings and personal-data concerns |
| 13 | [open-questions.md](open-questions.md) | Unconfirmed items, ambiguities, decisions pending |
| 14 | [glossary.md](glossary.md) | Japanese ↔ English terms and abbreviations |
| 15 | [source-materials.md](source-materials.md) | Index of the original files and how they relate |

## Suggested reading order

1. `overview.md` → `requirements.md` (what and why)
2. `sitemap-and-urls.md` → `flows.md` (how it hangs together)
3. `admin-screens.md` / `monitor-mypage-screens.md` (detail)
4. `data-model.md`, `registration-form-redesign.md`, `email-templates.md`
5. `security-and-compliance.md`, `open-questions.md`

## Caveats

- The source Excel files for screen descriptions (`＜画面説明＞`) consist mostly of **annotated screenshots**; their text is only titles. The authoritative text lives in the `＜設計図＞` Excel files and the PDF transition diagrams. Screenshots were **not** analysed in these documents.
- Much of the existing-system description was produced by **automated/manual crawling** of the live site, deliberately avoiding destructive actions. Items marked "unconfirmed" in the sources are carried over as such.
- The requirements file is explicitly **a draft for internal discussion (社内検討用たたき台, Rev.1, 2026-09-19)**; priorities and necessity are not final.
- Counts (e.g. 597 surveys, 3,810 monitors) are snapshots from mid-September 2026 crawls.
