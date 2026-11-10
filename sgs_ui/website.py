import json

import frappe

from sgs_ui.theme import get_login_payload


def update_website_context(context):
	"""Inject login-page branding into <head> so it applies before first paint.

	Only the login page is touched, and only by appending to `head_html`, so
	Website Settings' own head_html still renders, and returns as it was once
	this app is uninstalled.
	"""
	if _current_path() != "login":
		return

	try:
		payload = get_login_payload()
	except Exception:
		frappe.log_error(title="SGS UI: failed to build login context")
		return

	if not payload:
		return

	# Safe inside <script>: no "</script>", "<!--" or entity tricks can survive.
	data = json.dumps(payload).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
	snippet = (
		'<style id="sgs-login-vars">'
		f":root{{--zn-primary:{payload['primary']};--zn-accent:{payload['accent']};}}"
		"</style>"
		f"<script>window.sgs_login={data};"
		"document.documentElement.classList.add('zn-login');</script>"
	)
	context.head_html = (context.get("head_html") or "") + snippet


def _current_path() -> str:
	path = getattr(frappe.local, "path", None)
	if not path and getattr(frappe.local, "request", None):
		path = frappe.local.request.path
	return (path or "").strip("/")
