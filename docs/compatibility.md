# Compatibility matrix

Compatibility research is pinned to
[aopell/SchoologyPlus@85e2e869](https://github.com/aopell/SchoologyPlus/commit/85e2e869678570179fba6ba554d5ca0b469ff3ec).
The upstream project is MIT licensed; attribution and the full notice are in
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). The comparison is a coverage reference, not a
claim that synthetic tests establish real-site parity. Exact copied/adapted fragments are recorded
in the [upstream source map](upstream-source-map.md).

## SchoologyPlus reference coverage

| Referenced upstream module/capability                                                             | Our status                                         | Implementation path                                                                                   | Why this implementation differs                                                                               |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `content.ts` home route dispatch                                                                  | Available                                          | Typed `/`, `/home`, `/home/recent-activity`, and `/home/course-dashboard` matcher                     | Shared by discovery and independent feature gates; no upstream loader or analytics                            |
| `content.ts` course/materials/grades routes                                                       | Route coverage available; DOM support experimental | Typed course, materials, material, grades, page, user, and plural courses patterns                    | A matched URL does not claim DOM compatibility; each adapter still detects support independently              |
| `content.ts` assessment route                                                                     | Experimental                                       | Exact route matcher plus fail-closed supported-control inspection                                     | Warns only when unanswered detection is reliable                                                              |
| `styles/all.scss` native header controls and menus                                                | Experimental                                       | Pinned direct compatibility paint for proven hashed/header selectors                                  | Pairs foreground and background while preserving native geometry, logos, and multicolor icons                 |
| `pages/all.ts` header SVG color normalization                                                     | Experimental                                       | Header-bounded `#333` to `currentColor` conversion with exact disable restoration                     | No broad SVG rewriting; brand and nonmatching fills remain native                                             |
| `modern/all.scss` home shell and right rail                                                       | Experimental                                       | Direct paint plus limited overflow/min-width safeguards for proven home routes                        | Never constrains the whole shell; unsafe structural styling rolls back independently                          |
| `modern/all.scss` dashboard/card selectors                                                        | Experimental                                       | Direct `.course-dashboard`, `.sgy-card`, and `.sgy-card-lens` compatibility plus semantic annotations | Original presets and workspace preferences remain reversible; imagery/statuses remain native                  |
| `home.ts` home selector knowledge                                                                 | Experimental                                       | Versioned home-shell, tabs, feed, center, dashboard, and right-rail regions                           | Adds diagnostics, contrast, and extension-owned annotations rather than upstream DOM rewrites                 |
| `course.ts`, `courses.ts`, `materials.ts`, `material.ts`, `grades.ts`, `assessment.ts`, `page.ts` | Evaluated; feature code not copied                 | Original local-only adapters and workflows                                                            | Unrelated upstream product code was outside the verified shell regressions and remains gated pending real DOM |
| Theme/default-theme utilities                                                                     | Original implementation available                  | Independent 16-token model, 20 immutable snapshots, and build-time state contrast matrices            | No remote themes/fonts/assets or silent invalid-preset correction                                             |
| Grade modification                                                                                | Experimental alternative                           | Separate read-only, user-entered total-points scenario studio                                         | Never edits displayed official grades; weighted/dropped rules remain unsupported                              |
| API-key tools                                                                                     | Unsupported                                        | Not implemented                                                                                       | Avoids credential storage until a separately reviewed need exists                                             |
| Analytics                                                                                         | Unsupported by design                              | Not implemented                                                                                       | No telemetry or tracking                                                                                      |

Selector and route knowledge adapted from the pinned revision is centralized in
`src/schoology/compatibility/schoology-plus-shell.ts`, `src/schoology/routes.ts`, and
`src/schoology/customization/selectors.ts` under selector contract version 4.

| Surface                                             | Current status             | Evidence                                                          |
| --------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| Schoology-hosted home/upcoming page                 | Needs real-site validation | Adapter fixture and unit tests                                    |
| Custom-domain home/upcoming page                    | Needs real-site validation | Progressive permission and dynamic script registration            |
| Institution header and icon controls                | Experimental               | Pinned direct selectors, semantic discovery, and Chromium fixture |
| Dashboard tabs, canvas, grid, and course cards      | Experimental               | Semantic discovery and Chromium workflow test                     |
| Left rail and right To Do/upcoming rail             | Experimental               | Structural/label discovery and full-shell fixture                 |
| Content surfaces, controls, modals, popovers        | Experimental               | Role/data/structural discovery tests                              |
| Footer and responsive states                        | Experimental               | Annotated CSS and browser test artifact                           |
| Course pages                                        | Needs real-site validation | URL contract tests                                                |
| Materials pages                                     | Needs real-site validation | URL contract tests                                                |
| Grade pages                                         | Needs real-site validation | URL contract tests                                                |
| Course dashboard cards                              | Experimental               | Reversible workspace fixture tests                                |
| Materials rows                                      | Experimental               | Known-layout adapter tests                                        |
| Assessments                                         | Experimental               | Fail-closed supported-control tests                               |
| Grade scenario studio                               | Available                  | Manual total-points calculations                                  |
| Automatic grade import/weighted rule interpretation | Unsupported                | Awaiting verified rules and sanitized fixtures                    |
| Firefox                                             | Unsupported                | Deferred until Chrome behavior stabilizes                         |

Experimental implementation is not a claim of production compatibility. Real adapter acceptance
requires anonymized DOM fragments and manual validation from at least one Schoology-hosted and one
custom-domain deployment.

All 20 bundled visual presets pass the repository's complete semantic contrast matrix without
runtime substitution. This validates the preset definitions and synthetic states, not the
institution-specific computed backgrounds or browser behavior that still require real-site testing.

Native customization discovers each semantic shell region independently using roles, labels, link
destinations, data attributes, and bounded structural relationships. It annotates recognized
elements with extension-owned attributes, and generated CSS targets only those annotations. Unknown
regions retain Schoology's original background and foreground together. Logos, course images,
authored course content, iframes, and official grade/submission/status semantics are preserved, but
institution-specific status markup still requires manual verification.

On recognized home routes, the adapter distinguishes the whole shell, center column, center header,
content wrapper, dashboard/feed, outer right rail, and inner right-rail sections. It never applies a
width or max-width to `body`, generic `main`, `#main`, `#main-content`, the home-shell parent, or a
parent containing the right rail. Focused/wide reading widths apply only to a verified inner content
wrapper and are skipped for a course dashboard.

The pinned direct compatibility layer is route-gated and split into paint and layout output. Header
paint pairs each changed control or menu background with a readable foreground but sets no width,
height, padding, display, or positioning. On home routes it recognizes the proven shell, center,
dashboard, cards, and right rail while leaving overall shell sizing native.

Before structural rules are applied, the content script snapshots visible critical regions and
native header controls. After layout, it checks that those regions remain rendered, onscreen, large
enough, non-overlapping, and reasonably adjacent. A failure removes only the layout stylesheet,
retains semantic color rules and contrast correction, and records a visible compatibility warning.
This is a bounded safety net, not a substitute for real-browser validation.

Legacy schema-v5 native-region and dashboard-card visibility flags have no current-version
provenance and migrate to visible defaults. Current explicit visibility actions carry versioned
provenance. Applying any visual preset restores left rail, right/To Do rail, and footer visibility;
the recovery action also restores explicitly hidden dashboard cards.

The grade studio deliberately does not read or edit native grade cells. Total-points scenarios are
supported from user-entered values; weighted categories, dropped grades, extra credit, and automatic
gradebook import remain explicitly unsupported until representative rules and sanitized fixtures are
available.

Automatic mode checks semantic links, tabs, headings, labels, and controls against their effective
rendered background, including transparent ancestors. It may choose only semantic theme colors or
black/white fallbacks and records no computed values. Preserve and Manual modes retain requested
colors and report failures in settings; High Contrast applies a complete fixed palette. All runtime
and region annotations are removed when customization is disabled.
