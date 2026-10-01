import type { PageCapabilities } from "../shared/models";
import { schoologyRoute } from "./routes";

const SCHOOLOGY_HOST = /(^|\.)schoology\.com$/i;

export function isLikelySchoology(document: Document, location: Location): boolean {
  if (SCHOOLOGY_HOST.test(location.hostname)) return true;
  const generator =
    document.querySelector<HTMLMetaElement>('meta[name="generator"]')?.content ?? "";
  const schoologyLinks = document.querySelectorAll('a[href*="/home"], a[href*="/courses/"]').length;
  return /schoology/i.test(generator) || schoologyLinks >= 2;
}

export function classifyPage(pathname: string): PageCapabilities["pageKind"] {
  const route = schoologyRoute(pathname);
  if (route === "grades") return "grades";
  if (route === "materials" || route === "material") return "materials";
  if (route === "course" || route === "courses") return "course";
  return route === "home" ? "home" : "unknown";
}

export function originPattern(hostname: string): string {
  return `https://${hostname}/*`;
}
