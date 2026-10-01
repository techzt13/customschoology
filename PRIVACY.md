# Privacy

Schoology Companion does not collect analytics, send telemetry, load remote code, or operate a
developer-controlled server.

## Data stored locally

Chrome local extension storage may contain:

- Appearance and density preferences.
- Native Schoology page colors, typography, layout, and optional region visibility preferences.
- Approved custom Schoology domain names.
- Detected course identifiers and names, plus private nicknames and colors.
- Assignment identifiers marked complete in the private Today plan.

This data remains in the current Chrome profile and is not stored with `chrome.storage.sync`.
Students can export, import, or delete it from the settings page.

## Schoology page access

The extension runs automatically on `https://*.schoology.com/*`. Access to any custom school domain
must be granted through a user gesture in the toolbar popup. Access can be revoked in settings or
Chrome's extension controls.

The content script reads supported page regions to identify upcoming assignments and visible
submission states. It does not submit assignments, alter official grades, or send page data
elsewhere.

Native customization adds an extension-owned class and generated scoped stylesheet to supported
pages. It does not rewrite Schoology content or store page HTML.

## Optional credentials

The current milestone does not request or store Schoology API credentials. Any future credential
feature requires a separate security review, explicit consent, local-only storage, and deletion
controls before release.

## Diagnostics

There is no automatic diagnostic upload. Future diagnostic exports must redact names, course titles,
grades, assignment titles, identifiers, tokens, and credentials.
