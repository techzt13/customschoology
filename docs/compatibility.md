# Compatibility matrix

| Surface                                             | Current status       | Evidence                                               |
| --------------------------------------------------- | -------------------- | ------------------------------------------------------ |
| Schoology-hosted home/upcoming page                 | Synthetic support    | Adapter fixture and unit tests                         |
| Custom-domain home/upcoming page                    | Architecture support | Progressive permission and dynamic script registration |
| Native header, content, course cards, rails, footer | Synthetic support    | Versioned selector contract and representative fixture |
| Course pages                                        | Detection only       | URL contract tests                                     |
| Materials pages                                     | Detection only       | URL contract tests                                     |
| Grade pages                                         | Detection only       | URL contract tests                                     |
| Course dashboard cards                              | Synthetic support    | Reversible workspace fixture tests                     |
| Materials rows                                      | Synthetic support    | Known-layout adapter tests                             |
| Assessments                                         | Synthetic support    | Fail-closed supported-control tests                    |
| Grade scenario studio                               | Manual points only   | Calculation and unsupported-rule tests                 |
| Firefox                                             | Not supported        | Deferred until Chrome behavior stabilizes              |

“Synthetic support” is not a claim of production compatibility. Real adapter acceptance requires
anonymized DOM fragments and manual validation from at least one Schoology-hosted and one custom
domain deployment.

Native customization detects each selector group independently. Unknown groups retain Schoology's
original styling. Official grade, submission, missing, late, and other status classes are excluded
from extension button/link selectors, but institution-specific status markup still requires manual
verification.

The grade studio deliberately does not read or edit native grade cells. Total-points scenarios are
supported from user-entered values; weighted categories, dropped grades, extra credit, and automatic
gradebook import remain explicitly unsupported until representative rules and sanitized fixtures are
available.

Within detected regions, a bounded observer checks links, tabs, headings, labels, buttons, and text
against their effective rendered background, including transparent ancestors. It annotates only
failing elements and removes annotations when customization is disabled. Images, iframes, and
official status/grade regions are excluded.
