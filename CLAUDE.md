# asuss-admin-design

Static, anonymized design kit of the asuss (Laravel 8) admin panel. Read README.md, DESIGN.md and ISSUES.md first.

## Rules
- Never add real data (names, phones, national IDs, passports, emails, personal photos). New captures go through `tools/build_kit.py`, which anonymizes; `raw/`, `fixtures/`, `names_raw.txt`, `ui_vocab.txt`, `ui_corpus.txt` stay out of git.
- Do not edit `assets/admin/assets/css/luno-style.css` (vendor theme). Put design changes in `assets/admin/custom/kit-overrides.css` (create it and link it after `admin-tables.css`) so they port to asuss as one file.
- `assets/<path>` mirrors asuss `public/<path>`; `screens/<slug>.html` is the *rendered output* of the Blade view listed in `kit/screens.json`. A change to a screen's HTML must be re-applied by hand to that Blade file in asuss.
- Keep RTL Arabic as the primary layout; check LTR doesn't break when touching shared CSS.
- Serve with `python3 -m http.server 8791`; tables need it (they load rows through `kit/kit-mock.js`).
- This kit is Asuss only («شركة أسس الإنجاز للاستقدام»). Never bring in Click & More / ClickERP names, logos, colours or `v2-assets`; the Asuss login is `dashboard/login`, not `v2/login`.
