import frappe

from sgs_ui.theme import get_desk_payload


@frappe.whitelist()
def get_theme():
	"""Current resolved theme, used to apply saved settings without a reload."""
	return get_desk_payload()
