// Workspace hero: greeting, workspace title, today's date and company.

import { escape, on } from "./settings";
import { ICONS } from "./icons";

const SECTION = '.page-container[data-page-route="Workspaces"] .layout-main-section';

export default class SGSHero {
	constructor(settings) {
		this.settings = settings;
		frappe.router.on("change", () => this.schedule());
		$(document).on("page-change", () => this.schedule());
		this.schedule();
	}

	schedule() {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => this.update(), 30);
	}

	// Mirror Frappe's `.edit-mode` (on .layout-main-section) as `.zn-editing` on
	// the page container, so CSS needs no :has(). Observes one attribute only.
	watch_edit_mode(section) {
		if (!section || section.__sgs_edit_watch) return;
		section.__sgs_edit_watch = true;
		const page = section.closest('.page-container[data-page-route="Workspaces"]');
		const sync = () => page && page.classList.toggle("zn-editing", section.classList.contains("edit-mode"));
		new MutationObserver(sync).observe(section, { attributes: true, attributeFilter: ["class"] });
		sync();
	}

	update(attempt = 0) {
		const route = frappe.get_route() || [];
		if (route[0] !== "Workspaces") return;

		const title = route[1] === "private" ? route[2] : route[1];
		const $section = $(SECTION);
		if (!$section.length || !title) {
			// the Workspaces page is created lazily on first visit
			if (attempt < 20) setTimeout(() => this.update(attempt + 1), 100);
			return;
		}
		this.watch_edit_mode($section.get(0));
		if (!on(this.settings.hero.enabled)) return;

		let $hero = $section.children(".zn-hero");
		if (!$hero.length) {
			$hero = $(`<section class="zn-hero" aria-label="${escape(__("Workspace overview"))}"></section>`);
			$section.prepend($hero);
		}
		$hero.html(this.html(title));
	}

	html(title) {
		const name = this.first_name();
		const company = this.company();
		const message = (this.settings.hero.message || "")
			.replace(/\{first_name\}/g, name)
			.replace(/\{company\}/g, company || "");
		const sub = message || __("Shortcuts, reports and insights for {0}, all in one place.", [__(title)]);

		const chips = [`<span class="zn-chip">${ICONS.calendar}${escape(this.today())}</span>`];
		if (company) chips.push(`<span class="zn-chip">${ICONS.building}${escape(company)}</span>`);

		return `
			<div class="zn-hero-main">
				<div class="zn-hero-eyebrow">${ICONS.sparkle}${escape(this.greeting())}, ${escape(name)}</div>
				<h1 class="zn-hero-title">${escape(__(title))}</h1>
				<div class="zn-hero-sub">${escape(sub)}</div>
			</div>
			<div class="zn-hero-meta">${chips.join("")}</div>`;
	}

	greeting() {
		const hour = new Date().getHours();
		if (hour < 12) return __("Good morning");
		if (hour < 17) return __("Good afternoon");
		return __("Good evening");
	}

	first_name() {
		const info = frappe.user_info(frappe.session.user) || {};
		return (info.fullname || frappe.session.user || "").split(" ")[0];
	}

	company() {
		return (
			frappe.defaults.get_user_default("Company") ||
			frappe.defaults.get_user_default("company") ||
			frappe.defaults.get_global_default("company") ||
			""
		);
	}

	today() {
		try {
			return new Intl.DateTimeFormat(frappe.boot.lang || "en", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(new Date());
		} catch (e) {
			return frappe.datetime.str_to_user(frappe.datetime.get_today());
		}
	}
}
