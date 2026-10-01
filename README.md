# Schoology Companion

Schoology Companion is a privacy-first Chrome extension that adds an accessible, customizable
student workspace to Schoology with a local Today panel, progressive custom-domain access, complete
native-shell themes, planning tools, and explicit control over local data.

The project is independent and is not affiliated with PowerSchool or Schoology. It uses MIT-licensed
route and Schoology DOM compatibility knowledge from a pinned SchoologyPlus revision; it does not
use SchoologyPlus branding, assets, analytics, or remote services. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Capability status

| Capability                                           | Status                     |
| ---------------------------------------------------- | -------------------------- |
| Local Today, planning, course workspace, settings    | Available                  |
| 20 complete native-shell visual presets              | Experimental               |
| Native Schoology adapters on institution deployments | Needs real-site validation |
| Manual total-points grade scenarios                  | Available                  |
| Automatic grade import and unverified grade rules    | Unsupported                |
| Schoology API credentials and background polling     | Unsupported                |
| Firefox packaging                                    | Unsupported                |

Implementation checks passing does not mean production compatibility is signed off. Native adapters,
responsive behavior, keyboard/screen-reader behavior, and observer performance still require manual
validation on both Schoology-hosted and custom-domain deployments.

## Available implementation

- Manifest V3 extension with a service worker, content script, popup, and options page.
- Automatic support for `*.schoology.com` and user-approved custom HTTPS domains.
- Page capability detection and a fixture-tested upcoming-work adapter.
- In-page Today panel with official status labels and a separate private completion list.
- Exactly 20 complete native-shell presets spanning light, dark, high-contrast, expressive, and
  productivity treatments, plus density, accent, course nickname, and course color controls.
- Safe, reversible full-shell styling for positively identified institution headers, dashboard tabs,
  page canvases, dashboard grids, course cards, left/right rails, surfaces, controls,
  modals/popovers, and footers.
- Route-specific home-shell adapters preserve Schoology's verified center plus right-column
  structure. Layout rules are isolated from colors and automatically rolled back if a previously
  visible critical region collapses, moves offscreen, overlaps, or disappears.
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

## Visual presets

Every preset is an immutable, complete 16-token and component-style snapshot. Applying one sets its
font, density, width, corners, elevation, control, navigation, tab, rail, card, layout, and motion
treatments together; later edits are shown as **Customized**.

| Light and editorial                                          | Dark and high contrast                                | Expressive and productivity                                          |
| ------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Clear Horizon, Porcelain Air, Sandstone Notes, Arctic Ledger | Midnight Study, Deep Current, Forest Night, Pure OLED | Petal Mist, Mint Canvas, Electric Berry, Ocean Atlas, Evergreen Desk |
| Pressroom, Graphite Line, Signal Light                       | Signal Dark                                           | Solar Ember, Lavender Circuit, Slate Sprint                          |

All required preset foreground/background and component-state pairs are validated before build:
normal text at least 4.5:1, with boundaries, selection indicators, and focus rings at least 3:1.
Automatic runtime contrast remains a fallback for institution-specific nested backgrounds, not a way
to make an invalid preset pass.

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
native. Applying a visual preset restores every core Schoology section; visibility is a separate,
explicit action with active indicators and a one-click recovery control. Features consume normalized
data and fail independently when a capability is unavailable.

## Privacy

See [PRIVACY.md](PRIVACY.md). No analytics or remote telemetry are collected.

## Testing real Schoology layouts

Synthetic fixtures are included, but adapter acceptance requires anonymized HTML fragments from a
Schoology-hosted deployment and a custom-domain deployment. See
[docs/manual-testing.md](docs/manual-testing.md).

The pinned SchoologyPlus comparison and current evidence-based coverage are documented in
[docs/compatibility.md](docs/compatibility.md).
