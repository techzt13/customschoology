# Manual test checklist

Never place passwords, live API credentials, student names, grades, messages, or identifiers in
screenshots, fixtures, bug reports, or repository files.

## Inputs needed

- An anonymized screenshot and smallest relevant DOM fragment for the home/upcoming region.
- One Schoology-hosted deployment and one custom-domain deployment.
- Examples of unsubmitted, submitted, late, missing, no-due-date, and empty upcoming states.
- Narrow laptop and 200% browser zoom screenshots.
- A sanitized home-shell DOM fragment containing `#main-content-wrapper`, `#center`, `#center-top`,
  `#main-inner`, `#right-column`, and `#right-column-inner`, including the computed
  display/grid/flex styles on their direct parents.
- A sanitized course-shell DOM fragment containing `#sidebar-left`, `#left-nav` (or `#menu-s-main`),
  `#center-top .content-top-upper`, `.page-title`, `#main`, `#main-inner`, `.course-image`, and
  `#right-column`/`#right-column-inner`.
- A sanitized materials-list fragment with `#course-profile-materials`, `.materials-top`, folder and
  material rows; a material/page fragment with `.user-generated-content`/`.material-content` (or the
  institution's equivalent authored wrapper) including inline-styled teacher text.
- Sanitized grades fragments with `.gradebook-course`, `.summary-course`, and the student-gradebook
  table; an assessment fragment with its question form and submit control.
- A dashboard card fragment with a light or white course image so overlay instructor/context text
  contrast can be verified on real markup.
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

- Test all 20 full-shell presets and gallery filters in light/dark system modes. Exercise keyboard
  radio selection, preview without saving, cancel/revert, apply, and the Customized indicator.
- Compare representative clean-light, dark, high-contrast, expressive, and productivity presets at
  full width, narrow width, and 200% zoom.
- Verify the institution header/navigation and icon controls, secondary dashboard tabs, page canvas,
  dashboard grid, card/image/text areas, left gutter/rail, separate To Do/upcoming rail and inner
  sections, common content boxes, buttons/inputs/dropdowns, modal/popover surfaces, and footer.
- Exercise Automatic WCAG AA, Preserve with warnings, complete High Contrast, and Manual Advanced.
  Confirm every semantic color shows a requested/resolved value and ratio in settings, and automatic
  substitutions are visible in both the preview and diagnostic text.
- Check separate page, primary/elevated surface, header/text, primary/muted text, link, accent,
  border, control, focus, left/right rail, and active/inactive tab colors.
- Verify per-token reset, semantic-color section reset, layout/visibility section reset, and
  reset-all.
- Confirm default/reset styling never changes Schoology's root font size, rem-based navigation,
  control dimensions, icon boxes, header height, or native spacing geometry.
- On a deployment using current hashed Schoology header classes, verify Home, Courses, Groups,
  Search, Messages, and Profile remain visible. Open each native dropdown and confirm its trigger,
  hover/focus/expanded state, menu surface, labels, and icons use paired readable colors rather than
  white text on a retained white control. Confirm institution logos and multicolor icon paths are
  unchanged.
- Toggle each optional visibility control and confirm only the named nonessential region changes.
- Apply every preset after hiding a region and confirm the left rail, right/To Do rail, footer,
  dashboard cards, tabs, and native header controls all return. Confirm the active-hidden indicator
  clears.
- Use **Restore all Schoology sections** and confirm it restores all three optional regions without
  resetting colors or other layout choices.
- On `/`, `/home`, `/home/recent-activity`, and `/home/course-dashboard`, confirm the center column
  and separate To Do rail retain Schoology's native relationship. At a wide viewport the rail must
  remain rendered and onscreen, the center must remain usable, cards must stay within the center,
  and no content-width rule may create a large empty gap after the rail.
- At narrow width and actual 200% Chrome zoom, confirm the native responsive stacking/reflow remains
  usable and the right rail is still reachable. Repository Chromium coverage uses a half-width
  reflow equivalent; actual browser zoom remains a required manual check.
- If the **Compatibility and themed regions** panel reports a layout rollback, confirm colors remain
  active, every native region is visible and usable, and changing a layout preference safely retries
  structural styling.

## Course-route shell (course home, materials, material, assignment, page, grades, assessment)

- On `/course/<id>` and `/course/<id>/materials`, confirm the full shell is cohesive: institution
  header, course image, sidebar navigation with visible active/hover/focus states, title area,
  materials toolbar, rows, right Upcoming rail, and page canvas all use the selected preset, with no
  white outer void and no arbitrary shell width.
- On a dashboard card with a light or white course image, confirm instructor/context overlay text is
  readable (dark scrim, white text) and card titles wrap within their metadata surface instead of
  clipping.
- On material/page/assignment routes with teacher-authored content, confirm dark presets never
  render black native text on a dark themed parent: authored regions use the light reading surface,
  and failing inline author colors are corrected while passing author colors remain.
- Confirm CJK text, long URLs, numbered lists, folders, LTI links, and icons wrap without overflow
  at full width, narrow width, and actual 200% Chrome zoom.
- On grades overview and student gradebook, confirm official grade/status colors and meaning are
  preserved, and grade surfaces remain readable in every preset category.
- On a supported assessment, confirm native submit controls, radio/checkbox/text/select questions,
  and the unanswered-warning behavior still work; theme must not alter assessment logic.
- If the **Compatibility and themed regions** panel reports a course-surface rollback, confirm the
  affected authored surface returned to its native paired colors while the rest of the shell stays
  themed.
- Disable native customization and confirm the institution header, sidebar, authored content,
  materials, grades, and assessment all return exactly to Schoology's native presentation.
- Use every per-setting reset and reset-all; confirm Schoology returns immediately to its prior
  native presentation when customization is disabled, including restoration of original header SVG
  path fills.
- Confirm official submitted, late, missing, grade, and alert semantics remain visible and readable.
- Check active/inactive Recent Activity and Course Dashboard tabs on light and dark nested surfaces;
  normal text must reach 4.5:1 and large/control text 3:1.
- Insert or reveal asynchronous dashboard content and confirm region discovery/contrast correction
  occurs without a full-document rewrite, observer loop, or loss of
  hover/focus/active/selected/disabled states.
- Navigate to an unknown or institution-customized layout and confirm unsupported regions remain
  untouched with both their background and foreground native; no isolated purple/custom text should
  appear on an uncontrolled surface.
- Review **Compatibility and themed regions** and compare its detected, themed, native-preserved,
  unsupported, and layout-warning state against the visible page. Review the pinned SchoologyPlus
  capability matrix without treating Experimental entries as validated parity.
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
