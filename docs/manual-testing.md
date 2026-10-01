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
  buttons, optional font family, width, borders, corners, spacing, and shadows.
- Confirm default/reset styling never changes Schoology's root font size, rem-based navigation,
  control dimensions, icon boxes, header height, or native spacing geometry.
- Toggle each optional visibility control and confirm only the named nonessential region changes.
- Use every per-setting reset and reset-all; confirm Schoology returns immediately to its prior
  native presentation when customization is disabled.
- Confirm official submitted, late, missing, grade, and alert semantics remain visible and readable.
- Check active/inactive Recent Activity and Course Dashboard tabs on light and dark nested surfaces;
  normal text must reach 4.5:1 and large/control text 3:1.
- Insert or reveal asynchronous dashboard content and confirm contrast correction occurs without a
  full-document rewrite, observer loop, or loss of hover/focus/active states.
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

## Course, assignment, and planning workflows

- Favorite courses, set dashboard order, hide/show a card, add a quick link, then disable/reset and
  confirm Schoology's original inline display/order/border values return exactly.
- Open a detected materials row through **Plan in Today**, set priority and effort, reload, and
  confirm focus ordering persists locally.
- Verify submission-confidence copy distinguishes rendered Schoology status from unavailable state.
- On a supported assessment fixture/account, submit with unanswered radio, checkbox, text, and
  select controls; verify the warning prevents the first submit and **Submit anyway** is explicit.
- Confirm an unknown assessment question type receives no warning rather than an unreliable count.
- Create, compare, delete, reset, and undo total-points scenarios. Confirm weighted, dropped-grade,
  and extra-credit modes display unsupported explanations and native grade cells never change.
