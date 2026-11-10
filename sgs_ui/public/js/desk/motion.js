// Loading bar for server calls and route changes, and page enter transitions.

export function setup_progress() {
	const bar = document.createElement("div");
	bar.className = "zn-progress";
	bar.setAttribute("aria-hidden", "true");
	document.body.appendChild(bar);

	let pending = 0;
	let value = 0;
	let trickle = null;
	let show_timer = null;
	let reset_timer = null;

	const paint = () => (bar.style.transform = `scaleX(${value})`);

	const start = () => {
		pending += 1;
		if (pending > 1) return;
		clearTimeout(reset_timer);
		// fast calls finish before the bar ever shows: no flicker
		show_timer = setTimeout(() => {
			bar.classList.remove("is-done");
			bar.classList.add("is-active");
			value = 0.08;
			paint();
			trickle = setInterval(() => {
				value = Math.min(0.92, value + (0.92 - value) * 0.1);
				paint();
			}, 250);
		}, 140);
	};

	const done = () => {
		pending = Math.max(0, pending - 1);
		if (pending > 0) return;
		clearTimeout(show_timer);
		clearInterval(trickle);
		if (!bar.classList.contains("is-active")) return;
		value = 1;
		paint();
		bar.classList.add("is-done");
		reset_timer = setTimeout(() => {
			bar.classList.remove("is-active", "is-done");
			value = 0;
			paint();
		}, 600);
	};

	$(document).on("ajaxSend", start);
	$(document).on("ajaxComplete", done);

	frappe.sgs.progress = { start, done };
}

// Page transitions live in effects.js (styles + speed from SGS Settings).
