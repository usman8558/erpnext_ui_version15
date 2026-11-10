"""SGS UI theme settings: defaults, presets and the payload sent to the browser.

Everything the client needs is resolved here, so boot (Desk) and the website
context (login page) always read identical values.
"""

import re

import frappe

SETTINGS_DOCTYPE = "SGS Settings"

HEX_COLOR = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

PRESETS = {
	"SGS Indigo": {"primary": "#4F46E5", "accent": "#06B6D4"},
	"Ocean Blue": {"primary": "#2563EB", "accent": "#0EA5E9"},
	"Emerald": {"primary": "#059669", "accent": "#0EA5E9"},
	"Royal Purple": {"primary": "#7C3AED", "accent": "#EC4899"},
	"Crimson": {"primary": "#DC2626", "accent": "#F97316"},
	"Graphite": {"primary": "#334155", "accent": "#0EA5E9"},
}
DEFAULT_PRESET = "SGS Indigo"

DEFAULT_HIDDEN_ROUTES = "point-of-sale\nposapp\nprint\nsetup-wizard"

DEFAULT_LOGIN_FEATURES = "\n".join(
	(
		"Finance, sales, inventory and people in one connected system",
		"Real-time dashboards and reports for every team",
		"Role-based access with a complete audit trail",
	)
)

# Values used when a field has never been saved (fresh install or new field).
DEFAULTS = {
	"enabled": 1,
	"preset": DEFAULT_PRESET,
	"primary_color": PRESETS[DEFAULT_PRESET]["primary"],
	"accent_color": PRESETS[DEFAULT_PRESET]["accent"],
	"brand_name": "",
	"show_brand_name": 1,
	"brand_logo": "",
	"brand_logo_dark": "",
	"enable_sidebar": 1,
	"sidebar_style": "Dark",
	"sidebar_default_state": "Expanded",
	"navbar_style": "Glass",
	"sidebar_hidden_routes": DEFAULT_HIDDEN_ROUTES,
	"show_workspace_hero": 1,
	"welcome_message": "",
	"enable_command_palette": 1,
	"enable_loading_bar": 1,
	"enable_page_transitions": 1,
	"enable_login_page": 1,
	"login_headline": "Run your entire business on one intelligent platform",
	"login_subheadline": "Finance, sales, supply chain, people and projects, connected in real time.",
	"login_features": DEFAULT_LOGIN_FEATURES,
	"login_background": "",
	# Motion & Effects
	"enable_animations": 1,
	"animation_speed": "Normal",
	"page_transition_style": "Fade & Slide",
	"dialog_animation": "Pop",
	"stagger_workspace": 1,
	"count_up_numbers": 1,
	"smooth_theme_switch": 1,
	"button_ripple": 1,
	"card_hover": "Lift",
	"button_hover": 1,
	"list_row_accent": 1,
	"sidebar_hover_motion": 1,
	"animated_hero": 0,
}

CHECK_FIELDS = {
	"enabled",
	"show_brand_name",
	"enable_sidebar",
	"show_workspace_hero",
	"enable_command_palette",
	"enable_loading_bar",
	"enable_page_transitions",
	"enable_login_page",
	"enable_animations",
	"stagger_workspace",
	"count_up_numbers",
	"smooth_theme_switch",
	"button_ripple",
	"button_hover",
	"list_row_accent",
	"sidebar_hover_motion",
	"animated_hero",
}


def get_settings() -> frappe._dict:
	"""Saved settings merged over DEFAULTS (unsaved or empty values fall back)."""
	values = frappe._dict(DEFAULTS)
	if not frappe.db.exists("DocType", SETTINGS_DOCTYPE):
		# Defensive: during install/uninstall the DocType may not exist yet.
		return values

	doc = frappe.get_cached_doc(SETTINGS_DOCTYPE)
	for field, default in DEFAULTS.items():
		value = doc.get(field)
		if field in CHECK_FIELDS:
			values[field] = default if value is None else int(value)
		elif value not in (None, ""):
			values[field] = value
	return values


def resolve_colors(settings: frappe._dict) -> tuple[str, str]:
	"""Primary and accent color for the chosen preset; only safe hex values pass."""
	if settings.preset in PRESETS:
		colors = PRESETS[settings.preset]
		return colors["primary"], colors["accent"]

	fallback = PRESETS[DEFAULT_PRESET]
	primary = settings.primary_color if is_hex_color(settings.primary_color) else fallback["primary"]
	accent = settings.accent_color if is_hex_color(settings.accent_color) else fallback["accent"]
	return primary, accent


def is_hex_color(value) -> bool:
	return bool(value) and bool(HEX_COLOR.match(str(value).strip()))


GENERIC_APP_NAMES = {"frappe", "frappe framework"}


def get_brand_name(settings: frappe._dict) -> str:
	"""Brand from settings, else a site app name, else the product name.

	"Frappe" is the factory default for app_name, so it is skipped in favour
	of "ERPNext" when ERPNext is installed.
	"""
	if settings.brand_name:
		return settings.brand_name

	for doctype in ("Website Settings", "System Settings"):
		value = (frappe.db.get_single_value(doctype, "app_name") or "").strip()
		if value and value.lower() not in GENERIC_APP_NAMES:
			return value

	return "ERPNext" if "erpnext" in frappe.get_installed_apps() else "Frappe"


def split_lines(value: str | None) -> list[str]:
	return [line.strip() for line in (value or "").splitlines() if line.strip()]


def get_desk_payload() -> dict:
	"""Everything the Desk bundle reads from `frappe.boot.sgs`."""
	settings = get_settings()
	primary, accent = resolve_colors(settings)
	return {
		"enabled": settings.enabled,
		"preset": settings.preset,
		"primary": primary,
		"accent": accent,
		"brand_name": get_brand_name(settings),
		"show_brand_name": settings.show_brand_name,
		"brand_logo": settings.brand_logo,
		"brand_logo_dark": settings.brand_logo_dark,
		"sidebar": {
			"enabled": settings.enable_sidebar,
			"style": settings.sidebar_style,
			"default_state": settings.sidebar_default_state,
			"hidden_routes": split_lines(settings.sidebar_hidden_routes),
		},
		"navbar_style": settings.navbar_style,
		"hero": {
			"enabled": settings.show_workspace_hero,
			"message": settings.welcome_message,
		},
		"palette": settings.enable_command_palette,
		"loading_bar": settings.enable_loading_bar,
		"transitions": settings.enable_page_transitions,
		"motion": get_motion(settings),
		"presets": PRESETS,
	}


def get_motion(settings: frappe._dict) -> dict:
	"""Animation & hover-effect switches (all off when the master switch is off)."""
	return {
		"enabled": settings.enable_animations,
		"speed": settings.animation_speed,
		"page_transition": settings.page_transition_style if settings.enable_page_transitions else "None",
		"dialog": settings.dialog_animation,
		"stagger": settings.stagger_workspace,
		"count_up": settings.count_up_numbers,
		"smooth_theme": settings.smooth_theme_switch,
		"ripple": settings.button_ripple,
		"card_hover": settings.card_hover,
		"button_hover": settings.button_hover,
		"row_accent": settings.list_row_accent,
		"sidebar_motion": settings.sidebar_hover_motion,
		"animated_hero": settings.animated_hero,
	}


def get_login_payload() -> dict | None:
	"""Public branding for the login page, or None when the custom login is off.

	With no brand logo set, the page shows a monogram tile in the brand colors.
	"""
	settings = get_settings()
	if not (settings.enabled and settings.enable_login_page):
		return None

	primary, accent = resolve_colors(settings)
	return {
		"primary": primary,
		"accent": accent,
		"brand_name": get_brand_name(settings),
		"logo": settings.brand_logo or "",
		"headline": settings.login_headline,
		"subheadline": settings.login_subheadline,
		"features": split_lines(settings.login_features),
		"background": settings.login_background,
	}
