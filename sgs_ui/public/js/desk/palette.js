// Command palette: a spotlight panel that runs Frappe's own AwesomeBar engine,
// so every native search feature (go to, new, search in list, reports,
// calculator, global search) keeps working, just in a bigger, calmer UI.

import { escape } from "./settings";
import { ICONS } from "./icons";

function relabel_workspace(option) {
	const route = option && option.route;
	if (!Array.isArray(route) || route[0] !== "Workspaces") return option;
	const name = route[1] === "private" ? route[2] : route[1];
	if (!name) return option;
	const label = __("{0} workspace", [__(name)]);
	// awesomplete looks rows up by `value`, so it must stay unique too
	return { ...option, label, value: label };
}

export default class SGSPalette {
	constructor(settings) {
		this.settings = settings;
		this.render();
		this.setup_engine();
		this.bind();
	}

	render() {
		const mac = frappe.utils.is_mac();
		const brand = this.settings.brand_name || "ERPNext";
		this.$el = $(`
			<div class="zn-palette" role="dialog" aria-modal="true" aria-label="${escape(__("Command palette"))}">
				<div class="zn-palette-panel">
					<div class="zn-palette-input-wrap">
						${ICONS.search}
						<input type="text" class="zn-palette-input" autocomplete="off" spellcheck="false"
							placeholder="${escape(__("Search documents, reports, pages, or type a command…"))}">
						<span class="zn-kbd">Esc</span>
					</div>
					<div class="zn-palette-empty">
						${escape(__("Start typing to search everything you have access to."))}
						<div class="zn-palette-tips">
							<div class="zn-palette-tip"><b>${escape(__("Open a list"))}</b>${escape(__("sales invoice"))}</div>
							<div class="zn-palette-tip"><b>${escape(__("Create a record"))}</b>${escape(__("new customer"))}</div>
							<div class="zn-palette-tip"><b>${escape(__("Search inside"))}</b>${escape(__("walk-in customer"))}</div>
							<div class="zn-palette-tip"><b>${escape(__("Calculate"))}</b>(1200 * 1.17) / 3</div>
						</div>
					</div>
					<div class="zn-palette-foot">
						<span>${ICONS.arrows} ${escape(__("Navigate"))}</span>
						<span>${ICONS.enter} ${escape(__("Open"))}</span>
						<span><span class="zn-kbd">${mac ? "⌘" : "Ctrl"}</span>+<span class="zn-kbd">K</span> ${escape(__("Toggle"))}</span>
						<span class="zn-palette-brand">${escape(brand)}</span>
					</div>
				</div>
			</div>`).appendTo("body");
		this.$input = this.$el.find(".zn-palette-input");
	}

	setup_engine() {
		this.engine = new frappe.search.AwesomeBar();

		// Recent workspace visits all come back labelled "Workspaces". Name them
		// after the workspace and drop rows whose text would be identical.
		// (Only this palette instance is wrapped; Frappe's own bar is untouched.)
		const deduplicate = this.engine.deduplicate.bind(this.engine);
		this.engine.deduplicate = (options) => {
			const seen = new Set();
			return deduplicate(options)
				.map(relabel_workspace)
				.filter((option) => {
					const key = String(option.label || option.value || "").toLowerCase();
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
		};

		this.engine.setup(this.$input.get(0));
	}

	bind() {
		// close after the AwesomeBar has handled the selection (its handler is bound first)
		this.$input.on("awesomplete-select", () => setTimeout(() => this.close(), 0));
		// empty-state tips only while there are no results (class, not :has())
		this.$input.on("awesomplete-open", () => this.$el.addClass("has-results"));
		this.$input.on("awesomplete-close", () => this.$el.removeClass("has-results"));
		this.$input.on("keydown", (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				this.close();
			}
		});

		this.$el.on("mousedown", (e) => {
			if (e.target === this.$el.get(0)) this.close();
		});

		frappe.router.on("change", () => this.close());

		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+k",
			action: (e) => {
				e.preventDefault();
				this.is_open() ? this.close() : this.open();
				return false;
			},
			description: __("Open command palette"),
			ignore_inputs: true,
			// leave Ctrl/Cmd+K to rich-text and code editors (insert link etc.)
			condition: () => !$(document.activeElement).closest(".ql-editor, .ace_editor, .CodeMirror, .cm-editor").length,
		});

		// the navbar search (and Frappe's own Ctrl+G) open the palette instead
		$(document).on("focus", "#navbar-search", (e) => {
			e.target.blur();
			this.open();
		});
	}

	is_open() {
		return this.$el.hasClass("is-open");
	}

	open() {
		if (this.is_open()) return;
		this.last_focus = document.activeElement;
		this.$el.addClass("is-open");
		this.$input.val("");
		// focus triggers the AwesomeBar's "recent pages" list
		setTimeout(() => this.$input.trigger("focus"), 10);
	}

	close() {
		if (!this.is_open()) return;
		this.$el.removeClass("is-open");
		this.$input.val("").trigger("blur");
		const last = this.last_focus;
		if (last && last.id !== "navbar-search" && document.body.contains(last)) {
			try {
				last.focus({ preventScroll: true });
			} catch (e) {
				// element can no longer take focus
			}
		}
	}
}
