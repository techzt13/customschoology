import { element } from "../shared/dom";
import { DEFAULT_SETTINGS, type Density, type Settings, type ThemePreset } from "../shared/models";
import { exportLocalData, importLocalData, loadSettings, mutateSettings } from "../shared/storage";
import { originPattern } from "../schoology/url";

const appNode = document.querySelector<HTMLElement>("#app");
if (!appNode) throw new Error("Settings application root is missing.");
const app: HTMLElement = appNode;

function applyAppearance(settings: Settings): void {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.density = settings.density;
  document.documentElement.style.setProperty("--sc-accent", settings.accent);
}

function announce(text: string, error = false): void {
  const region = document.querySelector<HTMLElement>("#sc-announcer");
  if (!region) return;
  region.textContent = text;
  region.dataset.error = String(error);
}

function section(id: string, title: string, description: string): HTMLElement {
  const node = element("section", { className: "sc-card sc-stack" });
  node.id = id;
  const heading = element("h2", { text: title });
  const copy = element("p", { className: "sc-muted", text: description });
  node.append(heading, copy);
  return node;
}

function selectField<T extends string>(
  label: string,
  value: T,
  options: Array<[T, string]>,
  onChange: (value: T) => void
): HTMLElement {
  const wrapper = element("div", { className: "sc-field" });
  const id = `field-${crypto.randomUUID()}`;
  const labelNode = element("label", { text: label });
  labelNode.htmlFor = id;
  const select = element("select");
  select.id = id;
  for (const [optionValue, optionLabel] of options) {
    const option = element("option", { text: optionLabel });
    option.value = optionValue;
    option.selected = optionValue === value;
    select.append(option);
  }
  select.addEventListener("change", () => onChange(select.value as T));
  wrapper.append(labelNode, select);
  return wrapper;
}

function download(name: string, contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = element("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function removeDomain(domain: string): Promise<void> {
  await chrome.permissions.remove({ origins: [originPattern(domain)] });
  await mutateSettings({ domain, kind: "REMOVE_DOMAIN" });
  await chrome.runtime.sendMessage({ type: "REFRESH_DYNAMIC_SCRIPTS" });
}

async function keepPermittedDomains(settings: Settings): Promise<Settings> {
  const checks = await Promise.all(
    settings.enabledDomains.map(async (domain) => ({
      allowed: await chrome.permissions.contains({ origins: [originPattern(domain)] }),
      domain
    }))
  );
  return {
    ...settings,
    enabledDomains: checks.filter(({ allowed }) => allowed).map(({ domain }) => domain)
  };
}

async function reconcileImportedDomains(settings: Settings): Promise<Settings> {
  const permitted = await keepPermittedDomains(settings);
  const current = await loadSettings();
  const removedDomains = current.enabledDomains.filter(
    (domain) => !permitted.enabledDomains.includes(domain)
  );
  await Promise.all(
    removedDomains.map((domain) => chrome.permissions.remove({ origins: [originPattern(domain)] }))
  );
  return permitted;
}

function appearanceSection(settings: Settings): HTMLElement {
  const node = section(
    "appearance",
    "Appearance",
    "Choose a calm starting point, then adjust density and accent. Contrast protections remain active."
  );

  node.append(
    selectField<ThemePreset>(
      "Visual preset",
      settings.theme,
      [
        ["system", "Follow system"],
        ["calm", "Calm"],
        ["contrast", "High contrast"],
        ["expressive", "Expressive"]
      ],
      (theme) => {
        void mutateSettings({ changes: { theme }, kind: "PATCH" }).then((next) => {
          applyAppearance(next);
          announce("Visual preset saved.");
        });
      }
    ),
    selectField<Density>(
      "Information density",
      settings.density,
      [
        ["comfortable", "Comfortable"],
        ["compact", "Compact"]
      ],
      (density) => {
        void mutateSettings({ changes: { density }, kind: "PATCH" }).then((next) => {
          applyAppearance(next);
          announce("Density saved.");
        });
      }
    )
  );

  const accentField = element("div", { className: "sc-field" });
  const accentLabel = element("label", { text: "Accent color" });
  accentLabel.htmlFor = "accent";
  const accent = element("input");
  accent.id = "accent";
  accent.type = "color";
  accent.value = settings.accent;
  accent.addEventListener("change", () => {
    void mutateSettings({ changes: { accent: accent.value }, kind: "PATCH" }).then((next) => {
      applyAppearance(next);
      announce("Accent color saved.");
    });
  });
  accentField.append(accentLabel, accent);
  node.append(accentField);
  return node;
}

function workflowSection(settings: Settings): HTMLElement {
  const node = section(
    "workflow",
    "Today workflow",
    "The Today panel reads the current page and stores your private completion choices locally."
  );
  const label = element("label", { className: "sc-check" });
  const enabled = element("input");
  enabled.type = "checkbox";
  enabled.checked = settings.panelEnabled;
  enabled.addEventListener("change", () => {
    void mutateSettings({
      changes: { panelEnabled: enabled.checked },
      kind: "PATCH"
    }).then(() => announce("Today panel preference saved. Reload Schoology to apply it."));
  });
  label.append(enabled, element("span", { text: "Show the Today launcher on supported pages" }));
  node.append(label);
  return node;
}

function coursesSection(settings: Settings): HTMLElement {
  const node = section(
    "courses",
    "Courses",
    "Courses appear here after they are detected in upcoming work. Nicknames and colors stay private."
  );
  const courses = Object.entries(settings.coursePreferences);
  if (courses.length === 0) {
    node.append(
      element("p", {
        className: "sc-message",
        text: "No courses detected yet. Visit a Schoology page with upcoming work, then return here."
      })
    );
    return node;
  }

  for (const [courseId, preference] of courses) {
    const row = element("div", { className: "sc-course-setting" });
    const nicknameField = element("div", { className: "sc-field" });
    const nicknameId = `course-${courseId.replaceAll(/[^a-z0-9-]/gi, "-")}`;
    const nicknameLabel = element("label", { text: "Course nickname" });
    nicknameLabel.htmlFor = nicknameId;
    const nickname = element("input");
    nickname.id = nicknameId;
    nickname.maxLength = 80;
    nickname.value = preference.nickname;
    nickname.addEventListener("change", () => {
      const nextNickname = nickname.value.trim() || preference.nickname;
      void mutateSettings({
        courseId,
        kind: "SET_COURSE",
        preference: { ...preference, nickname: nextNickname }
      }).then(() => announce(`${nextNickname} saved.`));
    });
    nicknameField.append(nicknameLabel, nickname);

    const colorField = element("div", { className: "sc-field" });
    const colorId = `${nicknameId}-color`;
    const colorLabel = element("label", { text: "Course color" });
    colorLabel.htmlFor = colorId;
    const color = element("input");
    color.id = colorId;
    color.type = "color";
    color.value = preference.accent;
    color.addEventListener("change", () => {
      void mutateSettings({
        courseId,
        kind: "SET_COURSE",
        preference: { ...preference, accent: color.value }
      }).then(() => announce(`${preference.nickname} color saved.`));
    });
    colorField.append(colorLabel, color);
    row.append(nicknameField, colorField);
    node.append(row);
  }
  return node;
}

function domainsSection(settings: Settings): HTMLElement {
  const node = section(
    "compatibility",
    "Compatibility",
    "Custom Schoology domains are enabled only after you grant access from the toolbar popup."
  );
  if (settings.enabledDomains.length === 0) {
    node.append(
      element("p", {
        className: "sc-message",
        text: "No custom domains are enabled. Standard schoology.com pages work automatically."
      })
    );
    return node;
  }

  const list = element("div", { className: "sc-stack" });
  for (const domain of settings.enabledDomains) {
    const row = element("div", { className: "sc-card sc-cluster" });
    const name = element("strong", { text: domain });
    const remove = element("button", { className: "sc-button-danger", text: "Revoke access" });
    remove.type = "button";
    remove.addEventListener("click", () => {
      remove.disabled = true;
      void removeDomain(domain)
        .then(() => render())
        .catch((error: unknown) => {
          remove.disabled = false;
          announce(error instanceof Error ? error.message : "Could not revoke access.", true);
        });
    });
    row.append(name, remove);
    list.append(row);
  }
  node.append(list);
  return node;
}

function privacySection(): HTMLElement {
  const node = section(
    "privacy",
    "Privacy and local data",
    "No analytics or remote telemetry are collected. Settings and completion choices stay in Chrome local storage."
  );
  const actions = element("div", { className: "sc-cluster" });
  const exportButton = element("button", { className: "sc-button-secondary", text: "Export data" });
  exportButton.type = "button";
  exportButton.addEventListener("click", () => {
    void exportLocalData().then((data) => {
      download("schoology-companion-settings.json", data);
      announce("Local data exported.");
    });
  });

  const importLabel = element("label", {
    className: "sc-button sc-button-secondary",
    text: "Import data"
  });
  const importInput = element("input");
  importInput.className = "sc-visually-hidden";
  importInput.type = "file";
  importInput.accept = "application/json,.json";
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (!file) return;
    void file
      .text()
      .then(importLocalData)
      .then(reconcileImportedDomains)
      .then((settings) => mutateSettings({ kind: "REPLACE", settings }))
      .then(() => chrome.runtime.sendMessage({ type: "REFRESH_DYNAMIC_SCRIPTS" }))
      .then(() => {
        announce("Local data imported.");
        return render();
      })
      .catch((error: unknown) =>
        announce(error instanceof Error ? error.message : "Import failed.", true)
      );
  });
  importLabel.append(importInput);

  const reset = element("button", { className: "sc-button-danger", text: "Delete all local data" });
  reset.type = "button";
  reset.addEventListener("click", () => {
    if (
      !window.confirm("Delete all Schoology Companion settings and private completion choices?")
    ) {
      return;
    }
    reset.disabled = true;
    void loadSettings()
      .then((settings) =>
        Promise.all(
          settings.enabledDomains.map((domain) =>
            chrome.permissions.remove({ origins: [originPattern(domain)] })
          )
        )
      )
      .then(() => mutateSettings({ kind: "REPLACE", settings: structuredClone(DEFAULT_SETTINGS) }))
      .then(() => chrome.runtime.sendMessage({ type: "REFRESH_DYNAMIC_SCRIPTS" }))
      .then(() => render())
      .then(() => announce("All local data was deleted and defaults restored."))
      .catch((error: unknown) =>
        announce(error instanceof Error ? error.message : "Could not delete local data.", true)
      );
  });

  actions.append(exportButton, importLabel, reset);
  node.append(actions);
  return node;
}

async function render(): Promise<void> {
  const settings = await loadSettings();
  applyAppearance(settings);
  app.replaceChildren();
  app.className = "sc-options";
  app.setAttribute("aria-busy", "false");

  const header = element("header", { className: "sc-stack" });
  header.append(
    element("p", { className: "sc-eyebrow", text: "Schoology Companion" }),
    element("h1", { text: "A workspace that feels like yours" }),
    element("p", {
      className: "sc-muted",
      text: "Customize the experience, review access, and control every piece of local data."
    })
  );

  const announcer = element("p", { className: "sc-message", text: "Settings are ready." });
  announcer.id = "sc-announcer";
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", "polite");

  const layout = element("div", { className: "sc-options-grid" });
  const nav = element("nav", { className: "sc-card sc-nav" });
  nav.setAttribute("aria-label", "Settings sections");
  const navigationLinks: Array<[string, string]> = [
    ["#appearance", "Appearance"],
    ["#workflow", "Today workflow"],
    ["#courses", "Courses"],
    ["#compatibility", "Compatibility"],
    ["#privacy", "Privacy and data"]
  ];
  for (const [href, label] of navigationLinks) {
    const link = element("a", { text: label });
    link.href = href;
    nav.append(link);
  }

  const content = element("div", { className: "sc-stack" });
  content.append(
    appearanceSection(settings),
    workflowSection(settings),
    coursesSection(settings),
    domainsSection(settings),
    privacySection()
  );
  layout.append(nav, content);
  app.append(header, announcer, layout);
}

void render().catch((error: unknown) => {
  app.setAttribute("aria-busy", "false");
  app.append(
    element("p", {
      className: "sc-message",
      text: error instanceof Error ? error.message : "Settings could not load."
    })
  );
});
