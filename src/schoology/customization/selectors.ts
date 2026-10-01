import type { NativeThemeRegion, ThemeCompatibilityReport } from "../../shared/models";

export const SELECTOR_CONTRACT_VERSION = 2;
export const REGION_ATTRIBUTE = "data-sc-region";
export const THEME_ROLE_ATTRIBUTE = "data-sc-theme-role";

const STATUS_OR_AUTHORED_CONTENT =
  "[class*='status' i], [class*='grade' i], [data-status], [data-grade], [aria-label*='status' i], [aria-label*='grade' i], [data-sc-preserve], .submission-status, .grade-item, .user-generated-content, .material-content, [contenteditable='true'], iframe";

export const REGION_LABELS: Record<NativeThemeRegion, string> = {
  "institution-header": "Institution header and primary navigation",
  "dashboard-tabs": "Recent Activity and Course Dashboard tabs",
  "page-canvas": "Page canvas",
  "dashboard-grid": "Dashboard grid",
  "course-card": "Course cards",
  "course-card-content": "Course card text areas",
  "left-rail": "Left rail",
  "right-rail": "Right To Do and upcoming rail",
  surface: "Common content surfaces",
  modal: "Modal dialogs",
  popover: "Menus and popovers",
  footer: "Footer"
};

const REGION_PRIORITY: Record<NativeThemeRegion, number> = {
  "institution-header": 100,
  "dashboard-tabs": 90,
  "course-card-content": 85,
  "course-card": 80,
  "right-rail": 75,
  "left-rail": 75,
  modal: 70,
  popover: 70,
  footer: 60,
  "dashboard-grid": 65,
  surface: 50,
  "page-canvas": 10
};

type RegionQueries = Partial<Record<NativeThemeRegion, readonly string[]>>;

const DIRECT_REGION_QUERIES: RegionQueries = {
  "institution-header": [
    "header[role='banner']",
    "#header",
    "[data-testid='header']",
    "[data-testid*='navigation']",
    "body > header"
  ],
  "dashboard-tabs": [
    "[role='tablist']",
    "nav.tabs",
    "[data-testid*='dashboard-tab']",
    "[data-testid*='activity-tab']"
  ],
  "page-canvas": ["body", "main[role='main']", "main", "#main", "#main-content"],
  "dashboard-grid": [
    "[data-testid*='course-dashboard']",
    ".course-dashboard",
    "[data-testid*='course-grid']"
  ],
  "course-card": [
    "[data-testid*='course-card']",
    ".course-card",
    ".course-dashboard .card",
    ".course-dashboard .course-item"
  ],
  "course-card-content": [
    "[data-testid*='course-card'] [data-testid*='content']",
    ".course-card .card-content",
    ".course-card .course-card-content"
  ],
  "left-rail": ["#left-column", "[data-testid='left-rail']", "[aria-label*='course navigation' i]"],
  "right-rail": [
    "#right-column",
    "[data-testid='right-rail']",
    "[aria-label*='to do' i]",
    "[aria-label*='upcoming' i]"
  ],
  surface: [
    "[data-testid='content-card']",
    ".s-card",
    ".feed",
    ".upcoming-events",
    ".reminders-wrapper"
  ],
  modal: ["[role='dialog'][aria-modal='true']", "[data-testid*='modal']"],
  popover: ["[role='menu']", "[role='listbox']", "[data-testid*='popover']"],
  footer: ["footer[role='contentinfo']", "#footer", ".site-footer"]
};

function addRegion(
  regions: Map<NativeThemeRegion, Set<HTMLElement>>,
  region: NativeThemeRegion,
  element: Element | null
): void {
  if (!(element instanceof HTMLElement) || element.matches(STATUS_OR_AUTHORED_CONTENT)) return;
  const entries = regions.get(region) ?? new Set<HTMLElement>();
  entries.add(element);
  regions.set(region, entries);
}

function discoverStructuralRegions(
  document: Document,
  regions: Map<NativeThemeRegion, Set<HTMLElement>>
): void {
  const tabs = [...document.querySelectorAll<HTMLElement>("[role='tab'], a, button")].filter(
    (node) => /recent activity|course dashboard/i.test(node.textContent ?? "")
  );
  for (const tab of tabs) {
    addRegion(
      regions,
      "dashboard-tabs",
      tab.closest("[role='tablist'], nav, ul, [data-testid*='tabs'], .tabs") ?? tab.parentElement
    );
  }

  const courseLinks = [
    ...document.querySelectorAll<HTMLAnchorElement>(
      "a[href*='/course/'], a[href*='/courses/'], a[href*='course_id=']"
    )
  ];
  for (const link of courseLinks.slice(0, 80)) {
    const card = link.closest<HTMLElement>(
      "article, li, [data-testid*='course-card'], .course-card, .card, .course-item"
    );
    if (!card) continue;
    addRegion(regions, "course-card", card);
    const content = link.closest<HTMLElement>(
      "[data-testid*='content'], .card-content, .course-card-content"
    );
    if (content && content !== card) addRegion(regions, "course-card-content", content);
    const grid = card.parentElement;
    if (grid && grid.querySelectorAll("a[href*='/course/'], a[href*='/courses/']").length > 1) {
      addRegion(regions, "dashboard-grid", grid);
    }
  }

  for (const aside of document.querySelectorAll<HTMLElement>("aside, [role='complementary']")) {
    const label = `${aside.getAttribute("aria-label") ?? ""} ${aside.textContent ?? ""}`;
    if (/\b(to do|upcoming|reminder|due)\b/i.test(label)) addRegion(regions, "right-rail", aside);
    else if (/\b(course|group|navigation|menu)\b/i.test(label))
      addRegion(regions, "left-rail", aside);
  }

  const main = document.querySelector<HTMLElement>("main[role='main'], main, #main, #main-content");
  if (main) {
    for (const child of main.children) {
      if (
        child instanceof HTMLElement &&
        child.matches("section, article") &&
        !child.matches(STATUS_OR_AUTHORED_CONTENT) &&
        !child.closest(`[${REGION_ATTRIBUTE}="course-card"]`)
      ) {
        const label = `${child.getAttribute("aria-label") ?? ""} ${child.className}`;
        if (/\b(feed|upcoming|reminder|dashboard|activity|content-box)\b/i.test(label)) {
          addRegion(regions, "surface", child);
        }
      }
    }
  }
}

function annotateThemeRoles(region: HTMLElement): void {
  const candidates = region.querySelectorAll<HTMLElement>(
    "a, button, input, select, textarea, [role='button'], [role='tab'], h1, h2, h3, h4, h5, h6, label, [data-empty], .empty-state"
  );
  for (const element of [...candidates].slice(0, 800)) {
    if (element.closest(STATUS_OR_AUTHORED_CONTENT)) continue;
    if (element.matches("[data-empty], .empty-state")) {
      element.setAttribute(THEME_ROLE_ATTRIBUTE, "empty");
    } else if (element.matches("[role='tab']")) {
      const active =
        element.getAttribute("aria-selected") === "true" ||
        element.getAttribute("aria-current") === "page" ||
        element.classList.contains("active");
      element.setAttribute(THEME_ROLE_ATTRIBUTE, active ? "tab-active" : "tab-inactive");
    } else if (element.matches("a")) {
      element.setAttribute(THEME_ROLE_ATTRIBUTE, "link");
    } else if (
      element.matches("button, input, select, textarea, [role='button']") &&
      region.getAttribute(REGION_ATTRIBUTE) === "institution-header"
    ) {
      element.setAttribute(THEME_ROLE_ATTRIBUTE, "icon-control");
    } else if (element.matches("button, input, select, textarea, [role='button']")) {
      element.setAttribute(THEME_ROLE_ATTRIBUTE, "control");
    } else {
      element.setAttribute(THEME_ROLE_ATTRIBUTE, "text");
    }
  }
}

export function clearThemeRegions(document: Document): void {
  for (const element of document.querySelectorAll<HTMLElement>(
    `[${REGION_ATTRIBUTE}], [${THEME_ROLE_ATTRIBUTE}]`
  )) {
    element.removeAttribute(REGION_ATTRIBUTE);
    element.removeAttribute(THEME_ROLE_ATTRIBUTE);
  }
}

export function discoverThemeRegions(document: Document): ThemeCompatibilityReport {
  clearThemeRegions(document);
  const regions = new Map<NativeThemeRegion, Set<HTMLElement>>();
  for (const [region, queries] of Object.entries(DIRECT_REGION_QUERIES) as Array<
    [NativeThemeRegion, readonly string[]]
  >) {
    for (const selector of queries) {
      for (const element of document.querySelectorAll(selector)) {
        addRegion(regions, region, element);
      }
    }
  }
  discoverStructuralRegions(document, regions);

  const detected: Partial<Record<NativeThemeRegion, number>> = {};
  for (const [region, elements] of regions) {
    detected[region] = elements.size;
    for (const element of elements) {
      const existing = element.getAttribute(REGION_ATTRIBUTE) as NativeThemeRegion | null;
      if (existing && REGION_PRIORITY[existing] > REGION_PRIORITY[region]) continue;
      element.setAttribute(REGION_ATTRIBUTE, region);
      if (region !== "page-canvas" && region !== "dashboard-grid") annotateThemeRoles(element);
    }
  }
  const expected: NativeThemeRegion[] = [
    "institution-header",
    "dashboard-tabs",
    "page-canvas",
    "dashboard-grid",
    "course-card",
    "right-rail"
  ];
  const themed = [
    ...new Set(
      [...document.querySelectorAll<HTMLElement>(`[${REGION_ATTRIBUTE}]`)]
        .map((element) => element.getAttribute(REGION_ATTRIBUTE) as NativeThemeRegion)
        .filter(Boolean)
    )
  ];
  return {
    detected,
    nativePreserved: [
      "Logos and course images",
      "Official status, grade, and status-icon semantics",
      "Authored course content",
      "Images and iframes"
    ],
    themed,
    unsupported: expected
      .filter((region) => !regions.has(region))
      .map((region) => REGION_LABELS[region]),
    updatedAt: new Date().toISOString()
  };
}

export function detectedThemeRegions(document: Document): Set<NativeThemeRegion> {
  return new Set(
    [...document.querySelectorAll<HTMLElement>(`[${REGION_ATTRIBUTE}]`)]
      .map((element) => element.getAttribute(REGION_ATTRIBUTE) as NativeThemeRegion)
      .filter(Boolean)
  );
}

// Compatibility exports for adapters and tests that still need raw capability checks.
export const SCHOOLOGY_SELECTORS = DIRECT_REGION_QUERIES;
export type SelectorGroup = NativeThemeRegion;

export function detectSelectorSupport(document: Document): Set<NativeThemeRegion> {
  return detectedThemeRegions(document);
}

export function scopedSelectors(group: NativeThemeRegion): string {
  return `html.sc-native-customized [data-sc-region="${group}"]`;
}

export function scopedDescendants(group: NativeThemeRegion, descendant: string): string {
  return `${scopedSelectors(group)} ${descendant}`;
}

export const NON_STATUS_LINK = `a:not(${STATUS_OR_AUTHORED_CONTENT})`;
