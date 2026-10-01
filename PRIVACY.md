# Privacy

Schoology Companion does not collect analytics, send telemetry, load remote code, or operate a
developer-controlled server.

## Data stored locally

Chrome local extension storage may contain:

- Appearance and density preferences.
- Native Schoology preset, semantic colors, typography, component treatments, layout, motion, and
  optional region visibility preferences.
- Approved custom Schoology domain names.
- Detected course identifiers and names, plus private nicknames and colors.
- Assignment identifiers marked complete in the private Today plan.
- Local focus priorities and effort estimates.
- Course favorites, dashboard order/visibility, and user-created quick links.
- User-entered grade scenarios and points-based planning inputs.

This data remains in the current Chrome profile and is not stored with `chrome.storage.sync`.
Students can export, import, or delete it from the settings page.

## Schoology page access

The extension runs automatically on `https://*.schoology.com/*`. Access to any custom school domain
must be granted through a user gesture in the toolbar popup. Access can be revoked in settings or
Chrome's extension controls.

The content script reads supported page regions to identify upcoming assignments and visible
submission states. It does not submit assignments, alter official grades, or send page data
elsewhere.

Native customization adds extension-owned region/role annotations, a root class, and a generated
scoped stylesheet to recognized Schoology shell regions. It does not rewrite Schoology content or
store page HTML. Safe color rules and structural rules are separate; a local geometry check can
remove only structural rules when a critical native region becomes unsafe. A local compatibility
report stores only region names/counts, preservation categories, a generic layout warning, and a
timestamp so settings can explain what was themed; it stores no page text, URLs, element geometry,
student data, or institution identifiers.

The project includes no SchoologyPlus telemetry or analytics. Its limited MIT-licensed compatibility
references are identified in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

In Automatic WCAG AA mode, the extension may inspect computed foreground and background colors
inside positively identified regions. Corrections can select only configured semantic colors or
black/white fallbacks. This calculation remains in the page, is bounded to semantic targets, and is
never stored or transmitted. Preserve and Manual modes do not apply runtime substitutions.

## Optional credentials

**Unsupported:** the extension does not request or store Schoology API credentials. Any future
credential feature requires a separate security review, explicit consent, local-only storage, and
deletion controls before release.

Grade scenarios use values entered by the student and never edit or submit official Schoology
grades. Assessment warnings inspect supported answer controls only at submit time and do not store
answers.

## Diagnostics

There is no automatic diagnostic upload. Future diagnostic exports must redact names, course titles,
grades, assignment titles, identifiers, tokens, and credentials.
