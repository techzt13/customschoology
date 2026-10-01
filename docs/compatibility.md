# Compatibility matrix

| Surface                             | Current status       | Evidence                                               |
| ----------------------------------- | -------------------- | ------------------------------------------------------ |
| Schoology-hosted home/upcoming page | Synthetic support    | Adapter fixture and unit tests                         |
| Custom-domain home/upcoming page    | Architecture support | Progressive permission and dynamic script registration |
| Course pages                        | Detection only       | URL contract tests                                     |
| Materials pages                     | Detection only       | URL contract tests                                     |
| Grade pages                         | Detection only       | URL contract tests                                     |
| Assessments                         | Not implemented      | Planned after real DOM evidence                        |
| Firefox                             | Not supported        | Deferred until Chrome behavior stabilizes              |

“Synthetic support” is not a claim of production compatibility. Real adapter acceptance requires
anonymized DOM fragments and manual validation from at least one Schoology-hosted and one custom
domain deployment.
