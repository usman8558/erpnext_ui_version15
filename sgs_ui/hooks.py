app_name = "sgs_ui"
app_title = "SGS UI"
app_publisher = "TechAccuracy"
app_description = "Enterprise-grade theme, layout and UX layer for ERPNext Desk"
app_email = "usman@techaccuracy.com"
app_license = "mit"

# Everything below is applied at runtime through hooks. No core record is
# modified, so uninstalling the app reverts the UI completely.

# Desk
# ------------------
app_include_css = "sgs_desk.bundle.css"
app_include_js = "sgs_desk.bundle.js"

# Website: only the login page is styled (all rules are gated by html.zn-login)
# ------------------
web_include_css = "sgs_login.bundle.css"
web_include_js = "sgs_login.bundle.js"

# Theme settings travel with the Desk boot payload
extend_bootinfo = "sgs_ui.boot.extend_bootinfo"

# Login page branding, injected into <head> before first paint
update_website_context = "sgs_ui.website.update_website_context"

# Installation
# ------------------
after_install = "sgs_ui.install.after_install"
after_uninstall = "sgs_ui.install.after_uninstall"

# Compatibility
# ------------------
# The demo site's job-application web form calls custom_theme's endpoint by
# path. SGS UI replaces custom_theme there, so keep that path working.
override_whitelisted_methods = {
	"custom_theme.api.get_open_job_openings": "sgs_ui.compat.job_openings.get_open_job_openings",
}
