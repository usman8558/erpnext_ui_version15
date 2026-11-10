// Navbar touches: mobile burger, search launcher hint, theme toggle,
// user-menu header, and a "scrolled" state for elevation.

import { on, escape, toggle_theme, current_theme } from "./settings";
import { ICONS } from "./icons";

export function enhance_navbar(settings) {
	const $navbar = $(".navbar");
	if (!$navbar.length || $navbar.attr("data-sgs")) return;
	$navbar.attr("data-sgs", "1");

	// mobile: open the global sidebar as a drawer
	if (on(settings.sidebar.enabled)) {
		$(`<button type="button" class="zn-nav-icon zn-burger" aria-label="${escape(__("Open navigation"))}">${ICONS.menu}</button>`)
			.prependTo($navbar.find(".container").first())
			.on("click", () => frappe.sgs.sidebar && frappe.sgs.sidebar.toggle_drawer());
	}

	// search: becomes a launcher with a shortcut hint
	const $search = $navbar.find("#navbar-search");
	if ($search.length && on(settings.palette)) {
		$search.attr("placeholder", __("Search or type a command"));
		$search.attr("aria-label", __("Open command palette"));
		const hint = frappe.utils.is_mac() ? "⌘ K" : "Ctrl K";
		$search.closest(".search-bar").append(`<span class="zn-kbd zn-search-kbd">${hint}</span>`);
	}

	// theme toggle, right before the avatar
	const $user_item = $navbar.find(".dropdown-navbar-user");
	if ($user_item.length) {
		const $toggle = $(`
			<li class="nav-item zn-theme-item">
				<button type="button" class="zn-nav-icon zn-theme-btn"></button>
			</li>`).insertBefore($user_item);
		const paint = () => {
			const dark = current_theme() === "dark";
			$toggle
				.find("button")
				.html(dark ? ICONS.sun : ICONS.moon)
				.attr("aria-label", dark ? __("Switch to light mode") : __("Switch to dark mode"))
				.attr("title", dark ? __("Light mode") : __("Dark mode"));
		};
		paint();
		$toggle.on("click", "button", () => toggle_theme());
		$(document).on("sgs:theme-change", paint);
	}

	add_user_card();
}

function add_user_card() {
	const $menu = $("#toolbar-user");
	if (!$menu.length || $menu.find(".zn-user-card").length) return;
	const user = frappe.session.user;
	const info = frappe.user_info(user) || {};
	const email = frappe.session.user_email || info.email || user;
	$menu.prepend(`
		<div class="zn-user-card">
			${frappe.avatar(user, "avatar-medium")}
			<div class="min-w-0">
				<div class="zn-user-name">${escape(info.fullname || user)}</div>
				<div class="zn-user-mail">${escape(email)}</div>
			</div>
		</div>`);
}

export function watch_scroll() {
	let ticking = false;
	const root = document.documentElement;
	const update = () => {
		root.classList.toggle("zn-scrolled", window.scrollY > 4);
		ticking = false;
	};
	window.addEventListener(
		"scroll",
		() => {
			if (!ticking) {
				ticking = true;
				window.requestAnimationFrame(update);
			}
		},
		{ passive: true }
	);
	update();
}
