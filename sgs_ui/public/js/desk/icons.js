// Small inline icons for things Frappe's sprites don't include (sun) or where
// a stable stroke icon matters. 24px grid, 1.75 stroke, currentColor.

const svg = (body) =>
	`<svg class="zn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
	sun: svg(
		'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
	),
	moon: svg('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>'),
	search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
	calendar: svg('<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
	building: svg(
		'<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21"/><path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5V21M2.5 21h19M8 8h2M8 12h2M8 16h2"/>'
	),
	sparkle: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>'),
	enter: svg('<path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>'),
	arrows: svg('<path d="M8 9l4-4 4 4M16 15l-4 4-4-4"/>'),
	menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
	chevrons_left: svg('<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>'),
	chevrons_right: svg('<path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>'),
};
