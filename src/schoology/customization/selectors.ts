export const SELECTOR_CONTRACT_VERSION = 1;
export const NON_STATUS_LINK =
  "a:not([class*='status']):not([class*='grade']):not([class*='status'] *):not([class*='grade'] *)";
const NON_STATUS_BUTTON =
  "button:not([class*='status']):not([class*='grade']):not([class*='status'] *):not([class*='grade'] *)";

export const SCHOOLOGY_SELECTORS = {
  buttons: [
    NON_STATUS_BUTTON,
    "input[type='button']",
    "input[type='submit']",
    ".btn-primary:not([class*='status']):not([class*='grade'])",
    ".button:not([class*='status']):not([class*='grade']):not([class*='status'] *):not([class*='grade'] *)"
  ],
  content: ["#main", "#main-content", "main[role='main']", ".page-content", "#body"],
  courseCards: [
    "[data-testid*='course-card']",
    ".course-card",
    ".course-dashboard .card",
    ".course-dashboard .course-item"
  ],
  footer: ["#footer", "footer[role='contentinfo']", ".site-footer"],
  header: ["#header", "header[role='banner']", ".site-navigation", "[data-testid='header']"],
  leftRail: ["#left-column", ".left-rail", "[data-testid='left-rail']"],
  links: [`main ${NON_STATUS_LINK}`, `#main ${NON_STATUS_LINK}`],
  rightRail: ["#right-column", ".right-rail", "[data-testid='right-rail']"],
  surfaces: [
    "[data-testid='content-card']",
    ".s-card",
    ".content-box",
    ".feed",
    ".upcoming-events",
    ".reminders-wrapper"
  ]
} as const;

export type SelectorGroup = keyof typeof SCHOOLOGY_SELECTORS;

export function scopedSelectors(group: SelectorGroup): string {
  return SCHOOLOGY_SELECTORS[group]
    .map((selector) => `html.sc-native-customized ${selector}`)
    .join(",\n");
}

export function scopedDescendants(group: SelectorGroup, descendant: string): string {
  return SCHOOLOGY_SELECTORS[group]
    .map((selector) => `html.sc-native-customized ${selector} ${descendant}`)
    .join(",\n");
}

export function detectSelectorSupport(document: Document): Set<SelectorGroup> {
  const supported = new Set<SelectorGroup>();
  for (const [group, selectors] of Object.entries(SCHOOLOGY_SELECTORS) as Array<
    [SelectorGroup, readonly string[]]
  >) {
    if (selectors.some((selector) => document.querySelector(selector))) supported.add(group);
  }
  return supported;
}
