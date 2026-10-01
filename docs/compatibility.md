# Compatibility matrix

| Surface                                             | Current status             | Evidence                                               |
| --------------------------------------------------- | -------------------------- | ------------------------------------------------------ |
| Schoology-hosted home/upcoming page                 | Needs real-site validation | Adapter fixture and unit tests                         |
| Custom-domain home/upcoming page                    | Needs real-site validation | Progressive permission and dynamic script registration |
| Institution header and icon controls                | Experimental               | Semantic discovery and full-shell fixture              |
| Dashboard tabs, canvas, grid, and course cards      | Experimental               | Semantic discovery and Chromium workflow test          |
| Left rail and right To Do/upcoming rail             | Experimental               | Structural/label discovery and full-shell fixture      |
| Content surfaces, controls, modals, popovers        | Experimental               | Role/data/structural discovery tests                   |
| Footer and responsive states                        | Experimental               | Annotated CSS and browser test artifact                |
| Course pages                                        | Needs real-site validation | URL contract tests                                     |
| Materials pages                                     | Needs real-site validation | URL contract tests                                     |
| Grade pages                                         | Needs real-site validation | URL contract tests                                     |
| Course dashboard cards                              | Experimental               | Reversible workspace fixture tests                     |
| Materials rows                                      | Experimental               | Known-layout adapter tests                             |
| Assessments                                         | Experimental               | Fail-closed supported-control tests                    |
| Grade scenario studio                               | Available                  | Manual total-points calculations                       |
| Automatic grade import/weighted rule interpretation | Unsupported                | Awaiting verified rules and sanitized fixtures         |
| Firefox                                             | Unsupported                | Deferred until Chrome behavior stabilizes              |

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

The grade studio deliberately does not read or edit native grade cells. Total-points scenarios are
supported from user-entered values; weighted categories, dropped grades, extra credit, and automatic
gradebook import remain explicitly unsupported until representative rules and sanitized fixtures are
available.

Automatic mode checks semantic links, tabs, headings, labels, and controls against their effective
rendered background, including transparent ancestors. It may choose only semantic theme colors or
black/white fallbacks and records no computed values. Preserve and Manual modes retain requested
colors and report failures in settings; High Contrast applies a complete fixed palette. All runtime
and region annotations are removed when customization is disabled.
