import { element } from "../shared/dom";
import {
  DEFAULT_SETTINGS,
  type Density,
  type NativeCustomization,
  type Settings,
  type ThemePreset
} from "../shared/models";
import { exportLocalData, importLocalData, loadSettings, mutateSettings } from "../shared/storage";
import { originPattern } from "../schoology/url";
import {
  contrastRatio,
  resetNativeSetting,
  safeTextColor
} from "../schoology/customization/native-theme";

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

function nativeCustomizationSection(settings: Settings): HTMLElement {
  const node = section(
    "native",
    "Schoology page",
    "Restyle supported native Schoology regions without replacing or rewriting their content."
  );
  let current = settings.nativeCustomization;

  const preview = element("div", { className: "sc-native-preview" });
  preview.setAttribute("aria-label", "Live Schoology customization preview");
  const previewHeader = element("div", {
    className: "sc-native-preview-header",
    text: "Schoology"
  });
  const previewLayout = element("div", { className: "sc-native-preview-layout" });
  const previewRail = element("div", { className: "sc-native-preview-rail", text: "Courses" });
  const previewCard = element("div", { className: "sc-native-preview-card" });
  const previewLink = element("a", { text: "Upcoming assignment" });
  previewLink.href = "#native";
  previewCard.append(
    element("strong", { text: "Course dashboard" }),
    previewLink,
    element("button", { text: "Open course" })
  );
  previewLayout.append(previewRail, previewCard);
  preview.append(previewHeader, previewLayout);

  const contrastNote = element("p", { className: "sc-muted" });
  contrastNote.setAttribute("role", "status");

  const updatePreview = (): void => {
    preview.style.setProperty("--preview-bg", current.background);
    preview.style.setProperty("--preview-surface", current.surface);
    preview.style.setProperty("--preview-text", safeTextColor(current.text, current.surface));
    preview.style.setProperty("--preview-accent", settings.accent);
    preview.style.setProperty("--preview-link", safeTextColor(settings.accent, current.surface));
    preview.style.setProperty(
      "--preview-font",
      current.font === "serif"
        ? "Georgia, serif"
        : current.font === "humanist"
          ? '"Trebuchet MS", system-ui, sans-serif'
          : current.font === "rounded"
            ? 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
            : "system-ui, sans-serif"
    );
    preview.style.setProperty(
      "--preview-radius",
      current.corners === "round" ? "18px" : current.corners === "soft" ? "10px" : "4px"
    );
    preview.style.setProperty("--preview-scale", String(current.fontScale));
    preview.style.setProperty(
      "--preview-shadow",
      current.shadow === "subtle" ? "0 8px 24px rgb(20 28 45 / 12%)" : "none"
    );
    preview.hidden = !current.enabled;
    const ratio = contrastRatio(current.text, current.surface);
    contrastNote.textContent =
      ratio >= 4.5
        ? `Text contrast ${ratio.toFixed(1)}:1 meets the readability safeguard.`
        : `Requested text contrast is ${ratio.toFixed(1)}:1; Schoology will use a safer black or white text color.`;
  };

  const save = (next: NativeCustomization, confirmation: string): Promise<void> => {
    current = next;
    updatePreview();
    return mutateSettings({ customization: next, kind: "SET_NATIVE" })
      .then(() => {
        announce(confirmation);
      })
      .catch((error: unknown) => {
        announce(error instanceof Error ? error.message : "Could not save customization.", true);
      });
  };

  const resetButton = <K extends keyof NativeCustomization>(key: K): HTMLButtonElement => {
    const button = element("button", { className: "sc-button-secondary", text: "Reset" });
    button.type = "button";
    button.setAttribute("aria-label", `Reset ${key}`);
    button.addEventListener("click", () => {
      void save(resetNativeSetting(current, key), `${key} reset.`).then(render);
    });
    return button;
  };

  const row = <K extends keyof NativeCustomization>(
    key: K,
    labelText: string,
    control: HTMLElement
  ): HTMLElement => {
    const wrapper = element("div", { className: "sc-native-setting" });
    const label = element("label", { text: labelText });
    const id = `native-${String(key)}`;
    label.htmlFor = id;
    control.id = id;
    wrapper.append(label, control, resetButton(key));
    return wrapper;
  };

  const enabled = element("input");
  enabled.type = "checkbox";
  enabled.checked = current.enabled;
  enabled.addEventListener("change", () => {
    void save({ ...current, enabled: enabled.checked }, "Native Schoology customization saved.");
  });

  const colorControl = (
    key: "background" | "surface" | "text" | "border",
    label: string
  ): HTMLElement => {
    const input = element("input");
    input.type = "color";
    input.value = current[key];
    input.addEventListener("input", () => {
      void save({ ...current, [key]: input.value }, `${label} saved.`);
    });
    return row(key, label, input);
  };

  const selectControl = <K extends "font" | "contentWidth" | "corners" | "shadow">(
    key: K,
    label: string,
    values: Array<[NativeCustomization[K], string]>
  ): HTMLElement => {
    const select = element("select");
    for (const [value, text] of values) {
      const option = element("option", { text });
      option.value = String(value);
      option.selected = value === current[key];
      select.append(option);
    }
    select.addEventListener("change", () => {
      void save({ ...current, [key]: select.value as NativeCustomization[K] }, `${label} saved.`);
    });
    return row(key, label, select);
  };

  const scale = element("input");
  scale.type = "range";
  scale.min = "0.9";
  scale.max = "1.2";
  scale.step = "0.05";
  scale.value = String(current.fontScale);
  scale.addEventListener("input", () => {
    void save({ ...current, fontScale: Number(scale.value) }, "Typography scale saved.");
  });

  const visibilityControl = (
    key: "hideLeftRail" | "hideRightRail" | "hideFooter",
    label: string
  ): HTMLElement => {
    const input = element("input");
    input.type = "checkbox";
    input.checked = current[key];
    input.addEventListener("change", () => {
      void save({ ...current, [key]: input.checked }, `${label} saved.`);
    });
    return row(key, label, input);
  };

  const resetAll = element("button", {
    className: "sc-button-danger",
    text: "Reset all Schoology page styling"
  });
  resetAll.type = "button";
  resetAll.addEventListener("click", () => {
    void save(
      structuredClone(DEFAULT_SETTINGS.nativeCustomization),
      "Schoology page styling reset."
    ).then(render);
  });

  node.append(
    row("enabled", "Customize native Schoology pages", enabled),
    preview,
    contrastNote,
    colorControl("background", "Page background"),
    colorControl("surface", "Content surface"),
    colorControl("text", "Text color"),
    colorControl("border", "Border color"),
    selectControl("font", "System font family", [
      ["system", "System"],
      ["humanist", "Humanist"],
      ["rounded", "Rounded"],
      ["serif", "Serif"]
    ]),
    row("fontScale", "Typography scale", scale),
    selectControl("contentWidth", "Content width", [
      ["default", "Schoology default"],
      ["focused", "Focused"],
      ["wide", "Wide"]
    ]),
    selectControl("corners", "Corners", [
      ["schoology", "Schoology default"],
      ["soft", "Soft"],
      ["round", "Rounded"]
    ]),
    selectControl("shadow", "Surface shadows", [
      ["none", "None"],
      ["subtle", "Subtle"]
    ]),
    visibilityControl("hideLeftRail", "Hide left rail when detected"),
    visibilityControl("hideRightRail", "Hide right rail when detected"),
    visibilityControl("hideFooter", "Hide footer when detected"),
    resetAll
  );
  updatePreview();
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
    ["#native", "Schoology page"],
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
    nativeCustomizationSection(settings),
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
