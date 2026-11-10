// Global sidebar: every workspace, on every Desk page.

import {
	on,
	escape,
	safe,
	is_collapsed,
	set_collapsed,
	toggle_theme,
	current_theme,
	storage_get,
	storage_set,
} from "./settings";
import { ICONS } from "./icons";

const OPEN_KEY = "sgs:sidebar-open-groups";

export default class SGSSidebar {
	constructor(settings) {
		this.settings = settings;
		this.open_groups = new Set(JSON.parse(storage_get(OPEN_KEY, "[]") || "[]"));
		this.items = [];
		this.render();
		this.bind();
		// at app_ready the router may not have resolved a route yet; the
		// router "change" event that follows performs the real sync
		safe("sidebar initial sync", () => this.sync_route());
	}

	// ---------- data ----------
	get_workspaces() {
		const user = frappe.session.user;
		const all = (frappe.boot.allowed_workspaces || []).filter(
			(w) => !Number(w.is_hidden) && w.title !== "Welcome Workspace"
		);
		const personal = all.filter((w) => !Number(w.public) && w.for_user === user);
		const shared = all.filter((w) => Number(w.public));
		return { personal, shared };
	}

	route_for(w) {
		const slug = frappe.router.slug(w.title);
		return Number(w.public) ? `/app/${slug}` : `/app/private/${slug}`;
	}

	// ---------- markup ----------
	render() {
		const { personal, shared } = this.get_workspaces();
		const s = this.settings;

		this.$backdrop = $(`<div class="zn-sb-backdrop" aria-hidden="true"></div>`).appendTo("body");
		this.$el = $(`
			<aside class="zn-sidebar" aria-label="${escape(__("Main navigation"))}">
				<div class="zn-sb-head">${this.brand_html()}</div>
				<nav class="zn-sb-nav"></nav>
				<div class="zn-sb-foot">${this.foot_html()}</div>
			</aside>
		`).appendTo("body");

		const $nav = this.$el.find(".zn-sb-nav");
		if (personal.length) $nav.append(this.section_html(__("My Workspaces"), personal));
		if (shared.length) $nav.append(this.section_html(__("Workspaces"), shared));

		this.$items = this.$el.find(".zn-sb-item[data-ws]");
		this.update_theme_button();
		this.paint_collapse_button();
	}

	brand_html() {
		const s = this.settings;
		const dark_surface = s.sidebar.style !== "Light" || current_theme() === "dark";
		const name = s.brand_name || "ERPNext";
		let mark;
		if (dark_surface && s.brand_logo_dark) {
			mark = `<img class="zn-sb-logo is-plain" src="${escape(s.brand_logo_dark)}" alt="">`;
		} else if (s.brand_logo) {
			// logos are usually drawn for light backgrounds: give them a white tile on dark surfaces
			mark = `<img class="zn-sb-logo ${dark_surface ? "" : "is-plain"}" src="${escape(s.brand_logo)}" alt="">`;
		} else {
			mark = `<span class="zn-sb-monogram">${escape(name.charAt(0).toUpperCase())}</span>`;
		}
		const label = on(s.show_brand_name) ? `<span class="zn-sb-brand-name">${escape(name)}</span>` : "";
		return `<a class="zn-sb-brand" href="/app" aria-label="${escape(name)}">${mark}${label}</a>`;
	}

	section_html(label, workspaces) {
		const titles = new Set(workspaces.map((w) => w.title));
		const roots = workspaces.filter((w) => !w.parent_page || !titles.has(w.parent_page));
		const children_of = (parent) => workspaces.filter((w) => w.parent_page === parent.title);

		const groups = roots
			.map((w) => {
				const children = children_of(w);
				const open = this.open_groups.has(w.title);
				return `
				<div class="zn-sb-group ${open ? "is-open" : ""}" data-group="${escape(w.title)}">
					${this.item_html(w, children.length > 0)}
					${
						children.length
							? `<div class="zn-sb-children">${children
									.map((c) => this.item_html(c, false))
									.join("")}</div>`
							: ""
					}
				</div>`;
			})
			.join("");

		return `
			<div class="zn-sb-section">
				<div class="zn-sb-label">${escape(label)}</div>
				${groups}
			</div>`;
	}

	item_html(w, has_children) {
		const label = __(w.title);
		const caret = has_children
			? `<button type="button" class="zn-sb-caret" aria-label="${escape(__("Toggle {0}", [label]))}">
					${frappe.utils.icon("es-line-down", "xs")}
				</button>`
			: "";
		return `
			<a class="zn-sb-item" href="${this.route_for(w)}" data-ws="${escape(w.title)}"
				data-ws-name="${escape(w.name)}" aria-label="${escape(label)}">
				<span class="zn-sb-icon">${frappe.utils.icon(w.icon || "folder-normal", "md")}</span>
				<span class="zn-sb-text">${escape(label)}</span>
				${caret}
			</a>`;
	}

	foot_html() {
		const settings_link = frappe.user.has_role("System Manager")
			? `<a class="zn-sb-btn" href="/app/sgs-settings" aria-label="${escape(__("Theme Settings"))}">
					${frappe.utils.icon("es-line-settings", "sm")}
					<span class="zn-sb-btn-label">${escape(__("Theme"))}</span>
				</a>`
			: "";
		return `
			<button type="button" class="zn-sb-btn zn-sb-theme" aria-label="${escape(__("Toggle dark mode"))}">
				<span class="zn-sb-theme-icon"></span>
				<span class="zn-sb-btn-label zn-sb-theme-label"></span>
			</button>
			${settings_link}
			<button type="button" class="zn-sb-btn zn-sb-collapse"></button>`;
	}

	paint_collapse_button() {
		const collapsed = document.documentElement.classList.contains("zn-sb-collapsed");
		this.$el
			.find(".zn-sb-collapse")
			.attr("aria-label", collapsed ? __("Expand sidebar") : __("Collapse sidebar"))
			.attr("title", collapsed ? __("Expand sidebar") : __("Collapse sidebar"))
			.html(collapsed ? ICONS.chevrons_right : ICONS.chevrons_left);
	}

	update_theme_button() {
		const dark = current_theme() === "dark";
		this.$el.find(".zn-sb-theme-icon").html(dark ? ICONS.sun : ICONS.moon);
		this.$el.find(".zn-sb-theme-label").text(dark ? __("Light mode") : __("Dark mode"));
	}

	// ---------- behaviour ----------
	bind() {
		this.$el.on("click", ".zn-sb-caret", (e) => {
			e.preventDefault();
			e.stopPropagation();
			const $group = $(e.currentTarget).closest(".zn-sb-group");
			this.toggle_group($group, !$group.hasClass("is-open"));
		});

		this.$el.on("click", ".zn-sb-item", () => {
			if (this.is_drawer()) this.close_drawer();
		});

		this.$el.on("click", ".zn-sb-collapse", () => this.toggle_collapse());
		this.$el.on("click", ".zn-sb-theme", () => {
			toggle_theme();
		});
		$(document).on("sgs:theme-change", () => {
			this.update_theme_button();
			this.$el.find(".zn-sb-head").html(this.brand_html());
		});

		this.$backdrop.on("click", () => this.close_drawer());
		$(document).on("keydown", (e) => {
			if (e.key === "Escape" && this.is_drawer_open()) this.close_drawer();
		});

		frappe.router.on("change", () => {
			this.close_drawer();
			this.sync_route();
		});

		// Frappe resolves "which workspace does this doctype belong to" while
		// building breadcrumbs; reuse that so lists and forms highlight correctly.
		const breadcrumbs = frappe.breadcrumbs;
		if (breadcrumbs && breadcrumbs.update && !breadcrumbs.__sgs_wrapped) {
			const original = breadcrumbs.update;
			breadcrumbs.update = function (...args) {
				const result = original.apply(this, args);
				safe("sidebar sync", () => frappe.sgs.sidebar && frappe.sgs.sidebar.sync_route());
				return result;
			};
			breadcrumbs.__sgs_wrapped = true;
		}
	}

	toggle_group($group, open) {
		$group.toggleClass("is-open", open);
		const title = $group.attr("data-group");
		open ? this.open_groups.add(title) : this.open_groups.delete(title);
		storage_set(OPEN_KEY, JSON.stringify([...this.open_groups]));
	}

	toggle_collapse() {
		set_collapsed(!document.documentElement.classList.contains("zn-sb-collapsed"));
		this.paint_collapse_button();
	}

	is_drawer() {
		return window.matchMedia("(max-width: 991px)").matches;
	}

	is_drawer_open() {
		return document.documentElement.classList.contains("zn-sb-open");
	}

	open_drawer() {
		document.documentElement.classList.add("zn-sb-open");
		this.$el.find(".zn-sb-item.is-active").get(0)?.scrollIntoView({ block: "center" });
	}

	close_drawer() {
		document.documentElement.classList.remove("zn-sb-open");
	}

	toggle_drawer() {
		this.is_drawer_open() ? this.close_drawer() : this.open_drawer();
	}

	// ---------- route awareness ----------
	sync_route() {
		const first = (window.location.pathname.split("/")[2] || "").toLowerCase();
		const hidden = (this.settings.sidebar.hidden_routes || []).map((r) => String(r).toLowerCase());
		document.documentElement.classList.toggle("zn-sb-route-hidden", !!first && hidden.includes(first));

		const active = this.current_workspace();
		this.$items.removeClass("is-active").removeAttr("aria-current");
		if (!active) return;

		const $match = this.$items.filter(
			(_, el) => el.dataset.ws === active || el.dataset.wsName === active
		);
		const $item = $match.first();
		if (!$item.length) return;

		$item.addClass("is-active").attr("aria-current", "page");
		const $group = $item.closest(".zn-sb-children").closest(".zn-sb-group");
		if ($group.length && !$group.hasClass("is-open")) $group.addClass("is-open");

		const el = $item.get(0);
		const nav = this.$el.find(".zn-sb-nav").get(0);
		if (el && nav) {
			const top = el.offsetTop;
			if (top < nav.scrollTop || top > nav.scrollTop + nav.clientHeight - 40) {
				nav.scrollTop = top - nav.clientHeight / 2;
			}
		}
	}

	current_workspace() {
		const route = frappe.get_route();
		if (!route || !route.length) return null;
		if (route[0] === "Workspaces") {
			return route[1] === "private" ? route[2] : route[1];
		}
		try {
			const crumbs = frappe.breadcrumbs?.all?.[frappe.breadcrumbs.current_page()];
			return crumbs?.workspace || null;
		} catch (e) {
			return null;
		}
	}
}
