# Schoology Companion

Schoology Companion is a privacy-first Chrome extension that adds an accessible, customizable
student workspace to Schoology. The first milestone provides a local Today panel, progressive
custom-domain access, appearance presets, and explicit control over local data.

The project is independent and is not affiliated with PowerSchool or Schoology. It is an original
implementation and does not include SchoologyPlus source or assets.

## Current milestone

- Manifest V3 extension with a service worker, content script, popup, and options page.
- Automatic support for `*.schoology.com` and user-approved custom HTTPS domains.
- Page capability detection and a fixture-tested upcoming-work adapter.
- In-page Today panel with official status labels and a separate private completion list.
- System, Calm, High Contrast, and Expressive presets; density, accent, course nickname, and course
  color controls.
- Safe, reversible full-shell styling for positively identified institution headers, dashboard tabs,
  page canvases, dashboard grids, course cards, left/right rails, surfaces, controls,
  modals/popovers, and footers.
- Sixteen semantic native-page colors with Automatic WCAG AA, Preserve with warnings, complete High
  Contrast, and Manual Advanced modes. Settings show requested/resolved colors and ratios rather
  than silently replacing a choice.
- Bounded automatic contrast correction only for semantic targets inside extension-annotated
  regions, including transparent and mixed-background descendants.
- Course workspace favorites, reversible dashboard ordering/visibility, and local quick links.
- Focus planning with user priorities and effort estimates, materials-page planning actions,
  reliable assessment unanswered warnings, and explainable submission-state provenance.
- A separate local grade scenario studio for verified total-points math, target-score calculations,
  comparison, undo/reset, and explicit unsupported states for unverified rules.
- Local export, validated import, reset, permission revocation, and no telemetry.

Automatic gradebook import, weighted/dropped/extra-credit simulation, API credentials,
notifications, background polling, and Firefox packaging are intentionally deferred.

## Development

Requirements: Node.js 22 and npm.

```sh
npm install
npm run check
npm run dev
```

For an unpacked development build:

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select `dist/`.
5. Reload the extension after rebuilding.

## Architecture

- `src/platform` will contain browser API boundaries as they grow.
- `src/schoology` contains URL classification and DOM adapters.
- `src/content` owns page integration and the extension-mounted Today panel.
- `src/popup` and `src/options` are extension-page entry points.
- `src/shared` contains validated settings, messages, and domain models.
- `test/fixtures` contains synthetic or anonymized Schoology markup.

Schoology DOM nodes do not cross the adapter boundary. The native theme adapter centrally annotates
recognized regions with extension-owned `data-sc-region` and `data-sc-theme-role` attributes.
Generated CSS targets only those annotations; unknown regions and authored course content remain
native. Features consume normalized data and fail independently when a capability is unavailable.

## Privacy

See [PRIVACY.md](PRIVACY.md). No analytics or remote telemetry are collected.

## Testing real Schoology layouts

Synthetic fixtures are included, but adapter acceptance requires anonymized HTML fragments from a
Schoology-hosted deployment and a custom-domain deployment. See
[docs/manual-testing.md](docs/manual-testing.md).
