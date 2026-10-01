import type { NativeCustomization } from "../shared/models";

const CRITICAL_REGIONS = [
  "institution-header",
  "dashboard-tabs",
  "center-column",
  "dashboard-grid",
  "right-rail"
] as const;

interface CriticalSnapshot {
  element: HTMLElement;
  region: (typeof CRITICAL_REGIONS)[number];
  rect: DOMRect;
}

export interface NativeLayoutBaseline {
  critical: CriticalSnapshot[];
  renderedNavigation: HTMLElement[];
  viewportWidth: number;
}

function rendered(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
  );
}

export function captureNativeLayoutBaseline(document: Document): NativeLayoutBaseline {
  const critical: CriticalSnapshot[] = [];
  for (const region of CRITICAL_REGIONS) {
    for (const element of document.querySelectorAll<HTMLElement>(`[data-sc-region="${region}"]`)) {
      if (!rendered(element)) continue;
      critical.push({ element, region, rect: element.getBoundingClientRect() });
    }
  }
  const renderedNavigation = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-sc-region="institution-header"] a, [data-sc-region="institution-header"] button'
    )
  ].filter(rendered);
  return {
    critical,
    renderedNavigation,
    viewportWidth: document.defaultView?.innerWidth ?? 0
  };
}

function skipped(region: CriticalSnapshot["region"], customization: NativeCustomization): boolean {
  return region === "right-rail" && customization.hideRightRail;
}

export function validateNativeLayout(
  baseline: NativeLayoutBaseline,
  customization: NativeCustomization
): string[] {
  const issues: string[] = [];
  const current = new Map<CriticalSnapshot["region"], DOMRect[]>();
  for (const snapshot of baseline.critical) {
    if (skipped(snapshot.region, customization)) continue;
    if (!snapshot.element.isConnected || !rendered(snapshot.element)) {
      issues.push(`${snapshot.region} was hidden or collapsed`);
      continue;
    }
    const rect = snapshot.element.getBoundingClientRect();
    if (
      rect.width < Math.min(80, snapshot.rect.width * 0.35) ||
      rect.height < Math.min(24, snapshot.rect.height * 0.2)
    ) {
      issues.push(`${snapshot.region} became unusably small`);
      continue;
    }
    const viewportWidth = snapshot.element.ownerDocument.defaultView?.innerWidth ?? 0;
    if (
      snapshot.rect.left < baseline.viewportWidth &&
      (rect.right <= 0 || (viewportWidth > 0 && rect.left >= viewportWidth))
    ) {
      issues.push(`${snapshot.region} moved outside the viewport`);
      continue;
    }
    const entries = current.get(snapshot.region) ?? [];
    entries.push(rect);
    current.set(snapshot.region, entries);
  }

  for (const item of baseline.renderedNavigation) {
    if (!item.isConnected || !rendered(item)) {
      issues.push("a native header navigation item became hidden");
      break;
    }
  }

  const center = current.get("center-column")?.[0];
  const rail = current.get("right-rail")?.[0];
  if (center && rail && !customization.hideRightRail) {
    const width =
      baseline.critical[0]?.element.ownerDocument.defaultView?.innerWidth ?? baseline.viewportWidth;
    const gap = rail.left - center.right;
    const verticallySeparated = rail.top >= center.bottom - 8 || center.top >= rail.bottom - 8;
    if (!verticallySeparated) {
      if (rail.left < center.left || gap < -8) {
        issues.push("the dashboard center column overlaps the right rail");
      } else if (width > 0 && gap > Math.max(96, width * 0.12)) {
        issues.push("the dashboard center column separated from the right rail");
      }
    }
    const trailingGap = width - Math.max(center.right, rail.right);
    const baselineCenter = baseline.critical.find((item) => item.region === "center-column")?.rect;
    const baselineRail = baseline.critical.find((item) => item.region === "right-rail")?.rect;
    const baselineGap =
      baseline.viewportWidth - Math.max(baselineCenter?.right ?? 0, baselineRail?.right ?? 0);
    if (width > 0 && trailingGap > Math.max(baselineGap + 120, width * 0.25)) {
      issues.push("the themed home shell leaves an unsafe unused viewport gap");
    }
  }

  return [...new Set(issues)];
}
