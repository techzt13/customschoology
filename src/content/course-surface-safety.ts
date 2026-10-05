import { effectiveBackground, parseCssColor, renderedContrast } from "./native-contrast";

const ROLLBACK_ATTRIBUTE = "data-sc-course-surface-rollback";
const EXCLUDED =
  "[class*='status' i], [class*='grade' i], [data-status], [data-grade], [aria-label*='status' i], [aria-label*='grade' i], [data-sc-preserve], iframe";
const READABLE =
  "a, button, p, li, dd, dt, blockquote, figcaption, h1, h2, h3, h4, h5, h6, label, span, td, th";

interface CourseSurfaceSnapshot {
  background: string;
  color: string;
  element: HTMLElement;
  linkColor: string;
  wasRendered: boolean;
}

export interface CourseSurfaceBaseline {
  entries: CourseSurfaceSnapshot[];
}

function rgbaCss([red, green, blue, alpha]: [number, number, number, number]): string {
  return `rgb(${Math.round(red)} ${Math.round(green)} ${Math.round(blue)} / ${alpha})`;
}

function rendered(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
  );
}

export function captureCourseSurfaceBaseline(document: Document): CourseSurfaceBaseline {
  return {
    entries: [...document.querySelectorAll<HTMLElement>('[data-sc-region="authored-content"]')].map(
      (element) => {
        const link = element.querySelector<HTMLElement>("a");
        return {
          background: rgbaCss(effectiveBackground(element)),
          color: element.style.color || getComputedStyle(element).color,
          element,
          linkColor: link ? getComputedStyle(link).color : getComputedStyle(element).color,
          wasRendered: rendered(element)
        };
      }
    )
  };
}

function minimumContrast(element: HTMLElement): number {
  if (element.matches("button, [role='button'], input, select")) return 3;
  const style = getComputedStyle(element);
  const pixels = Number.parseFloat(style.fontSize);
  const weight = Number.parseInt(style.fontWeight, 10) || 400;
  return pixels >= 24 || (pixels >= 18.66 && weight >= 700) ? 3 : 4.5;
}

export function validateCourseSurfaces(
  baseline: CourseSurfaceBaseline,
  document: Document
): string[] {
  const issues: string[] = [];
  const main = document.querySelector<HTMLElement>('[data-sc-region="course-main"]');
  if (main && (!rendered(main) || main.getBoundingClientRect().width < 240)) {
    issues.push("the course reading surface became hidden or unusably narrow");
  }

  for (const { element, wasRendered } of baseline.entries) {
    if (!wasRendered) continue;
    if (!element.isConnected || !rendered(element)) {
      issues.push("an authored content surface became hidden or collapsed");
      continue;
    }
    if (element.scrollWidth > element.clientWidth + 24) {
      issues.push("authored content overflows its reading surface");
    }
    for (const candidate of [element, ...element.querySelectorAll<HTMLElement>(READABLE)].slice(
      0,
      800
    )) {
      if (!rendered(candidate) || !candidate.textContent?.trim() || candidate.closest(EXCLUDED)) {
        continue;
      }
      const foreground = parseCssColor(getComputedStyle(candidate).color);
      if (!foreground) continue;
      const ratio = renderedContrast(foreground, effectiveBackground(candidate));
      if (ratio + 0.01 < minimumContrast(candidate)) {
        issues.push("authored content contains unreadable foreground/background pairs");
        break;
      }
    }
  }
  return [...new Set(issues)];
}

export function rollbackCourseSurfaces(baseline: CourseSurfaceBaseline): void {
  for (const entry of baseline.entries) {
    if (!entry.wasRendered || !entry.element.isConnected) continue;
    entry.element.setAttribute(ROLLBACK_ATTRIBUTE, "");
    entry.element.style.setProperty("--sc-course-native-bg", entry.background);
    entry.element.style.setProperty("--sc-course-native-fg", entry.color);
    entry.element.style.setProperty("--sc-course-native-link", entry.linkColor);
  }
}

export function clearCourseSurfaceRollbacks(document: Document): void {
  for (const element of document.querySelectorAll<HTMLElement>(`[${ROLLBACK_ATTRIBUTE}]`)) {
    element.removeAttribute(ROLLBACK_ATTRIBUTE);
    element.style.removeProperty("--sc-course-native-bg");
    element.style.removeProperty("--sc-course-native-fg");
    element.style.removeProperty("--sc-course-native-link");
  }
}
