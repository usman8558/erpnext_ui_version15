// Theme settings: read from the boot payload, applied to <html> as classes and
// CSS variables. Runs synchronously at bundle load, before Desk renders.

export const DEFAULTS = {
	enabled: 1,
	primary: "#4F46E5",
	accent: "#06B6D4",
	brand_name: "",
	show_brand_name: 1,
	brand_logo: "",
	brand_logo_dark: "",
	sidebar: {
		enabled: 1,
		style: "Dark",
		default_state: "Expanded",
		hidden_routes: ["point-of-sale", "posapp", "print", "setup-wizard"],
	},
	navbar_style: "Glass",
	hero: { enabled: 1, message: "" },
	palette: 1,
	loading_bar: 1,
	transitions: 1,
	motion: {
		enabled: 1,
		speed: "Normal",
		page_transition: "Fade & Slide",
		dialog: "Pop",
		stagger: 1,
		count_up: 1,
		smooth_theme: 1,
		ripple: 1,
		card_hover: "Lift",
		button_hover: 1,
		row_accent: 1,
		sidebar_motion: 1,
		animated_hero: 0,
	},
};

const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;
const STATE_KEY = "sgs:sidebar";
const REDUCED = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

export function get_settings() {
	const boot = (window.frappe && frappe.boot && frappe.boot.sgs) || {};
	const motion = { ...DEFAULTS.motion, ...(boot.motion || {}) };
	// older boot payloads only had the page-transition on/off flag
	if (!boot.motion && boot.transitions !== undefined && !Number(boot.transitions)) motion.page_transition = "None";
	return {
		...DEFAULTS,
		...boot,
		sidebar: { ...DEFAULTS.sidebar, ...(boot.sidebar || {}) },
		hero: { ...DEFAULTS.hero, ...(boot.hero || {}) },
		motion,
	};
}

// Is a given motion feature allowed right now? (master switch + OS preference)
export function motion_on(settings, key) {
	const m = settings.motion || {};
	if (!on(m.enabled) || REDUCED.matches) return false;
	return key ? on(m[key]) : true;
}

export function speed_factor(settings) {
	return { Fast: 0.7, Relaxed: 1.4 }[(settings.motion || {}).speed] || 1;
}

export const on = (value) => !!Number(value);

export function storage_get(key, fallback = null) {
	try {
		const value = window.localStorage.getItem(key);
		return value === null ? fallback : value;
	} catch (e) {
		return fallback;
	}
}

export function storage_set(key, value) {
	try {
		window.localStorage.setItem(key, value);
	} catch (e) {
		// private mode / blocked storage: preference just isn't remembered
	}
}

export function is_collapsed(settings) {
	const saved = storage_get(STATE_KEY);
	if (saved) return saved === "collapsed";
	return settings.sidebar.default_state === "Collapsed";
}

export function set_collapsed(collapsed) {
	storage_set(STATE_KEY, collapsed ? "collapsed" : "expanded");
	document.documentElement.classList.toggle("zn-sb-collapsed", collapsed);
}

const STYLE_CLASSES = [
	"zn",
	"zn-sb-dark",
	"zn-sb-light",
	"zn-sb-brand",
	"zn-nav-glass",
	"zn-nav-solid",
	"zn-nav-brand",
	"zn-has-sidebar",
	"zn-sb-collapsed",
	"zn-hero-on",
	"zn-palette-on",
	"zn-motion",
	"zn-anim",
	"zn-speed-fast",
	"zn-speed-relaxed",
	"zn-hover-lift",
	"zn-hover-glow",
	"zn-btn-hover",
	"zn-row-accent",
	"zn-sb-motion",
	"zn-hero-animated",
	"zn-dialog-pop",
	"zn-dialog-slide",
	"zn-dialog-none",
];

export function apply(settings) {
	const root = document.documentElement;
	root.classList.remove(...STYLE_CLASSES);

	if (!on(settings.enabled)) {
		root.style.removeProperty("--zn-primary");
		root.style.removeProperty("--zn-accent");
		return false;
	}

	if (HEX.test(settings.primary || "")) root.style.setProperty("--zn-primary", settings.primary);
	if (HEX.test(settings.accent || "")) root.style.setProperty("--zn-accent", settings.accent);

	const sidebar_style = (settings.sidebar.style || "Dark").toLowerCase();
	const navbar_style = (settings.navbar_style || "Glass").toLowerCase();

	root.classList.add("zn", `zn-sb-${sidebar_style}`, `zn-nav-${navbar_style}`);
	root.classList.toggle("zn-has-sidebar", on(settings.sidebar.enabled));
	root.classList.toggle("zn-sb-collapsed", on(settings.sidebar.enabled) && is_collapsed(settings));
	root.classList.toggle("zn-hero-on", on(settings.hero.enabled));
	root.classList.toggle("zn-palette-on", on(settings.palette));
	root.classList.toggle("zn-motion", on(settings.transitions));
	apply_motion(root, settings);
	return true;
}

// Motion classes. CSS keys everything off these, so the settings form can
// preview any combination live.
function apply_motion(root, settings) {
	const m = settings.motion || {};
	const anim = on(m.enabled);
	root.classList.toggle("zn-anim", anim);
	root.classList.toggle("zn-speed-fast", anim && m.speed === "Fast");
	root.classList.toggle("zn-speed-relaxed", anim && m.speed === "Relaxed");
	root.classList.toggle("zn-hover-lift", anim && m.card_hover === "Lift");
	root.classList.toggle("zn-hover-glow", anim && m.card_hover === "Glow");
	root.classList.toggle("zn-btn-hover", anim && on(m.button_hover));
	root.classList.toggle("zn-row-accent", anim && on(m.row_accent));
	root.classList.toggle("zn-sb-motion", anim && on(m.sidebar_motion));
	root.classList.toggle("zn-hero-animated", anim && on(m.animated_hero));
	const dialog = anim ? String(m.dialog || "Pop").toLowerCase() : "none";
	root.classList.add(`zn-dialog-${["pop", "slide"].includes(dialog) ? dialog : "none"}`);
}

// Light/Dark toggle that goes through Frappe's own theme setting, so the
// choice is saved on the user and survives reloads.
export function toggle_theme() {
	const root = document.documentElement;
	const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
	const swap = () => {
		root.setAttribute("data-theme-mode", next);
		if (frappe.ui.set_theme) {
			frappe.ui.set_theme();
		} else {
			root.setAttribute("data-theme", next);
		}
	};
	// cross-fade light <-> dark where the browser supports View Transitions
	const settings = (frappe.sgs && frappe.sgs.settings) || get_settings();
	if (document.startViewTransition && motion_on(settings, "smooth_theme")) {
		document.startViewTransition(swap);
	} else {
		swap();
	}
	frappe.xcall("frappe.core.doctype.user.user.switch_theme", {
		theme: next === "dark" ? "Dark" : "Light",
	});
	return next;
}

// One source of truth for "theme changed": the data-theme attribute itself, so
// Frappe's own theme dialog and OS-level auto switching repaint our toggles too.
export function watch_theme() {
	let last = current_theme();
	new MutationObserver(() => {
		const now = current_theme();
		if (now !== last) {
			last = now;
			$(document).trigger("sgs:theme-change", [now]);
		}
	}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

export function current_theme() {
	return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function escape(value) {
	return frappe.utils.escape_html(String(value ?? ""));
}

export function safe(label, fn) {
	try {
		return fn();
	} catch (e) {
		// a theme feature must never break Desk; skip it and keep going
		console.warn(`[SGS UI] ${label} skipped:`, e);
	}
}
