import type { PageCapabilities } from "../shared/models";

const SCHOOLOGY_HOST = /(^|\.)schoology\.com$/i;

export function isLikelySchoology(document: Document, location: Location): boolean {
  if (SCHOOLOGY_HOST.test(location.hostname)) return true;
  const generator =
    document.querySelector<HTMLMetaElement>('meta[name="generator"]')?.content ?? "";
  const schoologyLinks = document.querySelectorAll('a[href*="/home"], a[href*="/courses/"]').length;
  return /schoology/i.test(generator) || schoologyLinks >= 2;
}

export function classifyPage(pathname: string): PageCapabilities["pageKind"] {
  if (/\/grades(?:\/|$)/i.test(pathname)) return "grades";
  if (/\/materials(?:\/|$)/i.test(pathname)) return "materials";
  if (/\/course(?:s)?\//i.test(pathname)) return "course";
  if (/\/(?:home|recent-activity|upcoming)(?:\/|$)/i.test(pathname) || pathname === "/") {
    return "home";
  }
  return "unknown";
}

export function originPattern(hostname: string): string {
  return `https://${hostname}/*`;
}
