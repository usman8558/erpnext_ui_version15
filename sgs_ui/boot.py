import frappe

from sgs_ui.theme import get_desk_payload


def extend_bootinfo(bootinfo):
	"""Ship theme settings with the Desk boot payload (no extra request on load)."""
	try:
		bootinfo.sgs = get_desk_payload()
	except Exception:
		# Never let theming break Desk boot; the client falls back to defaults.
		frappe.log_error(title="SGS UI: failed to build boot payload")
		bootinfo.sgs = {"enabled": 1}
