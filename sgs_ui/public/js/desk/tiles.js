// Shortcut tiles: a colored icon per workspace shortcut, chosen from the
// shortcut's type and target. Read mode only; edit mode stays untouched.

import { stagger_new_blocks, count_up_numbers } from "./effects";

const TONES = ["indigo", "cyan", "emerald", "amber", "rose", "violet", "sky", "teal"];

const TYPE_ICONS = {
	DocType: "es-line-table-view",
	Report: "es-line-reports",
	Page: "es-line-pages",
	Dashboard: "es-line-dashboard",
	URL: "es-line-web-link",
};

const TARGET_ICONS = {
	Customer: "es-line-customer",
	Supplier: "es-line-people",
	Lead: "es-line-add-people",
	Opportunity: "es-line-zap",
	Employee: "es-line-people",
	"Job Applicant": "es-line-add-people",
	Item: "es-line-tag",
	"Item Price": "es-line-tag",
	Warehouse: "es-line-storage",
	"Sales Invoice": "es-line-notes",
	"Purchase Invoice": "es-line-notes",
	"Payment Entry": "es-line-payments",
	"Journal Entry": "es-line-book",
	"Sales Order": "es-line-inbox",
	"Purchase Order": "es-line-inbox",
	Quotation: "es-line-quotes-alt",
	Project: "es-line-plans",
	Task: "es-line-double-check",
	Issue: "es-line-ticket",
	"Stock Entry": "es-line-archive",
	"Material Request": "es-line-file-upload",
	"Salary Slip": "es-line-payments",
	"Leave Application": "es-line-calender",
	Attendance: "es-line-time",
	Leaderboard: "es-line-star",
	"dashboard-view": "es-line-dashboard",
};

const SECTION = '.page-container[data-page-route="Workspaces"] .layout-main-section';

function hash(text) {
	let h = 0;
	for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
	return Math.abs(h);
}

function shortcut_items() {
	return frappe.workspace?.page_data?.shortcuts?.items || [];
}

function icon_for(label) {
	const item = shortcut_items().find((s) => s.label === label || __(s.label) === label) || {};
	return TARGET_ICONS[item.link_to] || TARGET_ICONS[label] || TYPE_ICONS[item.type] || "es-line-arrow-up-right";
}

export function decorate(root = document) {
	const $section = $(root).is(SECTION) ? $(root) : $(SECTION);
	if (!$section.length) return;
	const settings = frappe.sgs && frappe.sgs.settings;
	if (settings) {
		// the debounced pass drives the KPI count-up (stagger runs synchronously
		// in the observer callback below, before paint)
		count_up_numbers($section.get(0), settings);
	}
	if ($section.hasClass("edit-mode")) return;

	$section.find(".widget.shortcut-widget-box").each((_, el) => {
		// Frappe adds the count pill asynchronously; a class (not :has()) drives the layout
		el.classList.toggle("zn-has-count", !!el.querySelector(".widget-control .indicator-pill"));

		const $head = $(el).find(".widget-head").first();
		if (!$head.length || $head.children(".zn-tile").length) return;
		const label = el.getAttribute("aria-label") || $(el).find(".widget-title").text().trim();
		if (!label) return;
		const tone = TONES[hash(label) % TONES.length];
		$head.prepend(`<span class="zn-tile" data-tone="${tone}" aria-hidden="true">${frappe.utils.icon(icon_for(label), "md")}</span>`);
	});
}

export function setup_tiles() {
	let observer = null;
	let pending = null;

	const attach = () => {
		const section = document.querySelector(SECTION);
		if (!section || section.__sgs_observed) return !!section;
		section.__sgs_observed = true;
		observer = new MutationObserver((mutations) => {
			const settings = frappe.sgs && frappe.sgs.settings;
			if (settings) {
				try {
					stagger_new_blocks(mutations, section, settings);
				} catch (e) {
					console.warn("[SGS UI] stagger skipped:", e);
				}
			}
			clearTimeout(pending);
			pending = setTimeout(() => decorate(section), 60);
		});
		observer.observe(section, { childList: true, subtree: true });
		decorate(section);
		return true;
	};

	const try_attach = (attempt = 0) => {
		if (!attach() && attempt < 60) setTimeout(() => try_attach(attempt + 1), 50);
	};

	$(document).on("page-change", () => try_attach());
	frappe.router.on("change", () => try_attach());
	try_attach();
}
