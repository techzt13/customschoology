import { element } from "../shared/dom";
import type { Assignment, PageSnapshot, Settings } from "../shared/models";
import { loadSettings, mutateSettings } from "../shared/storage";
import { extractUpcoming } from "../schoology/upcoming-adapter";

const HOST_ID = "schoology-companion-root";

function formattedDueDate(value?: string): string {
  if (!value) return "No due date shown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function sortedAssignments(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((left, right) => {
    if (!left.dueAt) return 1;
    if (!right.dueAt) return -1;
    return Date.parse(left.dueAt) - Date.parse(right.dueAt);
  });
}

export class TodayPanel {
  readonly #host: HTMLDivElement;
  readonly #root: ShadowRoot;
  #dialog: HTMLDivElement | null = null;
  #settings: Settings | null = null;
  #snapshot: PageSnapshot;

  constructor(snapshot: PageSnapshot) {
    this.#snapshot = snapshot;
    this.#host = element("div");
    this.#host.id = HOST_ID;
    this.#root = this.#host.attachShadow({ mode: "open" });

    const stylesheet = element("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = chrome.runtime.getURL("assets/styles.css");
    this.#root.append(stylesheet);
    document.body.append(this.#host);
  }

  async initialize(): Promise<void> {
    this.#settings = await loadSettings();
    this.#host.dataset.theme = this.#settings.theme;
    this.#host.dataset.density = this.#settings.density;
    this.#host.style.setProperty("--sc-accent", this.#settings.accent);
    const detectedCourses = new Map(
      this.#snapshot.assignments
        .filter(
          (assignment): assignment is Assignment & { courseId: string } =>
            typeof assignment.courseId === "string"
        )
        .map((assignment) => [assignment.courseId, assignment.courseName])
    );
    const missingCourses = [...detectedCourses].filter(
      ([courseId]) => !this.#settings?.coursePreferences[courseId]
    );
    if (missingCourses.length > 0) {
      this.#settings = await mutateSettings({
        courses: Object.fromEntries(
          missingCourses.map(([courseId, courseName]) => [
            courseId,
            { accent: this.#settings!.accent, nickname: courseName }
          ])
        ),
        kind: "ADD_COURSES"
      });
    }
    if (!this.#settings.panelEnabled) return;
    this.#renderLauncher();
  }

  open(): void {
    if (this.#dialog) {
      this.#dialog.hidden = false;
      this.#dialog.querySelector<HTMLButtonElement>(".sc-panel-close")?.focus();
      return;
    }

    this.#dialog = element("div", { className: "sc-panel" });
    this.#dialog.setAttribute("role", "dialog");
    this.#dialog.setAttribute("aria-modal", "false");
    this.#dialog.setAttribute("aria-labelledby", "sc-panel-title");
    this.#dialog.style.setProperty("--sc-accent", this.#settings?.accent ?? "#5b4ee4");

    const header = element("header", { className: "sc-panel-header" });
    const headingWrap = element("div");
    headingWrap.append(
      element("p", { className: "sc-eyebrow", text: "Local workspace" }),
      element("h2", { text: "Today" })
    );
    headingWrap.querySelector("h2")!.id = "sc-panel-title";

    const close = element("button", {
      className: "sc-button-secondary sc-panel-close",
      text: "Close"
    });
    close.type = "button";
    close.addEventListener("click", () => this.close());
    header.append(headingWrap, close);

    const intro = element("p", {
      className: "sc-muted",
      text: "Official Schoology status and your private completion list are kept separate."
    });
    const list = element("div", { className: "sc-assignment-list" });
    list.setAttribute("role", "list");

    if (this.#snapshot.assignments.length === 0) {
      list.append(
        element("div", {
          className: "sc-message",
          text: "No upcoming assignments were detected on this page. Schoology remains unchanged."
        })
      );
    } else {
      for (const assignment of sortedAssignments(this.#snapshot.assignments)) {
        list.append(this.#renderAssignment(assignment));
      }
    }

    this.#dialog.append(header, intro, list);
    this.#dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.close();
    });
    this.#root.append(this.#dialog);
    close.focus();
  }

  close(): void {
    if (!this.#dialog) return;
    this.#dialog.hidden = true;
    this.#root.querySelector<HTMLButtonElement>(".sc-launcher")?.focus();
  }

  refresh(): void {
    this.#snapshot = extractUpcoming(document, location);
    if (this.#dialog && !this.#dialog.hidden) {
      this.#dialog.remove();
      this.#dialog = null;
      this.open();
    }
  }

  #renderLauncher(): void {
    const button = element("button", { className: "sc-launcher", text: "Today" });
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Open Today panel, ${this.#snapshot.assignments.length} assignments detected`
    );
    button.addEventListener("click", () => this.open());
    this.#root.append(button);
  }

  #renderAssignment(assignment: Assignment): HTMLElement {
    const item = element("article", { className: "sc-assignment" });
    item.setAttribute("role", "listitem");
    const preference = assignment.courseId
      ? this.#settings?.coursePreferences[assignment.courseId]
      : undefined;
    if (preference) item.style.borderInlineStart = `5px solid ${preference.accent}`;

    const link = element("a", { className: "sc-assignment-title", text: assignment.title });
    link.href = assignment.url;
    link.target = "_self";

    const metadata = element("p", {
      className: "sc-muted",
      text: `${preference?.nickname || assignment.courseName} · ${formattedDueDate(assignment.dueAt)}`
    });

    const status = element("span", {
      className: "sc-status",
      text:
        assignment.officialStatus === "unknown"
          ? "Official status unavailable"
          : `Schoology: ${assignment.officialStatus}`
    });
    if (assignment.officialStatus === "submitted") status.dataset.tone = "success";
    if (assignment.officialStatus === "late" || assignment.officialStatus === "missing") {
      status.dataset.tone = "warning";
    }

    const completion = element("label", { className: "sc-check" });
    const checkbox = element("input");
    checkbox.type = "checkbox";
    checkbox.checked = this.#settings?.manualCompletions[assignment.id] === true;
    const completionText = element("span", { text: "Done in my private plan" });
    checkbox.addEventListener("change", () => {
      void this.#setCompletion(assignment.id, checkbox.checked, completionText);
    });
    completion.append(checkbox, completionText);

    item.append(link, metadata, status, completion);
    return item;
  }

  async #setCompletion(id: string, completed: boolean, status: HTMLElement): Promise<void> {
    status.textContent = "Saving…";
    try {
      this.#settings = await mutateSettings({ completed, id, kind: "SET_COMPLETION" });
      status.textContent = "Done in my private plan";
    } catch {
      status.textContent = "Could not save private completion";
    }
  }
}

export function existingTodayHost(): HTMLElement | null {
  return document.getElementById(HOST_ID);
}
