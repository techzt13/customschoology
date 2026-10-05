/*
 * Home and course-shell compatibility selectors include adapted portions of
 * aopell/SchoologyPlus src/styles/modern/all.scss and src/scripts/pages/home.ts,
 * course.ts, materials.ts, material.ts, page.ts, and grades.ts at commit
 * 85e2e869678570179fba6ba554d5ca0b469ff3ec.
 *
 * Copyright (c) 2017-2024 Aaron Opell and Glen Husman
 * SPDX-License-Identifier: MIT
 * See THIRD_PARTY_NOTICES.md and docs/upstream-source-map.md.
 */

import type { NativeThemeRegion, ThemeCompatibilityReport } from "../../shared/models";
import { isCourseExperienceRoute, isHomeRoute, routeCompatibilityStatus } from "../routes";

export const SELECTOR_CONTRACT_VERSION = 4;
export const REGION_ATTRIBUTE = "data-sc-region";
export const THEME_ROLE_ATTRIBUTE = "data-sc-theme-role";

const STATUS_OR_AUTHORED_CONTENT =
  "[class*='status' i], [class*='grade' i], [data-status], [data-grade], [aria-label*='status' i], [aria-label*='grade' i], [data-sc-preserve], .submission-status, .grade-item, .user-generated-content, .material-content, [contenteditable='true'], iframe";

export const REGION_LABELS: Record<NativeThemeRegion, string> = {
  "center-column": "Center content column",
  "center-top": "Center header surface",
  "content-wrapper": "Content wrapper",
  "institution-header": "Institution header and primary navigation",
  "dashboard-tabs": "Recent Activity and Course Dashboard tabs",
  "page-canvas": "Page canvas",
  "home-feed": "Recent Activity feed",
  "home-shell": "Home shell",
  "course-shell": "Course route shell",
  "course-header": "Course title and action header",
  "course-sidebar": "Course sidebar",
  "course-navigation": "Course navigation",
  "course-main": "Course main reading surface",
  "course-image": "Course image",
  breadcrumbs: "Breadcrumbs",
  "dashboard-grid": "Dashboard grid",
  "course-card": "Course cards",
  "course-card-media": "Course card media",
  "course-card-content": "Course card text areas",
  "materials-toolbar": "Materials toolbar and actions",
  "materials-list": "Materials list",
  "material-row": "Material and folder rows",
  "authored-content": "Teacher-authored reading content",
  "left-rail": "Left rail",
  "right-rail": "Right To Do and upcoming rail",
  "right-rail-inner": "Right To Do and upcoming rail sections",
  surface: "Common content surfaces",
  modal: "Modal dialogs",
  popover: "Menus and popovers",
  footer: "Footer"
};

const REGION_PRIORITY: Record<NativeThemeRegion, number> = {
  "institution-header": 100,
  "center-top": 95,
  "dashboard-tabs": 90,
  "authored-content": 89,
  "material-row": 88,
  "materials-toolbar": 87,
  "materials-list": 86,
  "course-card-content": 85,
  "course-card-media": 84,
  "course-card": 80,
  "course-header": 79,
  "right-rail-inner": 78,
  "course-navigation": 77,
  "course-sidebar": 76,
  "right-rail": 75,
  "left-rail": 75,
  breadcrumbs: 74,
  "course-image": 73,
  "course-main": 64,
  modal: 70,
  popover: 70,
  footer: 60,
  "dashboard-grid": 65,
  "home-feed": 62,
  "center-column": 60,
  "content-wrapper": 58,
  "course-shell": 56,
  "home-shell": 55,
  surface: 50,
  "page-canvas": 10
};

type RegionQueries = Partial<Record<NativeThemeRegion, readonly string[]>>;

const DIRECT_REGION_QUERIES: RegionQueries = {
  "institution-header": [
    "#header > header",
    "header[role='banner']",
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
  "page-canvas": ["#body", "[data-testid='page-canvas']"],
  "home-shell": [],
  "center-column": [],
  "content-wrapper": ["#main-inner"],
  "center-top": [],
  "home-feed": [],
  "dashboard-grid": [
    "[data-testid*='course-dashboard']",
    ".course-dashboard",
    "[data-testid*='course-grid']"
  ],
  "course-card": [
    ".course-dashboard .sgy-card",
    "[data-testid*='course-card']",
    ".course-card",
    ".course-dashboard .card",
    ".course-dashboard .course-item"
  ],
  "course-card-content": [
    ".course-dashboard .course-dashboard__card-context",
    "[data-testid*='course-card'] [data-testid*='content']",
    ".course-card .card-content",
    ".course-card .course-card-content"
  ],
  "course-card-media": [
    ".course-dashboard .sgy-card-lens",
    ".course-dashboard .course-dashboard__card-image",
    "[data-testid*='course-card'] [data-testid*='image']"
  ],
  "left-rail": ["#left-column", "[data-testid='left-rail']", "[aria-label*='course navigation' i]"],
  "right-rail": [
    "#right-column",
    "[data-testid='right-rail']",
    "[aria-label*='to do' i]",
    "[aria-label*='upcoming' i]"
  ],
  "right-rail-inner": [],
  surface: [
    "[data-testid='upcoming-assignments']",
    "[data-testid='content-card']",
    ".s-card",
    ".feed",
    ".materials-list",
    ".upcoming-events",
    ".reminders-wrapper"
  ],
  modal: ["[role='dialog'][aria-modal='true']", "[data-testid*='modal']"],
  popover: ["[role='menu']", "[role='listbox']", "[data-testid*='popover']"],
  footer: ["footer[role='contentinfo']", "#footer", ".site-footer"]
};

// Home-shell selectors adapted from aopell/SchoologyPlus all.scss/home.ts at the pinned MIT
// revision listed in THIRD_PARTY_NOTICES.md. Styling and discovery behavior here are independent.
const HOME_ROUTE_REGION_QUERIES: Partial<Record<NativeThemeRegion, readonly string[]>> = {
  "home-shell": ["#main-content-wrapper"],
  "center-column": ["#main-content-wrapper > #center", "#center"],
  "center-top": ["#center-top"],
  "home-feed": ["#home-feed-container"],
  "right-rail": ["#main-content-wrapper > #right-column", "#right-column"],
  "right-rail-inner": ["#right-column-inner"]
};

// Selector knowledge adapted from the pinned SchoologyPlus modern course/materials styles and
// route modules listed in this file's MIT header. Unknown course structures remain untouched.
const COURSE_ROUTE_REGION_QUERIES: Partial<Record<NativeThemeRegion, readonly string[]>> = {
  "course-shell": ["#main-content-wrapper"],
  "center-column": ["#main-content-wrapper > #center", "#center"],
  "center-top": ["#center-top"],
  "course-header": [
    "#center-top .content-top-upper",
    "#center-top .page-title",
    "#center-top .course-title"
  ],
  "course-sidebar": ["#sidebar-left"],
  "course-navigation": [
    "#sidebar-left #left-nav",
    "#sidebar-left #menu-s-main",
    "#sidebar-left [aria-label*='course navigation' i]"
  ],
  "course-main": ["#center div#main", "#main", "#main-inner", "#content-wrapper"],
  "course-image": [".course-image"],
  breadcrumbs: [
    "nav[aria-label*='breadcrumb' i]",
    ".breadcrumb",
    "[class*='nav-breadcrumb-container-']"
  ],
  "materials-toolbar": [
    ".materials-top",
    ".materials-filter-wrapper",
    "#course-profile-materials > .action-links",
    "#course-profile-materials > .materials-top"
  ],
  "materials-list": ["#course-profile-materials", "#folder-contents-table", ".materials-list"],
  "material-row": [
    "#course-profile-materials > [class*='type-']",
    "#course-profile-materials > .material-row",
    "#folder-contents-table tr",
    ".materials-list > li"
  ],
  "authored-content": [
    "#important-post-body",
    "#main-inner .info-container",
    "#content-wrapper .info-container",
    ".standard-page .s-page-content-full",
    ".s-page-summary",
    ".user-generated-content",
    ".material-content",
    ".assignment-content",
    ".instructions-content",
    ".folder-description",
    ".item-info"
  ],
  "right-rail": ["#main-content-wrapper > #right-column", "#right-column"],
  "right-rail-inner": ["#right-column-inner"]
};

function addRegion(
  regions: Map<NativeThemeRegion, Set<HTMLElement>>,
  region: NativeThemeRegion,
  element: Element | null,
  allowAuthored = false
): void {
  if (
    !(element instanceof HTMLElement) ||
    (!allowAuthored && element.matches(STATUS_OR_AUTHORED_CONTENT))
  )
    return;
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
  if (region.dataset.scRegion === "authored-content") return;
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
  if (!document.querySelector("#header > header")) {
    addRegion(regions, "institution-header", document.querySelector("#header"));
  }
  const pathname = document.defaultView?.location.pathname ?? "";
  const hasProvenHomeShell =
    isHomeRoute(pathname) ||
    document.body.classList.contains("is-home") ||
    document.querySelector(".course-dashboard, #home-feed-container") !== null;
  if (hasProvenHomeShell) {
    for (const [region, queries] of Object.entries(HOME_ROUTE_REGION_QUERIES) as Array<
      [NativeThemeRegion, readonly string[]]
    >) {
      for (const selector of queries) {
        for (const element of document.querySelectorAll(selector)) {
          addRegion(regions, region, element);
        }
      }
    }
  }
  if (isCourseExperienceRoute(pathname)) {
    for (const [region, queries] of Object.entries(COURSE_ROUTE_REGION_QUERIES) as Array<
      [NativeThemeRegion, readonly string[]]
    >) {
      for (const selector of queries) {
        for (const element of document.querySelectorAll(selector)) {
          addRegion(regions, region, element, region === "authored-content");
        }
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
      if (
        ![
          "page-canvas",
          "home-shell",
          "course-shell",
          "center-column",
          "content-wrapper",
          "home-feed",
          "dashboard-grid",
          "course-main",
          "course-card-media",
          "materials-list",
          "authored-content"
        ].includes(region)
      ) {
        annotateThemeRoles(element);
      }
    }
  }
  const expected: NativeThemeRegion[] = [
    "institution-header",
    "page-canvas",
    "center-column",
    ...(hasProvenHomeShell
      ? (["dashboard-tabs", "dashboard-grid", "course-card", "right-rail"] as NativeThemeRegion[])
      : []),
    ...(isCourseExperienceRoute(pathname)
      ? (["course-shell", "course-header", "course-main"] as NativeThemeRegion[])
      : [])
  ];
  const themed = [
    ...new Set(
      [...document.querySelectorAll<HTMLElement>(`[${REGION_ATTRIBUTE}]`)]
        .map((element) => element.getAttribute(REGION_ATTRIBUTE) as NativeThemeRegion)
        .filter(Boolean)
    )
  ];
  const routeStatus = routeCompatibilityStatus(pathname);
  return {
    detected,
    nativePreserved: [
      "Logos and course images",
      "Official status, grade, and status-icon semantics",
      "Authored course content",
      "Images and iframes"
    ],
    route: routeStatus.route,
    routeStatus: routeStatus.status,
    routeStatusDetail: routeStatus.detail,
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
