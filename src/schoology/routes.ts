/**
 * Route patterns adapted from aopell/SchoologyPlus content.ts at
 * 85e2e869678570179fba6ba554d5ca0b469ff3ec (MIT). See THIRD_PARTY_NOTICES.md.
 */
export type SchoologyRoute =
  | "home"
  | "grades"
  | "materials"
  | "material"
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
  ["home", /^\/$/],
  ["home", /^\/home$/],
  ["home", /^\/home\/(?:recent-activity|course-dashboard)$/],
  ["assessment", /^\/assignment\/\d+\/assessment$/],
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
