// Copyright (c) 2026, TechAccuracy and contributors
// For license information, please see license.txt

// Live preview: every appearance change re-themes this browser tab instantly,
// before saving. Saved values reach other users on their next page load.

const PREVIEW_FIELDS = [
	"enabled",
	"preset",
	"primary_color",
	"accent_color",
	"sidebar_style",
	"navbar_style",
	"show_workspace_hero",
	"brand_name",
	"show_brand_name",
	// Motion & Effects
	"enable_animations",
	"animation_speed",
	"enable_page_transitions",
	"page_transition_style",
	"dialog_animation",
	"stagger_workspace",
	"count_up_numbers",
	"smooth_theme_switch",
	"button_ripple",
	"card_hover",
	"button_hover",
	"list_row_accent",
	"sidebar_hover_motion",
	"animated_hero",
];

frappe.ui.form.on("SGS Settings", {
	refresh(frm) {
		render_swatches(frm);
		render_playground(frm);
		frm.set_intro(
			__("Changes preview instantly in this tab. Save to apply them for every user."),
			"blue"
		);
	},

	preset(frm) {
		const preset = presets()[frm.doc.preset];
		if (preset) {
			// keep the color fields in sync so "Custom" starts from the last preset
			frm.doc.primary_color = preset.primary;
			frm.doc.accent_color = preset.accent;
			frm.refresh_field("primary_color");
			frm.refresh_field("accent_color");
		}
		preview(frm);
	},

	after_save(frm) {
		frappe.xcall("sgs_ui.api.get_theme").then((theme) => {
			frappe.boot.sgs = theme;
			frappe.sgs && frappe.sgs.preview && frappe.sgs.preview(theme);
			render_swatches(frm);
			frappe.show_alert({
				message: __("Theme saved. Other users see it on their next page load."),
				indicator: "green",
			});
		});
	},
});

PREVIEW_FIELDS.filter((f) => f !== "preset").forEach((fieldname) => {
	frappe.ui.form.on("SGS Settings", fieldname, (frm) => preview(frm));
});

function presets() {
	return (frappe.sgs && frappe.sgs.settings && frappe.sgs.settings.presets) || {};
}

function resolved_colors(frm) {
	const preset = presets()[frm.doc.preset];
	return preset
		? { primary: preset.primary, accent: preset.accent }
		: { primary: frm.doc.primary_color, accent: frm.doc.accent_color };
}

function preview(frm) {
	render_swatches(frm);
	if (!frappe.sgs || !frappe.sgs.preview) return;
	const colors = resolved_colors(frm);
	frappe.sgs.preview({
		enabled: frm.doc.enabled,
		primary: colors.primary,
		accent: colors.accent,
		navbar_style: frm.doc.navbar_style,
		brand_name: frm.doc.brand_name || frappe.sgs.settings.brand_name,
		show_brand_name: frm.doc.show_brand_name,
		sidebar: { style: frm.doc.sidebar_style },
		hero: { enabled: frm.doc.show_workspace_hero },
		motion: motion_from(frm.doc),
	});
}

function motion_from(doc) {
	return {
		enabled: doc.enable_animations,
		speed: doc.animation_speed,
		page_transition: doc.enable_page_transitions ? doc.page_transition_style : "None",
		dialog: doc.dialog_animation,
		stagger: doc.stagger_workspace,
		count_up: doc.count_up_numbers,
		smooth_theme: doc.smooth_theme_switch,
		ripple: doc.button_ripple,
		card_hover: doc.card_hover,
		button_hover: doc.button_hover,
		row_accent: doc.list_row_accent,
		sidebar_motion: doc.sidebar_hover_motion,
		animated_hero: doc.animated_hero,
	};
}

// A tiny sandbox that uses the same classes as the real UI, so every hover,
// ripple and dialog setting can be tried here before saving.
function render_playground(frm) {
	const field = frm.fields_dict.motion_playground;
	if (!field) return;
	const esc = frappe.utils.escape_html;
	field.$wrapper.html(`
		<div class="zn-playground" style="display:grid;gap:16px;padding:4px 0 8px;">
			<div>
				<div>
					<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
						${["Customer", "Sales Invoice", "Stock Ledger"]
							.map(
								(label, i) => `
							<div class="widget shortcut-widget-box" tabindex="0" style="cursor:pointer;">
								<div class="widget-head" style="display:flex;align-items:center;gap:12px;">
									<span class="zn-tile" data-tone="${["indigo", "emerald", "amber"][i]}">${frappe.utils.icon(
										["es-line-customer", "es-line-notes", "es-line-reports"][i],
										"md"
									)}</span>
									<div class="widget-label"><div class="widget-title">${esc(__(label))}</div></div>
								</div>
							</div>`
							)
							.join("")}
					</div>
				</div>
			</div>
			<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
				<button type="button" class="btn btn-primary btn-sm">${__("Primary button")}</button>
				<button type="button" class="btn btn-default btn-sm">${__("Secondary")}</button>
				<button type="button" class="btn btn-default btn-sm zn-try-dialog">${__("Open a dialog")}</button>
			</div>
			<div class="frappe-list" style="border:1px solid var(--border-color);border-radius:12px;overflow:hidden;">
				${["ACC-SINV-0001 · Walk-In", "ACC-SINV-0002 · Fresh Mart", "ACC-SINV-0003 · Hassan Akhtar"]
					.map(
						(row) => `
					<div class="list-row-container"><div class="list-row level" style="padding:10px 16px;">${esc(
						row
					)}</div></div>`
					)
					.join("")}
			</div>
		</div>`);
	field.$wrapper.find(".zn-try-dialog").on("click", () => {
		const d = new frappe.ui.Dialog({
			title: __("Dialog animation"),
			fields: [{ fieldtype: "HTML", options: `<p>${__("This is how dialogs open with the current setting.")}</p>` }],
			primary_action_label: __("Close"),
			primary_action: () => d.hide(),
		});
		d.show();
	});
}

function render_swatches(frm) {
	const field = frm.fields_dict.palette_preview;
	if (!field) return;
	const { primary, accent } = resolved_colors(frm);
	const esc = frappe.utils.escape_html;
	const swatch = (label, color) => `
		<div style="display:flex;align-items:center;gap:10px;">
			<span style="width:36px;height:36px;border-radius:10px;background:${esc(color || "")};
				box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);"></span>
			<div><div style="font-weight:600;">${esc(label)}</div>
			<div class="text-muted" style="font-size:12px;">${esc(color || "")}</div></div>
		</div>`;
	field.$wrapper.html(`
		<div style="display:grid;gap:14px;padding:4px 0 8px;">
			<div style="display:flex;gap:24px;flex-wrap:wrap;">
				${swatch(__("Primary"), primary)}
				${swatch(__("Accent"), accent)}
			</div>
			<div style="height:44px;border-radius:12px;background:linear-gradient(135deg, ${esc(primary || "")}, ${esc(accent || "")});"></div>
			<div style="display:flex;gap:8px;flex-wrap:wrap;">
				<button type="button" class="btn btn-primary btn-sm">${__("Primary button")}</button>
				<button type="button" class="btn btn-default btn-sm">${__("Secondary")}</button>
				<span class="indicator-pill blue">${__("Status pill")}</span>
			</div>
		</div>`);
}
