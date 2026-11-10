// Tint selected list rows. Toggles .zn-checked on the row container when its
// checkbox changes (a CSS :has() for this made every style recalc scan the list).

function sync($list) {
	$list.find(".list-row-container").each((_, row) => {
		const box = row.querySelector(".list-row-checkbox");
		row.classList.toggle("zn-checked", !!(box && box.checked));
	});
}

export function setup_list_selection() {
	$(document).on("change", ".list-row-checkbox, .list-check-all", (e) => {
		// "select all" sets the row checkboxes programmatically (no change events),
		// so re-read every row of that list after Frappe has done its work
		const $list = $(e.target).closest(".frappe-list");
		setTimeout(() => sync($list.length ? $list : $(document)), 0);
	});
}
