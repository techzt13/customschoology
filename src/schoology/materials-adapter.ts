export interface MaterialEntry {
  container: HTMLElement;
  id: string;
  link: HTMLAnchorElement;
}

export const MATERIAL_CONTAINER_SELECTORS = [
  "[data-testid='material-item']",
  ".material-row",
  ".materials-list li"
] as const;

export function detectMaterialEntries(document: Document): MaterialEntry[] {
  const entries: MaterialEntry[] = [];
  const seen = new Set<string>();
  for (const selector of MATERIAL_CONTAINER_SELECTORS) {
    for (const container of document.querySelectorAll<HTMLElement>(selector)) {
      const link = container.querySelector<HTMLAnchorElement>(
        'a[href*="/assignment/"], a[href*="/assessment/"], a[href*="/materials/"]'
      );
      if (!link) continue;
      const url = new URL(link.href, location.href);
      const id = `${url.hostname}:${url.pathname}:${url.searchParams.get("id") ?? ""}`;
      if (seen.has(id)) continue;
      entries.push({ container, id, link });
      seen.add(id);
    }
  }
  return entries;
}
