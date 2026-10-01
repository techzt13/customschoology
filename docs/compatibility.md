# Compatibility matrix

| Surface                                        | Current status       | Evidence                                               |
| ---------------------------------------------- | -------------------- | ------------------------------------------------------ |
| Schoology-hosted home/upcoming page            | Synthetic support    | Adapter fixture and unit tests                         |
| Custom-domain home/upcoming page               | Architecture support | Progressive permission and dynamic script registration |
| Institution header and icon controls           | Synthetic support    | Semantic discovery and full-shell fixture              |
| Dashboard tabs, canvas, grid, and course cards | Synthetic support    | Semantic discovery and Chromium workflow test          |
| Left rail and right To Do/upcoming rail        | Synthetic support    | Structural/label discovery and full-shell fixture      |
| Content surfaces, controls, modals, popovers   | Synthetic support    | Role/data/structural discovery tests                   |
| Footer and responsive states                   | Synthetic support    | Annotated CSS and browser test artifact                |
| Course pages                                   | Detection only       | URL contract tests                                     |
| Materials pages                                | Detection only       | URL contract tests                                     |
| Grade pages                                    | Detection only       | URL contract tests                                     |
| Course dashboard cards                         | Synthetic support    | Reversible workspace fixture tests                     |
| Materials rows                                 | Synthetic support    | Known-layout adapter tests                             |
| Assessments                                    | Synthetic support    | Fail-closed supported-control tests                    |
| Grade scenario studio                          | Manual points only   | Calculation and unsupported-rule tests                 |
| Firefox                                        | Not supported        | Deferred until Chrome behavior stabilizes              |

“Synthetic support” is not a claim of production compatibility. Real adapter acceptance requires
anonymized DOM fragments and manual validation from at least one Schoology-hosted and one custom
domain deployment.

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
