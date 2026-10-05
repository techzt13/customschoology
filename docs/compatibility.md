# Compatibility matrix

Compatibility research is pinned to
[aopell/SchoologyPlus@85e2e869](https://github.com/aopell/SchoologyPlus/commit/85e2e869678570179fba6ba554d5ca0b469ff3ec).
The upstream project is MIT licensed; attribution and the full notice are in
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Exact copied/adapted fragments are recorded in
the [upstream source map](upstream-source-map.md).

`Available` below means the route or component has repository fixture, unit, accessibility, reset,
and unpacked-Chromium coverage. It does **not** mean every institution-specific live DOM has passed
manual sign-off.

## SchoologyPlus reference coverage

| Referenced upstream module/capability                                                          | Our status                            | Implementation path                                                                                              | Why this implementation differs                                                                |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `content.ts` route dispatch                                                                    | Available                             | Typed home, course, materials, material, assignment, page, grades, and assessment matcher                        | Shared by independent feature gates; no upstream loader or analytics                           |
| `styles/all.scss` native header controls and menus                                             | Available; needs real-site validation | Pinned hashed/header selectors with paired state colors                                                          | Preserves native geometry, logos, and multicolor paths                                         |
| `pages/all.ts` header SVG normalization                                                        | Available; needs real-site validation | Header-bounded `#333` to `currentColor` conversion with exact restoration                                        | No broad SVG rewriting                                                                         |
| `modern/all.scss` home shell, right rail, and dashboard cards                                  | Available; needs real-site validation | Split paint/layout adapters, center-plus-rail safety, card media/metadata surfaces                               | No whole-shell width constraint, hidden core UI, or image recoloring                           |
| `home.ts` selector knowledge                                                                   | Available; needs real-site validation | Versioned home-shell, tab, feed, dashboard, card, and rail regions                                               | Adds diagnostics, contrast, and reversible extension annotations                               |
| `modern/all.scss` course navigation/materials/grade surfaces                                   | Available; needs real-site validation | Route-scoped title, sidebar, navigation, main, materials, authored-content, grade-summary, and Upcoming surfaces | Uses original preset tokens and per-surface rollback rather than global author-style overrides |
| Selector knowledge from `course.ts`, `materials.ts`, `material.ts`, `page.ts`, and `grades.ts` | Available; needs real-site validation | Bounded adapters for verified Schoology structures                                                               | No upstream API fetch, grade editing, injected menus, downloads, or iframe mutation            |
| `courses.ts` course-directory behavior                                                         | Experimental                          | Route recognized; unknown DOM remains native                                                                     | Needs a sanitized real fixture and Chromium coverage                                           |
| `assessment.ts` feature implementation                                                         | Evaluated; not copied                 | Original fail-closed unanswered-item warning                                                                     | No wrapped-window patch or upstream modal behavior                                             |
| Theme/default-theme utilities                                                                  | Original implementation available     | Independent 16-token model and 20 immutable presets                                                              | No upstream themes, remote fonts/assets, or silent invalid-preset correction                   |
| Grade modification                                                                             | Unsupported; alternative available    | Separate read-only total-points scenario studio                                                                  | Never edits displayed official grades; unverified weighted/dropped rules remain unsupported    |
| API-key tools and analytics                                                                    | Unsupported by design                 | Not implemented                                                                                                  | Avoids credentials and telemetry                                                               |

## Route and component status

| Surface or route                               | Status                                        | Automated evidence                                                                                                  | Remaining live validation                                      |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Home, Recent Activity, Course Dashboard        | Available; needs real-site validation         | Full-shell fixture, right-rail geometry, light-image card, full/narrow/zoom-equivalent Chromium, axe, reset/disable | Hashed tenant variants, real 200% Chrome zoom, screen readers  |
| Dashboard card image/title/instructor metadata | Available; needs real-site validation         | Light-image regression fixture; 4.5:1 metadata scrim; title wrapping/containment; all-preset token matrix           | Additional live card markup variants and drag/reorder behavior |
| Course home                                    | Available; needs real-site validation         | Route fixture; complete shell, focus, contrast, full/narrow/zoom-equivalent visual, axe, restoration                | Institution-customized course shells                           |
| Materials list                                 | Available; needs real-site validation         | Toolbar, folder/material rows, long labels, CJK, LTI link wrapping, right rail, visual and axe checks               | Real folders, inline expansion, teacher controls               |
| Material detail                                | Available; needs real-site validation         | Safe authored light reading surface, inline-color correction, long URL wrapping, per-surface fallback               | Real attachments, embeds, LTI/iframe combinations              |
| Assignment detail                              | Available; needs real-site validation         | Route fixture, authored instructions, actions, focus, contrast, responsive visual, restoration                      | Submission widgets and institution plugins                     |
| Page detail                                    | Available; needs real-site validation         | Route fixture, CJK authored content, responsive visual, restoration                                                 | Rich authored tables/media/embeds                              |
| Grades overview and student gradebook          | Available; needs real-site validation         | Grade-summary/report surfaces, preserved official grade semantics, axe and restoration                              | Weighted/hierarchical tenant variants                          |
| Assessment                                     | Available shell; warning feature experimental | Route fixture, instructions, controls, keyboard/focus, contrast, responsive visual, restoration                     | Real assessment engines and unknown question types             |
| Course directory (`/courses`)                  | Experimental                                  | URL recognition only                                                                                                | Sanitized DOM fixture required                                 |
| User/profile and institution-specific routes   | Unsupported for route shell                   | Unknown content remains native                                                                                      | Route-specific evidence required                               |
| Firefox                                        | Unsupported                                   | None                                                                                                                | Chrome behavior must stabilize first                           |

## Safety contract

- Recognized regions receive extension-owned `data-sc-region` and `data-sc-theme-role` annotations.
  Unknown regions keep their native foreground and background together.
- Logos, course imagery, iframes, authored media, and official grade/submission/status semantics
  remain native. Course-card metadata never sits bare on an uncontrolled image; it receives a
  deterministic dark metadata surface/scrim with white text.
- Authored course content uses a coherent light reading surface. Bounded computed-contrast
  correction fixes only failing readable descendants, including inline author colors, while
  preserving passing author colors and excluding status/grade semantics and iframes.
- The course fallback snapshots the native authored surface before paint. If visible content becomes
  unreadable, overflows, collapses, or the main reading surface becomes unusable, only that authored
  surface returns to its native paired foreground/background and settings shows a compatibility
  warning.
- Paint and layout are separate stylesheets. Critical shell geometry is checked after layout; a
  failure removes only structural styling while retaining safe paint and contrast correction.
- Neither native CSS layer changes `html`/`:root` font size, constrains a generic home/course shell
  width, hides core UI, or adds analytics/network telemetry.

All 20 presets pass the complete semantic token/state contrast matrix without runtime substitution.
Representative light, dark, high-contrast, expressive, and productivity presets also have full and
narrow course-route Chromium artifacts. These checks do not replace real-account validation.
