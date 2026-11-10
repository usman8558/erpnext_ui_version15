"""Compatibility shim for `custom_theme.api.get_open_job_openings`.

The demo site's published `job-application` web form calls that method by its
dotted path. SGS UI replaces custom_theme on the demo site, so hooks.py
routes the old path here via `override_whitelisted_methods`. The logic is
kept identical to the original.

If SGS UI is uninstalled, reinstall custom_theme to restore the original
endpoint.
"""

import frappe


@frappe.whitelist(allow_guest=True)
def get_open_job_openings(txt=None, **kwargs):
	"""Open Job Openings for the job-application web form dropdown.

	Guest-callable by design: the web form allows anonymous submissions.
	Exposure is limited to openings that are already public, so the filters
	are hardcoded and never caller-supplied.
	"""
	if not frappe.db.exists("DocType", "Job Opening"):
		return []

	filters = {"status": "Open"}
	if txt:
		filters["job_title"] = ["like", f"%{txt}%"]

	openings = frappe.get_all(
		"Job Opening",
		filters=filters,
		fields=["name", "job_title"],
		order_by="posted_on desc",
		limit_page_length=100,
		ignore_permissions=True,
	)

	return [{"value": o.name, "label": o.job_title or o.name} for o in openings]
