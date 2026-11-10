## SGS UI

Enterprise theme, layout and UX layer for ERPNext / Frappe v15 Desk.

Everything is applied at runtime through hooks. The app never edits core
records (Navbar Settings, Website Settings, Workspaces, Custom Fields), so
uninstalling it restores the stock UI completely.

### What it adds

| Area | Change |
|---|---|
| App shell | A persistent global sidebar on every Desk page. It shows every workspace, highlights the active one (lists and forms included), collapses to an icon rail with peek-on-hover, and becomes a drawer on mobile |
| Navbar | Glass, Solid or Brand style, chevron breadcrumbs, a search launcher with a ⌘K / Ctrl K hint, a light/dark toggle and a user card in the avatar menu |
| Workspaces | A greeting hero (name, workspace, date, company), shortcut tiles with icons, clean link cards, KPI-style number cards and chart cards |
| Lists, reports and forms | Card surfaces, a refined header row, row hover and selection, tab underline, section headings and child tables |
| Overlays | Modals with a blurred backdrop, padded dropdowns, toasts, tooltips and awesomplete lists |
| Command palette | Ctrl/⌘ + K, Ctrl + G or a click on the search bar opens a spotlight panel. It runs Frappe's own AwesomeBar, so every search feature keeps working |
| Motion | A top loading bar and page transitions. Both respect *prefers-reduced-motion* |
| Login page | A split-screen brand panel and a refined sign-in card. Covers login, forgot password, email link and sign-up |
| Theme | Light and dark (midnight slate). Six color presets or custom colors, derived across the UI with `color-mix()` |

### Configure

Open **SGS Settings** at `/app/sgs-settings` as a System Manager. Changes preview live in your
tab. After you save, other users get them on their next page load.

- **Appearance:** master switch, color preset or custom primary/accent, brand name and logos.
- **Layout:** global sidebar on/off, its style (Dark, Light or Brand) and default state, the routes that hide it (POS, print and so on), the navbar style, and the workspace hero with its welcome message.
- **Experience:** command palette, loading bar.
- **Motion & Effects:**
  - Master switch and speed (Fast, Normal or Relaxed).
  - Page transition style (Fade & Slide, Fade or Zoom) and dialog animation (Pop, Slide or None).
  - Workspace cards fade in one after another, and KPI numbers count up.
  - Smooth light/dark cross-fade and a button ripple.
  - Card hover (Lift, Glow or None), button hover, a list-row accent bar and sidebar hover motion.
  - An opt-in animated workspace header.
  - A **Try It** playground on the same tab previews every option live.
  - Users whose OS asks for reduced motion never see motion.
- **Login page:** on/off, headline, sub-headline, feature bullets, optional background image.

### Install on one site only

This bench runs production sites, so follow this order:

```bash
cd /home/frappe/frappe-bench
# 1. make the app importable and listed (no restart yet)
python3.12 -c "from bench.app import install_app; install_app('sgs_ui', bench_path='.', restart_bench=False, skip_assets=True)"
# 2. restart web + workers immediately (all sites blip for a few seconds)
supervisorctl restart frappe-bench-web: frappe-bench-workers:
# 3. build only this app's assets
bench build --app sgs_ui
# 4. install on the target site only
bench --site demo.techaccuracy.com install-app sgs_ui
bench --site demo.techaccuracy.com clear-cache
```

Do steps 1 and 2 back to back. Until the processes restart, a running worker cannot
import a new app listed in `apps.txt`, and `frappe.clear_cache()` imports every listed app.

### Uninstall (full revert)

```bash
bench --site demo.techaccuracy.com uninstall-app sgs_ui --yes
bench --site demo.techaccuracy.com clear-cache
# optional: return to the previous theme and its job-openings API
bench --site demo.techaccuracy.com install-app custom_theme
```

Uninstalling removes the hooks, the `SGS UI` module and the `SGS Settings` DocType.
Users only need to refresh their browser. The only leftovers are `sgs:*` keys in each
browser's localStorage, which nothing reads anymore.

### Performance

Measured on demo.techaccuracy.com on 2026-11-08 with an A/B browser test: stock Frappe vs SGS, same machine, median of 5 runs. Workflow timings are at parity:

| Action | Stock | SGS |
|---|---|---|
| Customer Link field: typing → filtered dropdown | 184 ms | 186 ms |
| Item Code Link field in the items table | 775 ms | 814 ms |
| Form → list navigation | 960 ms | 969 ms |
| Scrolling a long form (p95 frame / janky frames) | 16.8 ms / 0 | 16.8 ms / 0 |
| JS heap | 32 MB | 32.6 MB |

Weight: about 23 KB JS and 57 KB CSS minified, about 21 KB gzipped on the wire, cached for a year.

**Rules this code follows (each one measured, see git history):**
- No `:has()` selectors and no universal `*` rules. Together they made style recalculation about 10x slower on Frappe's large DOM.
- No `backdrop-filter` on sticky bars, because it re-renders on every scroll frame. Blur appears only on static overlays.
- No `transform` hover-lifts on widgets that contain menus (stacking contexts trap dropdowns). No `overflow: hidden` on dialogs, grids or cards that host Link dropdowns.
- No endless animations in Desk unless the admin opts in (Animated workspace header). Page transitions, the card entrance and the ripple use `element.animate()`, which forces no layout.
- The card entrance runs inside the workspace MutationObserver callback. Observer callbacks run before the browser paints, so cards start fading in before they are ever drawn. Nothing is pre-hidden and there are no timers.
- New settings fields ship with a patch (`patches/v1_1/set_motion_defaults`) that reads the raw stored record: a loaded Document reports never-saved Check fields as 0, not empty.
- Build with `bench build --app sgs_ui --production`. `developer_mode` builds are unminified.

### Compatibility shim

The demo site's `job-application` web form calls `custom_theme.api.get_open_job_openings`.
SGS UI replaces custom_theme on that site, so `hooks.py` routes that path to
`sgs_ui.compat.job_openings.get_open_job_openings` with `override_whitelisted_methods`.
The logic is identical and guest-callable.

### Layout of the code

```
sgs_ui/
  hooks.py              hooks only (includes, boot, website context, install, compat)
  theme.py              defaults, presets, resolved payloads for Desk and login
  boot.py               extend_bootinfo  -> frappe.boot.sgs
  website.py            update_website_context -> login branding in <head>
  api.py                get_theme (used after saving settings)
  install.py            after_install defaults, after_uninstall cache clear
  compat/               custom_theme endpoint shim
  sgs_ui/doctype/sgs_settings/   Single DocType + live-preview form script
  public/scss/sgs_desk.bundle.scss  tokens, base, controls, overlays, shell,
                                       navbar, page, workspace, list, form,
                                       palette, motion  (all under html.zn)
  public/js/sgs_desk.bundle.js      settings, sidebar, navbar, palette, hero,
                                       tiles, motion
  public/scss|js/sgs_login.bundle.* login page (gated by html.zn-login)
```

### License

MIT
