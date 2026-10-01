# Compatibility matrix

| Surface                                             | Current status       | Evidence                                               |
| --------------------------------------------------- | -------------------- | ------------------------------------------------------ |
| Schoology-hosted home/upcoming page                 | Synthetic support    | Adapter fixture and unit tests                         |
| Custom-domain home/upcoming page                    | Architecture support | Progressive permission and dynamic script registration |
| Native header, content, course cards, rails, footer | Synthetic support    | Versioned selector contract and representative fixture |
| Course pages                                        | Detection only       | URL contract tests                                     |
| Materials pages                                     | Detection only       | URL contract tests                                     |
| Grade pages                                         | Detection only       | URL contract tests                                     |
| Assessments                                         | Not implemented      | Planned after real DOM evidence                        |
| Firefox                                             | Not supported        | Deferred until Chrome behavior stabilizes              |

“Synthetic support” is not a claim of production compatibility. Real adapter acceptance requires
anonymized DOM fragments and manual validation from at least one Schoology-hosted and one custom
domain deployment.

Native customization detects each selector group independently. Unknown groups retain Schoology's
original styling. Official grade, submission, missing, late, and other status classes are excluded
from extension button/link selectors, but institution-specific status markup still requires manual
verification.
