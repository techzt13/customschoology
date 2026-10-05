import type { NativeCustomization, NativeThemeTokens } from "../shared/models";
import {
  AUTHORED_READING_LINK,
  AUTHORED_READING_TEXT,
  effectiveNativeTokens
} from "../schoology/customization/native-theme";

type Rgba = [number, number, number, number];

const THEMED_TARGETS = "[data-sc-region] [data-sc-theme-role]";
const AUTHORED_TARGETS =
  '[data-sc-region="authored-content"], [data-sc-region="authored-content"] :is(a, button, p, li, dd, dt, blockquote, figcaption, h1, h2, h3, h4, h5, h6, label, span, div, td, th)';
const EXCLUDED_SEMANTICS =
  "[class*='status' i], [class*='grade' i], [data-status], [data-grade], [aria-label*='status' i], [aria-label*='grade' i], [data-sc-preserve], iframe";
const MAX_TARGETS = 1_200;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, value));
}

export function parseCssColor(value: string): Rgba | null {
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("#") && /^#[0-9a-f]{6}$/i.test(normalized)) {
    return [
      Number.parseInt(normalized.slice(1, 3), 16),
      Number.parseInt(normalized.slice(3, 5), 16),
      Number.parseInt(normalized.slice(5, 7), 16),
      1
    ];
  }
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
  if (element.matches("button, [role='button'], [role='tab'], input, select")) return 3;
  const pixels = Number.parseFloat(style.fontSize);
  const weight = Number.parseInt(style.fontWeight, 10) || 400;
  return pixels >= 24 || (pixels >= 18.66 && weight >= 700) ? 3 : 4.5;
}

function candidatesFor(element: HTMLElement, tokens: NativeThemeTokens): string[] {
  if (element.closest('[data-sc-region="authored-content"]')) {
    return [
      element.matches("a") ? AUTHORED_READING_LINK : AUTHORED_READING_TEXT,
      AUTHORED_READING_TEXT,
      AUTHORED_READING_LINK,
      "#000000",
      "#ffffff"
    ];
  }
  const role = element.dataset.scThemeRole;
  const region = element.closest<HTMLElement>("[data-sc-region]")?.dataset.scRegion;
  const requested =
    role === "link"
      ? tokens.link
      : role === "tab-active"
        ? tokens.activeTab
        : role === "tab-inactive"
          ? tokens.inactiveTab
          : region === "institution-header"
            ? tokens.headerText
            : tokens.primaryText;
  return [
    requested,
    tokens.primaryText,
    tokens.mutedText,
    tokens.link,
    tokens.headerText,
    "#000000",
    "#ffffff"
  ];
}

function correctionFor(element: HTMLElement, tokens: NativeThemeTokens): string | null {
  if (!element.textContent?.trim() || element.closest(EXCLUDED_SEMANTICS)) return null;
  const style = getComputedStyle(element);
  const foreground = parseCssColor(style.color);
  if (!foreground) return null;
  const background = effectiveBackground(element);
  const minimum = minimumContrast(element, style);
  if (renderedContrast(foreground, background) >= minimum) return null;
  const candidates = candidatesFor(element, tokens)
    .map((candidate) => ({
      candidate,
      color: parseCssColor(candidate),
      ratio: parseCssColor(candidate) ? renderedContrast(parseCssColor(candidate)!, background) : 0
    }))
    .filter(
      (candidate): candidate is { candidate: string; color: Rgba; ratio: number } =>
        candidate.color !== null
    )
    .sort((left, right) => right.ratio - left.ratio);
  return (candidates.find(({ ratio }) => ratio >= minimum) ?? candidates[0])?.candidate ?? null;
}

export class NativeContrastAnnotator {
  readonly #observer = new MutationObserver(() => this.#schedule());
  readonly #tracked = new Set<HTMLElement>();
  #customization: NativeCustomization | null = null;
  #automaticSemantic = false;
  #root: HTMLElement | null = null;
  #timer: number | undefined;

  update(customization: NativeCustomization): void {
    this.disable();
    const hasAuthoredContent = document.querySelector(AUTHORED_TARGETS) !== null;
    this.#automaticSemantic = customization.contrastMode === "automatic";
    if (!this.#automaticSemantic && !hasAuthoredContent) return;
    this.#customization = customization;
    this.#root = document.documentElement;
    this.#observer.observe(this.#root, {
      attributeFilter: ["aria-selected", "aria-current"],
      attributes: true,
      childList: true,
      subtree: true
    });
    this.#schedule(0);
  }

  disable(): void {
    this.#observer.disconnect();
    window.clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#customization = null;
    this.#automaticSemantic = false;
    this.#root = null;
    for (const element of this.#tracked) {
      element.classList.remove("sc-native-auto-contrast");
      element.style.removeProperty("--sc-native-auto-fg");
    }
    this.#tracked.clear();
  }

  annotateNow(): void {
    if (!this.#customization || !this.#root) return;
    const tokens = effectiveNativeTokens(this.#customization);
    const selector = this.#automaticSemantic
      ? `${THEMED_TARGETS}, ${AUTHORED_TARGETS}`
      : AUTHORED_TARGETS;
    const candidates = [...new Set(document.querySelectorAll<HTMLElement>(selector))].slice(
      0,
      MAX_TARGETS
    );
    for (const element of candidates) {
      if (this.#tracked.has(element)) {
        element.classList.remove("sc-native-auto-contrast");
        element.style.removeProperty("--sc-native-auto-fg");
      }
      const correction = correctionFor(element, tokens);
      if (correction) {
        element.style.setProperty("--sc-native-auto-fg", correction);
        element.classList.add("sc-native-auto-contrast");
        this.#tracked.add(element);
      } else {
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
