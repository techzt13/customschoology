# Manual test checklist

Never place passwords, live API credentials, student names, grades, messages, or identifiers in
screenshots, fixtures, bug reports, or repository files.

## Inputs needed

- An anonymized screenshot and smallest relevant DOM fragment for the home/upcoming region.
- One Schoology-hosted deployment and one custom-domain deployment.
- Examples of unsubmitted, submitted, late, missing, no-due-date, and empty upcoming states.
- Narrow laptop and 200% browser zoom screenshots.
- Path/query shapes with tenant and identifiers replaced.

## Installation and permission

- Load `dist/` unpacked in current Chrome stable.
- Confirm `*.schoology.com` initializes without a permission prompt.
- On a custom Schoology domain, use the popup to grant only that domain.
- Revoke the domain in settings and confirm the content script no longer initializes after reload.
- Deny a domain request and confirm the popup reports the denial without changing settings.

## Today panel

- Confirm the launcher appears once and Schoology remains usable.
- Open and close by mouse and keyboard; Escape closes and focus returns to the launcher.
- Verify detected assignment titles, courses, due dates, and official states against the page.
- Mark an item complete and confirm the local state survives reload.
- Confirm local completion is never described as an official submission.
- Navigate between supported routes and confirm no duplicate launcher appears.
- Test missing target markup and confirm a non-disruptive empty state.

## Customization and data

- Test all presets in light/dark system modes, compact density, and a custom accent.
- Verify native header, page background, content surfaces, course cards, detected rails, links,
  buttons, typography, width, borders, corners, spacing, and shadows.
- Toggle each optional visibility control and confirm only the named nonessential region changes.
- Use every per-setting reset and reset-all; confirm Schoology returns immediately to its prior
  native presentation when customization is disabled.
- Confirm official submitted, late, missing, grade, and alert semantics remain visible and readable.
- Navigate to an unknown or institution-customized layout and confirm unsupported regions remain
  untouched.
- Verify keyboard focus and text contrast at 100% and 200% zoom.
- Export data, reset, import the export, and confirm settings return.
- Attempt to import malformed and unrelated JSON; confirm existing settings remain intact.
- Delete all data and confirm defaults are restored.

## Accessibility and performance

- Complete all interactions keyboard-only.
- Smoke test with VoiceOver on macOS and NVDA on Windows.
- Verify status changes are announced and icons are not the only source of meaning.
- Check reduced-motion mode.
- Profile a page with a long upcoming list and confirm no unbounded mutation loop or long task.
