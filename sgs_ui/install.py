import frappe

from sgs_ui.theme import DEFAULTS, SETTINGS_DOCTYPE


def after_install():
	"""Save default settings so the settings form opens fully populated."""
	fill_missing_defaults()
	frappe.clear_cache()


def fill_missing_defaults():
	"""Write DEFAULTS into any SGS Settings field that has never been saved.

	Used on install and by the patch that ships new fields, so the form always
	shows the values the theme is actually using. Saved values are never touched.
	"""
	# Read the raw stored record: a loaded Document reports never-saved Check
	# fields as 0, which is indistinguishable from "switched off".
	stored = frappe.db.get_singles_dict(SETTINGS_DOCTYPE)
	meta = frappe.get_meta(SETTINGS_DOCTYPE)
	missing = {
		field: value
		for field, value in DEFAULTS.items()
		if value not in (None, "") and meta.has_field(field) and stored.get(field) in (None, "")
	}
	if not missing:
		return False

	doc = frappe.get_single(SETTINGS_DOCTYPE)
	doc.update(missing)
	doc.flags.ignore_permissions = True
	doc.save()
	return True


def after_uninstall():
	"""Hooks are already gone; drop cached boot/hooks so the stock UI returns."""
	frappe.clear_cache()
