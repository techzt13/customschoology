import {
  detectSelectorSupport,
  SCHOOLOGY_SELECTORS,
  type SelectorGroup
} from "../schoology/customization/selectors";

type Rgba = [number, number, number, number];

const REGION_GROUPS: SelectorGroup[] = [
  "header",
  "content",
  "surfaces",
  "courseCards",
  "leftRail",
  "rightRail"
];
const TEXT_TARGETS =
  "a, button, [role='button'], [role='tab'], h1, h2, h3, h4, h5, h6, label, th, td, p, li, span";
const EXCLUDED_SEMANTICS =
  "[class*='status' i], [class*='grade' i], [data-status], [data-grade], [aria-label*='status' i], [aria-label*='grade' i]";
const MAX_REGIONS = 40;
const MAX_TARGETS = 600;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, value));
}

export function parseCssColor(value: string): Rgba | null {
  const normalized = value.trim().toLowerCase();
  if (
    (!normalized.startsWith("rgb(") && !normalized.startsWith("rgba(")) ||
    !normalized.endsWith(")")
  ) {
    return null;
  }
  const parts = normalized
    .slice(normalized.indexOf("(") + 1, -1)
    .replace("/", " ")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.some((part) => !Number.isFinite(part))) return null;
  return [
    clampChannel(parts[0]!),
    clampChannel(parts[1]!),
    clampChannel(parts[2]!),
    Math.min(1, Math.max(0, parts[3] ?? 1))
  ];
}

function composite(foreground: Rgba, background: Rgba): Rgba {
  const alpha = foreground[3] + background[3] * (1 - foreground[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  return [
    (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
    alpha
  ];
}

export function effectiveBackground(element: Element): Rgba {
  let result: Rgba = [0, 0, 0, 0];
  let current: Element | null = element;
  while (current) {
    const layer = parseCssColor(getComputedStyle(current).backgroundColor);
    if (layer) result = composite(result, layer);
    if (result[3] >= 0.999) break;
    current = current.parentElement;
  }
  return result[3] < 0.999 ? composite(result, [255, 255, 255, 1]) : result;
}

function relativeLuminance(color: Rgba): number {
  const channels = color.slice(0, 3).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function renderedContrast(foreground: Rgba, background: Rgba): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function minimumContrast(element: HTMLElement, style: CSSStyleDeclaration): number {
  const role = element.getAttribute("role");
  if (
    element.matches("button, [role='button'], [role='tab'], input, select") ||
    role === "button" ||
    role === "tab"
  ) {
    return 3;
  }
  const pixels = Number.parseFloat(style.fontSize);
  const weight = Number.parseInt(style.fontWeight, 10) || 400;
  return pixels >= 24 || (pixels >= 18.66 && weight >= 700) ? 3 : 4.5;
}

function correctionFor(element: HTMLElement): string | null {
  if (!element.textContent?.trim() || element.closest(EXCLUDED_SEMANTICS)) return null;
  const style = getComputedStyle(element);
  const foreground = parseCssColor(style.color);
  if (!foreground) return null;
  const background = effectiveBackground(element);
  if (renderedContrast(foreground, background) >= minimumContrast(element, style)) return null;
  const black: Rgba = [0, 0, 0, 1];
  const white: Rgba = [255, 255, 255, 1];
  return renderedContrast(black, background) >= renderedContrast(white, background)
    ? "rgb(0 0 0)"
    : "rgb(255 255 255)";
}

function detectedRegions(document: Document): HTMLElement[] {
  const support = detectSelectorSupport(document);
  const regions: HTMLElement[] = [];
  for (const group of REGION_GROUPS) {
    if (!support.has(group)) continue;
    for (const selector of SCHOOLOGY_SELECTORS[group]) {
      for (const node of document.querySelectorAll<HTMLElement>(selector)) {
        if (!regions.includes(node)) regions.push(node);
        if (regions.length >= MAX_REGIONS) return regions;
      }
    }
  }
  return regions;
}

export class NativeContrastAnnotator {
  readonly #observer = new MutationObserver(() => this.#schedule());
  readonly #tracked = new Set<HTMLElement>();
  #regions: HTMLElement[] = [];
  #timer: number | undefined;

  update(): void {
    this.disable();
    this.#regions = detectedRegions(document);
    if (this.#regions.length === 0) return;
    for (const region of this.#regions) {
      this.#observer.observe(region, { childList: true, subtree: true });
    }
    this.#schedule(0);
  }

  disable(): void {
    this.#observer.disconnect();
    window.clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#regions = [];
    for (const element of this.#tracked) {
      element.classList.remove("sc-native-auto-contrast");
      element.style.removeProperty("--sc-native-auto-fg");
    }
    this.#tracked.clear();
  }

  annotateNow(): void {
    const candidates = new Set<HTMLElement>();
    for (const region of this.#regions) {
      if (region.matches(TEXT_TARGETS)) candidates.add(region);
      for (const element of region.querySelectorAll<HTMLElement>(TEXT_TARGETS)) {
        candidates.add(element);
        if (candidates.size >= MAX_TARGETS) break;
      }
      if (candidates.size >= MAX_TARGETS) break;
    }

    for (const element of candidates) {
      const correction = correctionFor(element);
      if (correction) {
        element.style.setProperty("--sc-native-auto-fg", correction);
        element.classList.add("sc-native-auto-contrast");
        this.#tracked.add(element);
      } else if (this.#tracked.has(element)) {
        element.classList.remove("sc-native-auto-contrast");
        element.style.removeProperty("--sc-native-auto-fg");
        this.#tracked.delete(element);
      }
    }
  }

  #schedule(delay = 80): void {
    window.clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      this.#timer = undefined;
      this.annotateNow();
    }, delay);
  }
}
