# CLAUDE.md: sgs_ui

SGS UI is an enterprise theme, layout and UX layer for ERPNext / Frappe v15 Desk and the login page: global sidebar, glass navbar, workspace hero, command palette (Ctrl/⌘ K), motion, and a branded login. It is configured from the single doctype **SGS Settings** (`/app/sgs-settings`). Built by TechAccuracy. Started on 2026-11-07 as `zenith_ui` and renamed with a full rebrand on 2026-11-08. [README.md](README.md) covers features, settings, install/uninstall order, measured performance and the code layout. Read it before changing anything.

## Where it runs (production!)

- Bench: `/home/frappe/frappe-bench` (Frappe v15.76.0, ERPNext 15.74.0, Python 3.10+). `developer_mode` is on bench-wide.
- **Installed on `demo.techaccuracy.com`, `erp.techaccuracy.com` and `gw.techaccuracy.com`.** erp and gw are live production sites. A JS, SCSS or Python change reaches them after the next build or restart. Get the user's go-ahead before building, restarting or migrating, and test on demo first.
- Repo: `github.com/devkeirdevtest-arch/sgs_ui` (private). Commit on `develop`, then merge `develop` into `production` (the default branch) for releases.

## Design contract

- **Fully reversible.** Never edit core records (Navbar Settings, Website Settings, Workspaces, Custom Fields, Desk JS). Everything comes in through hooks (`app_include_*`, `web_include_*`, `extend_bootinfo`, `update_website_context`), so `uninstall-app` restores the stock UI.
- All Desk CSS is scoped under `html.zn`, and login CSS under `html.zn-login`. The internal prefix is still `zn-` (left over from zenith_ui); keep it, don't mix in new prefixes. The JS namespace is `frappe.sgs` and the boot key is `frappe.boot.sgs`.
- `theme.py` is the single source of truth for defaults, presets and the resolved payload. Boot (Desk) and website context (login) both read from it.
- Boot and website hooks must never break Desk or login. They catch exceptions, log them and fall back (see `boot.py`, `website.py`).

## Performance rules (each one was measured; see README "Performance")

- No `:has()` selectors and no universal `*` rules. Together they made style recalculation about 10x slower on Frappe's DOM.
- No `backdrop-filter` on sticky bars. Blur only goes on static overlays.
- No `transform` hover-lifts on widgets that contain menus, and no `overflow: hidden` on dialogs, grids or cards that host Link dropdowns. Both trap or clip dropdowns.
- No endless animations unless the admin opts in. Use `element.animate()`. The card entrance runs inside the MutationObserver callback, with no pre-hiding and no timers.
- Respect `prefers-reduced-motion`.
- Desk CSS has `body{padding:0 !important}`, so the sidebar offset goes on `.main-section`.

## Code map (`sgs_ui/`)

| Path | What |
|---|---|
| `hooks.py` | Asset includes, boot, website context, install hooks, compat override |
| `theme.py` | `DEFAULTS`, `PRESETS`, `get_desk_payload`, `get_login_payload` |
| `boot.py` / `website.py` / `api.py` | `frappe.boot.sgs`; login branding appended to `head_html` (only on `/login`, JSON-escaped); `get_theme` for live re-apply |
| `install.py` | `fill_missing_defaults` (reads raw singles, see below), cache clear on uninstall |
| `patches/v1_1/set_motion_defaults.py` | Fills defaults for fields added in v1.1 |
| `compat/job_openings.py` | Shim for `custom_theme.api.get_open_job_openings` (demo's `job-application` web form), via `override_whitelisted_methods` |
| `sgs_ui/doctype/sgs_settings/` | Single doctype plus the live-preview form script (`frappe.sgs.preview`) |
| `public/js/sgs_desk.bundle.js` + `public/js/desk/*` | settings, sidebar, navbar, palette, hero, tiles, motion, effects, list_selection, icons |
| `public/scss/sgs_desk.bundle.scss` + `public/scss/desk/_*.scss` | tokens, base, controls, overlays, shell, navbar, page, workspace, list, form, palette, motion, effects |
| `public/*/sgs_login.bundle.*` | Login page (split-screen brand panel), gated by `html.zn-login` |

`public/dist/` is the build output and is gitignored.

## Site-specific interactions

- **demo:** `/login` is overridden by `non_profit_mas/www/login.html` (`.big-container`, `.welcome-sec`), and Website Settings `head_html` also styles login. sgs login CSS neutralises both only while `html.zn-login` is set.
- **gw:** its own custom login page lives in Website Settings `head_html` (scoped by `html.gw-auth`). `website.py` only *appends* to `head_html`. Any change to login styling must be checked against gw's page so the two don't fight.
- `custom_theme` must stay on the bench. Production sites may use it, and it is the documented revert path for demo.

## Commands and safe deployment

```bash
cd /home/frappe/frappe-bench
bench build --app sgs_ui --production     # always --production (developer_mode builds are unminified)
bench --site <site> clear-cache
# Python-only change: graceful gunicorn reload (ask the user first; it touches all sites)
supervisorctl signal HUP frappe-bench-web:frappe-bench-frappe-web
# SGS Settings DocType JSON change, per site, without a full migrate (Python True, not JSON true)
bench --site <site> execute frappe.reload_doc --kwargs "{'module': 'SGS UI', 'dt': 'DocType', 'dn': 'SGS Settings', 'force': True}"
```

- **New SGS Settings fields:** a never-saved Check field loads as 0 on a Document. Fill defaults from `frappe.db.get_singles_dict` (as `install.fill_missing_defaults` does) and ship a patch, otherwise a save writes 0.
- **Install order trap:** once an app is listed in `sites/apps.txt`, `frappe.clear_cache()` imports it in every process. For installs, renames or removals, follow the README order (pip install + apps.txt, immediate supervisor restart, build, then install-app per site). Before removing or renaming the package, check `installed_apps` on **every** site; a site that still lists it returns 500 on website routes.
- **Previewing a local build on demo:** block `/assets/sgs_ui/` when injecting the local bundle, otherwise both bundles run.

## Conventions

- Python: tabs, double quotes, line length 110, ruff (see `pyproject.toml`). Pre-commit runs ruff, prettier and eslint.
- Versions are out of step: `sgs_ui/__init__.py` says `0.0.1` and the JS says `frappe.sgs.version = "1.1.0"`. Bump both together on the next release.
- Commit messages: conventional style (`feat:`, `fix:`, `perf:`, `docs:`).
