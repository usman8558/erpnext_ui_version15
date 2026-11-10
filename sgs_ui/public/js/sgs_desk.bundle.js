// SGS UI: Desk bundle.
// Loaded after Frappe's own desk bundles and before Desk renders, so the theme
// classes are on <html> before the first paint of any Desk view.

import { get_settings, apply, safe, on, watch_theme } from "./desk/settings";
import SGSSidebar from "./desk/sidebar";
import SGSPalette from "./desk/palette";
import SGSHero from "./desk/hero";
import { enhance_navbar, watch_scroll } from "./desk/navbar";
import { setup_tiles } from "./desk/tiles";
import { setup_progress } from "./desk/motion";
import { setup_list_selection } from "./desk/list_selection";
import { setup_page_transitions, setup_ripple, count_up_numbers } from "./desk/effects";
import { decorate } from "./desk/tiles";

frappe.provide("frappe.sgs");

const settings = get_settings();
frappe.sgs.settings = settings;
frappe.sgs.version = "1.1.0";

const enabled = safe("theme", () => apply(settings));

// diagnostics handle (run these from the browser console when troubleshooting)
frappe.sgs.fx = { decorate, count_up_numbers };

// Live preview (used by the SGS Settings form): patch and re-apply.
frappe.sgs.preview = (patch = {}) => {
	Object.assign(settings, patch, {
		sidebar: { ...settings.sidebar, ...(patch.sidebar || {}) },
		hero: { ...settings.hero, ...(patch.hero || {}) },
		motion: { ...settings.motion, ...(patch.motion || {}) },
	});
	safe("preview", () => apply(settings));
	safe("preview sidebar", () => {
		const sidebar = frappe.sgs.sidebar;
		if (sidebar) sidebar.$el.find(".zn-sb-head").html(sidebar.brand_html());
	});
};

if (enabled) {
	safe("theme watcher", () => watch_theme());
	safe("loading bar", () => on(settings.loading_bar) && setup_progress());

	const init_navbar = () => safe("navbar", () => enhance_navbar(settings));
	$(document).on("toolbar_setup", init_navbar);

	$(document).on("app_ready", () => {
		init_navbar();
		if (on(settings.sidebar.enabled)) {
			safe("sidebar", () => (frappe.sgs.sidebar = new SGSSidebar(settings)));
		}
		if (on(settings.palette) && frappe.boot.desk_settings?.search_bar !== 0) {
			safe("palette", () => (frappe.sgs.palette = new SGSPalette(settings)));
		}
		safe("hero", () => (frappe.sgs.hero = new SGSHero(settings)));
		safe("tiles", () => setup_tiles());
		// effects check the live settings on every use, so they are always wired
		safe("page transitions", () => setup_page_transitions(settings));
		safe("ripple", () => setup_ripple(settings));
		safe("list selection", () => setup_list_selection());
		safe("scroll", () => watch_scroll());
	});
}
