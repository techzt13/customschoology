import type { Settings } from "../shared/models";
import { SCHOOLOGY_SELECTORS } from "../schoology/customization/selectors";

const CARD_CLASS = "sc-course-workspace-card";
const LINKS_CLASS = "sc-course-quick-links";
const ORIGINAL_STYLES = new WeakMap<
  HTMLElement,
  Record<"border-inline-start" | "display" | "order", { priority: string; value: string }>
>();

function courseId(card: HTMLElement): string | null {
  const link = card.querySelector<HTMLAnchorElement>('a[href*="/course"]');
  if (!link) return null;
  return new URL(link.href, location.href).pathname.match(/\/courses?\/(\d+)/i)?.[1] ?? null;
}

function resetCard(card: HTMLElement): void {
  if (!card.classList.contains(CARD_CLASS)) return;
  const original = ORIGINAL_STYLES.get(card);
  card.classList.remove(CARD_CLASS);
  card.style.removeProperty("--sc-course-accent");
  for (const property of ["border-inline-start", "display", "order"] as const) {
    const saved = original?.[property];
    if (saved?.value) card.style.setProperty(property, saved.value, saved.priority);
    else card.style.removeProperty(property);
  }
  card.removeAttribute("data-sc-favorite");
  card.querySelector(`.${LINKS_CLASS}`)?.remove();
}

export function applyCourseWorkspace(settings: Settings): void {
  const detected = new Set<HTMLElement>();
  for (const selector of SCHOOLOGY_SELECTORS.courseCards) {
    for (const card of document.querySelectorAll<HTMLElement>(selector)) detected.add(card);
  }

  for (const card of document.querySelectorAll<HTMLElement>(`.${CARD_CLASS}`)) {
    if (!detected.has(card)) resetCard(card);
  }

  for (const card of detected) {
    const id = courseId(card);
    const preference = id ? settings.coursePreferences[id] : undefined;
    if (!preference) {
      resetCard(card);
      continue;
    }

    if (!ORIGINAL_STYLES.has(card)) {
      ORIGINAL_STYLES.set(card, {
        "border-inline-start": {
          priority: card.style.getPropertyPriority("border-inline-start"),
          value: card.style.getPropertyValue("border-inline-start")
        },
        display: {
          priority: card.style.getPropertyPriority("display"),
          value: card.style.getPropertyValue("display")
        },
        order: {
          priority: card.style.getPropertyPriority("order"),
          value: card.style.getPropertyValue("order")
        }
      });
    }
    card.classList.add(CARD_CLASS);
    card.style.setProperty("--sc-course-accent", preference.accent);
    card.style.borderInlineStart = `5px solid var(--sc-course-accent)`;
    card.style.order = String((preference.favorite ? 0 : 1000) + preference.order);
    card.dataset.scFavorite = String(preference.favorite);
    if (preference.hidden) card.style.display = "none";
    else {
      const originalDisplay = ORIGINAL_STYLES.get(card)?.display;
      if (originalDisplay?.value) {
        card.style.setProperty("display", originalDisplay.value, originalDisplay.priority);
      } else {
        card.style.removeProperty("display");
      }
    }

    const signature = JSON.stringify(preference.quickLinks);
    let links = card.querySelector<HTMLElement>(`.${LINKS_CLASS}`);
    if (preference.quickLinks.length === 0) {
      links?.remove();
      continue;
    }
    if (links?.dataset.signature === signature) continue;
    links?.remove();
    links = document.createElement("nav");
    links.className = LINKS_CLASS;
    links.dataset.signature = signature;
    links.setAttribute("aria-label", `${preference.nickname} quick links`);
    for (const quickLink of preference.quickLinks) {
      const anchor = document.createElement("a");
      anchor.href = quickLink.url;
      anchor.textContent = quickLink.label;
      anchor.rel = "noopener noreferrer";
      links.append(anchor);
    }
    card.append(links);
  }
}

export function removeCourseWorkspace(): void {
  for (const card of document.querySelectorAll<HTMLElement>(`.${CARD_CLASS}`)) resetCard(card);
}
