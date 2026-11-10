// SGS UI: login page brand panel.
// Runs on every website page (web_include_js) but does nothing unless the
// server injected window.sgs_login, which only happens on /login when the
// SGS login page is enabled.

(function () {
	const data = window.sgs_login;
	if (!data || document.body.getAttribute("data-path") !== "login") return;

	const t = (text, args) => (typeof window.__ === "function" ? window.__(text, args) : text);
	const esc = (value) =>
		String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

	const brand = data.brand_name || "ERPNext";
	const check =
		'<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';

	function build_panel() {
		if (document.querySelector(".zn-login-brand")) return;

		const logo = data.logo
			? `<img src="${esc(data.logo)}" alt="">`
			: `<span class="zn-login-mono">${esc(brand.charAt(0).toUpperCase())}</span>`;
		const features = (data.features || [])
			.slice(0, 4)
			.map((f) => `<li>${check}<span>${esc(f)}</span></li>`)
			.join("");

		const panel = document.createElement("aside");
		panel.className = "zn-login-brand" + (data.background ? " has-image" : "");
		panel.setAttribute("aria-label", brand);
		if (data.background) {
			panel.style.backgroundImage = `url("${encodeURI(data.background)}")`;
		}
		panel.innerHTML = `
			<span class="zn-login-orb o1"></span>
			<span class="zn-login-orb o2"></span>
			<div class="zn-login-logo">${logo}<span>${esc(brand)}</span></div>
			<div class="zn-login-copy">
				<div class="zn-login-badge"><i></i>${esc(t("Welcome to {0}", [brand]))}</div>
				<h1 class="zn-login-headline">${esc(data.headline || "")}</h1>
				${data.subheadline ? `<p class="zn-login-sub">${esc(data.subheadline)}</p>` : ""}
				${features ? `<ul class="zn-login-features">${features}</ul>` : ""}
			</div>
			<div class="zn-login-foot">© ${new Date().getFullYear()} ${esc(brand)}</div>`;
		document.body.insertBefore(panel, document.body.firstChild);
	}

	function polish_card() {
		const head = document.querySelector("section.for-login .page-card-head");
		if (head && !head.querySelector(".zn-login-hello")) {
			const h4 = head.querySelector("h4");
			if (h4) h4.textContent = t("Welcome back");
			const hello = document.createElement("div");
			hello.className = "zn-login-hello";
			hello.textContent = t("Sign in to continue to {0}", [brand]);
			head.appendChild(hello);
		}
	}

	function mark_field_icons() {
		document.querySelectorAll(".email-field, .password-field").forEach((field) => {
			field.classList.toggle("zn-has-icon", !!field.querySelector(".field-icon"));
		});
	}

	function run() {
		build_panel();
		polish_card();
		mark_field_icons();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", run);
	} else {
		run();
	}
})();
