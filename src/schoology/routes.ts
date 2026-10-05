/*
 * Route patterns adapted from aopell/SchoologyPlus src/scripts/content.ts at
 * commit 85e2e869678570179fba6ba554d5ca0b469ff3ec.
 *
 * Copyright (c) 2017-2024 Aaron Opell and Glen Husman
 * SPDX-License-Identifier: MIT
 * See THIRD_PARTY_NOTICES.md and docs/upstream-source-map.md.
 */
export type SchoologyRoute =
  | "home"
  | "grades"
  | "materials"
  | "material"
  | "assignment"
  | "assessment"
  | "course"
  | "courses"
  | "page"
  | "user"
  | "unknown";

const ROUTES: ReadonlyArray<readonly [SchoologyRoute, RegExp]> = [
  ["grades", /^\/grades\/grades$/],
  ["grades", /^\/course\/\d+\/student_grades$/],
  ["grades", /^\/courses\/\d+\/grades(?:\/|$)/],
  ["materials", /^\/course\/\d+\/materials$/],
  ["materials", /^\/courses\/\d+\/materials$/],
  ["material", /^\/course\/\d+\/materials\//],
  ["material", /^\/courses\/\d+\/materials\//],
  ["assessment", /^\/assignment\/\d+\/assessment$/],
  ["assignment", /^\/assignment\/\d+(?:\/|$)/],
  ["home", /^\/$/],
  ["home", /^\/home$/],
  ["home", /^\/home\/(?:recent-activity|course-dashboard)$/],
  ["page", /^\/page\//],
  ["user", /^\/user\/\d+$/],
  ["courses", /^\/courses(?:\/|$)/],
  ["course", /^\/course\/\d+(?:\/|$)/]
];

export function schoologyRoute(pathname: string): SchoologyRoute {
  return ROUTES.find(([, pattern]) => pattern.test(pathname))?.[0] ?? "unknown";
}

export function isHomeRoute(pathname: string): boolean {
  return schoologyRoute(pathname) === "home";
}

export function isCourseExperienceRoute(pathname: string): boolean {
  return ["course", "materials", "material", "assignment", "page", "grades", "assessment"].includes(
    schoologyRoute(pathname)
  );
}

export function routeCompatibilityStatus(pathname: string): {
  detail: string;
  route: SchoologyRoute;
  status: "Available" | "Experimental" | "Unsupported";
} {
  const route = schoologyRoute(pathname);
  if (
    [
      "home",
      "course",
      "materials",
      "material",
      "assignment",
      "page",
      "grades",
      "assessment"
    ].includes(route)
  ) {
    return {
      detail: "Route-specific fixture, Chromium, responsive, contrast, and restoration coverage.",
      route,
      status: "Available"
    };
  }
  if (route === "courses") {
    return {
      detail: "URL routing is recognized, but the course-directory DOM still needs a real fixture.",
      route,
      status: "Experimental"
    };
  }
  return {
    detail: "No verified route-specific shell adapter or browser fixture.",
    route,
    status: "Unsupported"
  };
}
