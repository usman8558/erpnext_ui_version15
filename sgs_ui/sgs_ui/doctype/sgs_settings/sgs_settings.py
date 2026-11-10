# Copyright (c) 2026, TechAccuracy and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from sgs_ui.theme import PRESETS, is_hex_color


class SGSSettings(Document):
	def validate(self):
		if self.preset == "Custom":
			for field in ("primary_color", "accent_color"):
				if not is_hex_color(self.get(field)):
					label = self.meta.get_label(field)
					frappe.throw(_("{0} must be a hex color such as #4F46E5").format(label))
		elif self.preset in PRESETS:
			# Keep the color fields in sync so switching to Custom starts from the preset.
			self.primary_color = PRESETS[self.preset]["primary"]
			self.accent_color = PRESETS[self.preset]["accent"]

	def on_update(self):
		# The Desk boot payload is cached per user in the "bootinfo" hash;
		# drop it so every user picks up the new theme on their next load.
		frappe.cache.delete_key("bootinfo")
