import type { Assignment, PageSnapshot } from "../shared/models";
import { classifyPage, isLikelySchoology } from "./url";

const ASSIGNMENT_PATH = /\/(?:assignment|assessment|event|materials\/item)\//i;
const CONTAINER_SELECTORS = [
  "[data-testid*='upcoming']",
  "[data-testid*='assignment']",
  "#upcoming-submissions",
  "#upcoming-events",
  ".upcoming-list",
  ".upcoming-events",
  ".reminders-wrapper",
  ".upcoming"
];

function nearestContainer(link: HTMLAnchorElement): Element {
  return link.closest("li, article, tr, [data-testid], .item, .upcoming-event") ?? link;
}

function textFrom(container: Element, selectors: string[]): string {
  for (const selector of selectors) {
    const value = container.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

function dueDate(container: Element): string | undefined {
  const datetime = container.querySelector<HTMLTimeElement>("time[datetime]")?.dateTime;
  if (datetime && !Number.isNaN(Date.parse(datetime))) return new Date(datetime).toISOString();

  const candidate = textFrom(container, [".due-date", "[data-testid*='due']", "time"]);
  if (!candidate) return undefined;
  const parsed = Date.parse(candidate.replace(/^due\s*:?\s*/i, ""));
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

function statusFrom(container: Element): Assignment["officialStatus"] {
  const status = [
    container.getAttribute("data-status"),
    container.getAttribute("aria-label"),
    container.className,
    container.textContent
  ]
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .toLowerCase();
  if (/\bsubmitted\b/.test(status)) return "submitted";
  if (/\bmissing\b/.test(status)) return "missing";
  if (/\blate\b/.test(status)) return "late";
  return "unknown";
}

function stableId(link: URL): string {
  const pathId = link.pathname.match(/\/(\d+)(?:\/|$)/)?.[1];
  return `${link.hostname}:${pathId ?? link.pathname}:${link.searchParams.get("id") ?? ""}`;
}

function candidateLinks(document: Document): HTMLAnchorElement[] {
  const scoped = CONTAINER_SELECTORS.flatMap((selector) =>
    [...document.querySelectorAll<HTMLAnchorElement>(`${selector} a[href]`)].filter((link) =>
      ASSIGNMENT_PATH.test(link.pathname)
    )
  );
  return scoped.length > 0
    ? scoped
    : [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].filter((link) =>
        ASSIGNMENT_PATH.test(link.pathname)
      );
}

export function extractUpcoming(document: Document, location: Location): PageSnapshot {
  const seen = new Set<string>();
  const assignments: Assignment[] = [];

  for (const link of candidateLinks(document)) {
    const url = new URL(link.href, location.href);
    const id = stableId(url);
    const title = link.textContent?.trim();
    if (!title || seen.has(id)) continue;

    const container = nearestContainer(link);
    const courseId = url.searchParams.get("section_id");
    const assignment: Assignment = {
      courseName:
        textFrom(container, [
          "[data-testid*='course']",
          ".course-title",
          ".course-name",
          ".realm-title"
        ]) || "Schoology",
      id,
      officialStatus: statusFrom(container),
      title,
      url: url.href
    };
    const dueAt = dueDate(container);
    if (courseId) assignment.courseId = courseId;
    if (dueAt) assignment.dueAt = dueAt;
    assignments.push(assignment);
    seen.add(id);
  }

  const pageKind = classifyPage(location.pathname);
  const supported = isLikelySchoology(document, location);
  return {
    assignments,
    capabilities: {
      assignmentCount: assignments.length,
      pageKind,
      supported
    },
    domain: location.hostname,
    url: location.href
  };
}
