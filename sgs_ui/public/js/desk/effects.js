// Motion & Effects driven from SGS Settings (frappe.boot.sgs.motion).
// Every function re-reads the live settings object, so the settings form can
// preview changes without a reload. All motion uses the Web Animations API
// (opacity/transform only, no forced layout) and is skipped entirely when
// the master switch is off or the OS asks for reduced motion.

import { motion_on, speed_factor } from "./settings";

const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const SECTION = '.page-container[data-page-route="Workspaces"] .layout-main-section';

// ---------------- page transitions ----------------
const PAGE_FRAMES = {
	"Fade & Slide": [
		{ opacity: 0, transform: "translateY(6px)" },
		{ opacity: 1, transform: "none" },
	],
	Fade: [{ opacity: 0 }, { opacity: 1 }],
	Zoom: [
		{ opacity: 0, transform: "scale(0.985)" },
		{ opacity: 1, transform: "none" },
	],
};

export function setup_page_transitions(settings) {
	$(document).on("page-change", () => {
		if (!motion_on(settings)) return;
		const frames = PAGE_FRAMES[settings.motion.page_transition];
		const page = frappe.container && frappe.container.page;
		if (!frames || !page || typeof page.animate !== "function") return;
		page.animate(frames, { duration: 200 * speed_factor(settings), easing: EASE });
	});
}

// ---------------- workspace stagger ----------------
// Called synchronously from the workspace MutationObserver (tiles.js).
// Observer callbacks run before the browser paints, so a freshly inserted
// card starts its fade-in before it is ever drawn: no pre-hiding, no timers,
// and it works however long the workspace data takes to arrive.
let batch_index = 0;
let last_batch = 0;

export function stagger_new_blocks(mutations, section, settings) {
	if (!motion_on(settings, "stagger") || section.classList.contains("edit-mode")) return;
	const now = performance.now();
	if (now - last_batch > 250) batch_index = 0;
	const factor = speed_factor(settings);

	for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
			if (node.nodeType !== 1) continue;
			const blocks = node.classList.contains("ce-block") ? [node] : node.querySelectorAll(".ce-block");
			for (const block of blocks) {
				if (block.classList.contains("zn-in")) continue;
				block.classList.add("zn-in");
				if (!block.querySelector(".widget:not(.spacer), .ce-header")) continue;
				block.animate(
					[
						{ opacity: 0, transform: "translateY(10px)" },
						{ opacity: 1, transform: "none" },
					],
					{
						duration: 320 * factor,
						delay: Math.min(batch_index, 14) * 35 * factor,
						easing: EASE,
						fill: "backwards",
					}
				);
				batch_index += 1;
				last_batch = now;
			}
		}
	}
}

// ---------------- KPI count-up ----------------
const NUMBER_RE = /^(\D*?)(-?\d[\d,]*(?:\.\d+)?)([\s\S]*)$/;

export function count_up_numbers(section, settings) {
	if (!motion_on(settings, "count_up")) return;
	section.querySelectorAll(".number-widget-box .widget-content .number").forEach((el) => {
		const text = el.textContent.trim();
		if (!text || el.__zn_counting || el.__zn_done === text) return;
		const match = text.match(NUMBER_RE);
		const target = match ? parseFloat(match[2].replace(/,/g, "")) : NaN;
		if (!match || !isFinite(target) || target === 0) {
			el.__zn_done = text;
			return;
		}
		const [, prefix, raw, suffix] = match;
		const decimals = (raw.split(".")[1] || "").length;
		const grouped = raw.includes(",");
		const format = (value) =>
			grouped && typeof format_number === "function"
				? format_number(value, null, decimals)
				: value.toFixed(decimals);

		const duration = 900 * speed_factor(settings);
		const start = performance.now();
		el.__zn_counting = true;
		el.__zn_last = null;
		const tick = (now) => {
			// Frappe refreshed the card mid-animation: stop and let it win
			if (el.__zn_last !== null && el.textContent !== el.__zn_last) {
				el.__zn_counting = false;
				return;
			}
			const progress = Math.min(1, (now - start) / duration);
			if (progress < 1) {
				const eased = 1 - Math.pow(1 - progress, 3);
				el.textContent = prefix + format(target * eased) + suffix;
				el.__zn_last = el.textContent;
				requestAnimationFrame(tick);
			} else {
				el.textContent = text;
				el.__zn_done = text;
				el.__zn_counting = false;
			}
		};
		requestAnimationFrame(tick);
	});
}

// ---------------- button ripple ----------------
export function setup_ripple(settings) {
	document.addEventListener(
		"pointerdown",
		(e) => {
			if (e.button !== 0 || !motion_on(settings, "ripple")) return;
			const btn = e.target.closest && e.target.closest(".btn");
			if (!btn || btn.disabled || btn.classList.contains("disabled")) return;
			const rect = btn.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height) * 2;
			const ink = document.createElement("span");
			ink.className = "zn-ripple-ink";
			ink.style.width = ink.style.height = `${size}px`;
			ink.style.left = `${e.clientX - rect.left - size / 2}px`;
			ink.style.top = `${e.clientY - rect.top - size / 2}px`;
			btn.classList.add("zn-ripple-host");
			btn.appendChild(ink);
			const done = () => {
				ink.remove();
				if (!btn.querySelector(".zn-ripple-ink")) btn.classList.remove("zn-ripple-host");
			};
			const animation = ink.animate(
				[
					{ transform: "scale(0)", opacity: 0.28 },
					{ transform: "scale(1)", opacity: 0 },
				],
				{ duration: 560 * speed_factor(settings), easing: EASE }
			);
			animation.onfinish = done;
			animation.oncancel = done;
		},
		{ passive: true }
	);
}
