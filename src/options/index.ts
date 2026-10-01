import { element } from "../shared/dom";
import {
  DEFAULT_SETTINGS,
  type Density,
  type NativeCustomization,
  type NativePresetId,
  type NativeThemeTokens,
  type Settings,
  type ThemeCompatibilityReport,
  type ThemePreset
} from "../shared/models";
import {
  exportLocalData,
  importLocalData,
  loadSettings,
  loadThemeCompatibility,
  mutateSettings
} from "../shared/storage";
import { originPattern } from "../schoology/url";
import { REGION_LABELS } from "../schoology/customization/selectors";
import {
  effectiveNativeTokens,
  NATIVE_THEME_TOKEN_LABELS,
  resetNativeSetting,
  resetNativeToken,
  resolveForeground,
  tokenContrastDiagnostic
} from "../schoology/customization/native-theme";
import { evaluateGradeScenario } from "../domain/grade-planning";
import type { GradeScenario } from "../shared/models";
import {
  applyNativePreset,
  nativeCustomizationMatchesPreset,
  NATIVE_THEME_PRESETS,
  presetContrastMatrix,
  presetPassesContrast,
  type PresetCategory
} from "../schoology/customization/presets";

const appNode = document.querySelector<HTMLElement>("#app");
if (!appNode) throw new Error("Settings application root is missing.");
const app: HTMLElement = appNode;
let gradeUndoSnapshot: GradeScenario[] | null = null;

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
    "Style extension-owned settings, popup, and Today surfaces. Native Schoology shell presets are configured separately below."
  );

  node.append(
    selectField<ThemePreset>(
      "Extension controls theme",
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
  let previewCustomization: NativeCustomization | null = null;

  const preview = element("div", { className: "sc-native-preview" });
  preview.setAttribute("aria-label", "Live Schoology customization preview");
  preview.tabIndex = -1;
  const previewHeader = element("div", { className: "sc-native-preview-header" });
  previewHeader.append(
    element("strong", { text: "Institution Schoology" }),
    element("button", { text: "Profile" })
  );
  const previewTabs = element("div", { className: "sc-native-preview-tabs" });
  previewTabs.append(
    element("a", { className: "is-active", text: "Course Dashboard" }),
    element("a", { text: "Recent Activity" })
  );
  const previewLayout = element("div", { className: "sc-native-preview-layout" });
  const previewRail = element("div", {
    className: "sc-native-preview-rail sc-native-preview-left",
    text: "Courses"
  });
  const previewCard = element("div", { className: "sc-native-preview-card" });
  const previewLink = element("a", { text: "Upcoming assignment" });
  previewLink.href = "#native";
  previewCard.append(
    element("strong", { text: "Course dashboard" }),
    previewLink,
    element("button", { text: "Open course" }),
    element("span", { className: "sc-native-preview-status", text: "Submitted (preserved)" })
  );
  const previewRight = element("div", {
    className: "sc-native-preview-rail sc-native-preview-right",
    text: "To Do · Quiz Friday"
  });
  previewLayout.append(previewRail, previewCard, previewRight);
  preview.append(previewHeader, previewTabs, previewLayout);

  const contrastNote = element("p", { className: "sc-contrast-summary" });
  contrastNote.setAttribute("role", "status");
  const diagnostics = new Map<keyof NativeThemeTokens, HTMLElement>();
  let presetState: HTMLElement | null = null;

  const updatePreview = (): void => {
    const active = previewCustomization ?? current;
    const tokens = effectiveNativeTokens(active);
    const foreground = (requested: string, background: string, threshold = 4.5): string =>
      resolveForeground(
        requested,
        background,
        active.contrastMode,
        [tokens.primaryText, tokens.mutedText, tokens.link, tokens.headerText],
        threshold
      ).resolved;
    preview.dataset.contrastMode = active.contrastMode;
    preview.dataset.layout = active.layoutStyle;
    preview.dataset.tabs = active.tabTreatment;
    preview.dataset.cards = active.cardTreatment;
    preview.dataset.rails = active.railTreatment;
    preview.style.setProperty("--preview-bg", tokens.pageBackground);
    preview.style.setProperty("--preview-surface", tokens.primarySurface);
    preview.style.setProperty("--preview-elevated", tokens.elevatedSurface);
    preview.style.setProperty(
      "--preview-text",
      foreground(tokens.primaryText, tokens.primarySurface)
    );
    preview.style.setProperty(
      "--preview-muted",
      foreground(tokens.mutedText, tokens.primarySurface)
    );
    preview.style.setProperty("--preview-accent", tokens.accent);
    preview.style.setProperty("--preview-header", tokens.headerBackground);
    preview.style.setProperty(
      "--preview-header-text",
      foreground(tokens.headerText, tokens.headerBackground)
    );
    preview.style.setProperty("--preview-left-rail", tokens.leftRail);
    preview.style.setProperty("--preview-right-rail", tokens.rightRail);
    preview.style.setProperty("--preview-control", tokens.control);
    preview.style.setProperty(
      "--preview-control-text",
      foreground(tokens.primaryText, tokens.control)
    );
    preview.style.setProperty("--preview-border", tokens.border);
    preview.style.setProperty("--preview-focus", tokens.focusRing);
    preview.style.setProperty("--preview-link", foreground(tokens.link, tokens.elevatedSurface));
    preview.style.setProperty(
      "--preview-active-tab",
      foreground(tokens.activeTab, tokens.primarySurface)
    );
    preview.style.setProperty(
      "--preview-inactive-tab",
      foreground(tokens.inactiveTab, tokens.primarySurface)
    );
    preview.style.setProperty(
      "--preview-font",
      active.font === "serif"
        ? "Georgia, serif"
        : active.font === "humanist"
          ? '"Trebuchet MS", system-ui, sans-serif'
          : active.font === "rounded"
            ? 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
            : active.font === "system"
              ? "system-ui, sans-serif"
              : "inherit"
    );
    preview.style.setProperty(
      "--preview-radius",
      active.corners === "round" ? "18px" : active.corners === "soft" ? "10px" : "4px"
    );
    preview.style.setProperty(
      "--preview-shadow",
      active.shadow === "elevated"
        ? "0 18px 40px rgb(20 28 45 / 18%)"
        : active.shadow === "subtle"
          ? "0 8px 24px rgb(20 28 45 / 12%)"
          : active.shadow === "crisp"
            ? "3px 3px 0 rgb(20 28 45 / 24%)"
            : "none"
    );
    preview.hidden = !active.enabled;
    let failures = 0;
    let substitutions = 0;
    for (const [key, output] of diagnostics) {
      const diagnostic = tokenContrastDiagnostic(active, key);
      if (!diagnostic.meets) failures += 1;
      if (diagnostic.requested !== diagnostic.resolved) substitutions += 1;
      output.dataset.warning = String(!diagnostic.meets);
      output.textContent =
        diagnostic.requested === diagnostic.resolved
          ? `${diagnostic.resolved} · ${diagnostic.ratio.toFixed(1)}:1`
          : `${diagnostic.requested} → ${diagnostic.resolved} · ${diagnostic.ratio.toFixed(1)}:1`;
    }
    contrastNote.dataset.warning = String(failures > 0);
    contrastNote.textContent =
      active.contrastMode === "automatic"
        ? `${substitutions} color${substitutions === 1 ? "" : "s"} visibly resolved to meet WCAG AA in this preview.`
        : active.contrastMode === "high-contrast"
          ? "The complete high-contrast preset is active; saved custom colors are retained for another mode."
          : failures > 0
            ? `${failures} strong contrast warning${failures === 1 ? "" : "s"}. Chosen colors are preserved and may be unreadable.`
            : "All reported semantic combinations meet their WCAG thresholds.";
    if (!previewCustomization && presetState) {
      const preset = NATIVE_THEME_PRESETS.find(({ id }) => id === current.presetId)!;
      presetState.textContent = nativeCustomizationMatchesPreset(current)
        ? `Applied preset: ${preset.name}`
        : `Applied preset: ${preset.name} · Customized`;
    }
  };

  const save = (next: NativeCustomization, confirmation: string): Promise<void> => {
    previewCustomization = null;
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

  const presetGallery = (): HTMLElement => {
    const wrapper = element("div", { className: "sc-preset-gallery sc-stack" });
    const activePreset = NATIVE_THEME_PRESETS.find(({ id }) => id === current.presetId)!;
    const state = element("p", {
      className: "sc-preset-state",
      text: nativeCustomizationMatchesPreset(current)
        ? `Applied preset: ${activePreset.name}`
        : `Applied preset: ${activePreset.name} · Customized`
    });
    presetState = state;
    state.setAttribute("aria-live", "polite");

    const filters = element("div", { className: "sc-preset-filters" });
    filters.setAttribute("aria-label", "Filter visual presets");
    const fieldset = element("fieldset", { className: "sc-preset-fieldset" });
    fieldset.append(element("legend", { className: "sc-visually-hidden", text: "Visual presets" }));
    const grid = element("div", { className: "sc-preset-grid" });
    const categories: Array<"All" | PresetCategory> = [
      "All",
      "Light",
      "Dark",
      "High contrast",
      "Expressive",
      "Productivity"
    ];
    const filterButtons: HTMLButtonElement[] = [];
    const cards = new Map<NativePresetId, HTMLElement>();
    let selected = current.presetId;

    const applyFilter = (category: "All" | PresetCategory): void => {
      for (const preset of NATIVE_THEME_PRESETS) {
        const card = cards.get(preset.id);
        if (card) card.hidden = category !== "All" && !preset.categories.includes(category);
      }
      for (const button of filterButtons) {
        button.setAttribute("aria-pressed", String(button.dataset.category === category));
      }
    };

    for (const category of categories) {
      const button = element("button", { className: "sc-button-secondary", text: category });
      button.type = "button";
      button.dataset.category = category;
      button.setAttribute("aria-pressed", String(category === "All"));
      button.addEventListener("click", () => applyFilter(category));
      filterButtons.push(button);
      filters.append(button);
    }

    for (const preset of NATIVE_THEME_PRESETS) {
      const card = element("label", { className: "sc-preset-card" });
      card.dataset.categories = preset.categories.join(" ");
      const radio = element("input");
      radio.type = "radio";
      radio.name = "native-preset";
      radio.value = preset.id;
      radio.checked = preset.id === selected;
      radio.addEventListener("change", () => {
        selected = preset.id;
        state.textContent = `Selected preset: ${preset.name}. Choose Preview or Apply.`;
      });
      const miniature = element("span", { className: "sc-preset-miniature" });
      const tokens = preset.snapshot.tokens;
      miniature.style.setProperty("--preset-page", tokens.pageBackground);
      miniature.style.setProperty("--preset-header", tokens.headerBackground);
      miniature.style.setProperty("--preset-surface", tokens.primarySurface);
      miniature.style.setProperty("--preset-card", tokens.elevatedSurface);
      miniature.style.setProperty("--preset-left", tokens.leftRail);
      miniature.style.setProperty("--preset-right", tokens.rightRail);
      miniature.style.setProperty("--preset-accent", tokens.accent);
      miniature.append(
        element("span", { className: "sc-preset-mini-header" }),
        element("span", { className: "sc-preset-mini-tabs" }),
        element("span", { className: "sc-preset-mini-left" }),
        element("span", { className: "sc-preset-mini-card" }),
        element("span", { className: "sc-preset-mini-right" })
      );
      const matrix = presetContrastMatrix(preset);
      const minimum = Math.min(...matrix.map(({ ratio }) => ratio));
      const badge = element("span", {
        className: "sc-preset-pass",
        text: presetPassesContrast(preset)
          ? `AA pass · min ${minimum.toFixed(1)}:1`
          : "Needs review"
      });
      card.append(
        radio,
        miniature,
        element("strong", { text: preset.name }),
        element("span", { className: "sc-muted", text: preset.description }),
        badge
      );
      cards.set(preset.id, card);
      grid.append(card);
    }
    fieldset.append(grid);

    const actions = element("div", { className: "sc-cluster" });
    const previewButton = element("button", {
      className: "sc-button-secondary",
      text: "Preview without saving"
    });
    previewButton.type = "button";
    previewButton.addEventListener("click", () => {
      previewCustomization = applyNativePreset(current, selected);
      updatePreview();
      state.textContent = `Previewing ${NATIVE_THEME_PRESETS.find(({ id }) => id === selected)!.name}; not saved.`;
      preview.focus();
    });
    const applyButton = element("button", { text: "Apply selected preset" });
    applyButton.type = "button";
    applyButton.addEventListener("click", () => {
      const preset = NATIVE_THEME_PRESETS.find(({ id }) => id === selected)!;
      void save(applyNativePreset(current, selected), `${preset.name} preset applied.`).then(
        render
      );
    });
    const cancelButton = element("button", {
      className: "sc-button-secondary",
      text: "Cancel preview"
    });
    cancelButton.type = "button";
    cancelButton.addEventListener("click", () => {
      previewCustomization = null;
      updatePreview();
      state.textContent = nativeCustomizationMatchesPreset(current)
        ? `Applied preset: ${activePreset.name}`
        : `Applied preset: ${activePreset.name} · Customized`;
    });
    actions.append(previewButton, applyButton, cancelButton);
    wrapper.append(
      element("h3", { text: "Visual preset gallery" }),
      element("p", {
        className: "sc-muted",
        text: "Each immutable preset is a complete, prevalidated shell design. Arrow keys move between visible radio choices; preview does not save."
      }),
      state,
      filters,
      fieldset,
      actions
    );
    return wrapper;
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

  const colorControl = (key: keyof NativeThemeTokens): HTMLElement => {
    const wrapper = element("div", { className: "sc-native-token" });
    const label = element("label", { text: NATIVE_THEME_TOKEN_LABELS[key] });
    const input = element("input");
    input.type = "color";
    input.id = `native-token-${key}`;
    label.htmlFor = input.id;
    input.value = current.tokens[key];
    const diagnostic = element("small", { className: "sc-token-diagnostic" });
    diagnostic.setAttribute("aria-live", "polite");
    diagnostics.set(key, diagnostic);
    const reset = element("button", { className: "sc-button-secondary", text: "Reset" });
    reset.type = "button";
    reset.setAttribute("aria-label", `Reset ${NATIVE_THEME_TOKEN_LABELS[key]}`);
    reset.addEventListener("click", () => {
      const next = resetNativeToken(current, key);
      input.value = next.tokens[key];
      void save(next, `${NATIVE_THEME_TOKEN_LABELS[key]} reset.`);
    });
    input.addEventListener("input", () => {
      void save(
        { ...current, tokens: { ...current.tokens, [key]: input.value } },
        `${NATIVE_THEME_TOKEN_LABELS[key]} saved.`
      );
    });
    wrapper.append(label, input, diagnostic, reset);
    return wrapper;
  };

  const selectControl = <
    K extends
      | "cardTreatment"
      | "contrastMode"
      | "controlStyle"
      | "density"
      | "font"
      | "contentWidth"
      | "corners"
      | "layoutStyle"
      | "motionIntensity"
      | "navigationTreatment"
      | "railTreatment"
      | "shadow"
      | "tabTreatment"
  >(
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

  const visibilityControl = (
    key: "hideLeftRail" | "hideRightRail" | "hideFooter",
    label: string
  ): HTMLElement => {
    const input = element("input");
    input.type = "checkbox";
    input.checked = current[key];
    input.addEventListener("change", () => {
      void save(
        { ...current, [key]: input.checked, visibilityControlsVersion: 1 },
        `${label} saved.`
      ).then(render);
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

  const resetColors = element("button", {
    className: "sc-button-secondary",
    text: "Reset semantic colors"
  });
  resetColors.type = "button";
  resetColors.addEventListener("click", () => {
    void save(
      { ...current, tokens: structuredClone(DEFAULT_SETTINGS.nativeCustomization.tokens) },
      "Semantic colors reset."
    ).then(render);
  });

  const resetLayout = element("button", {
    className: "sc-button-secondary",
    text: "Reset layout and visibility"
  });

  const hiddenSections = [
    current.hideLeftRail ? "left rail" : "",
    current.hideRightRail ? "right / To Do rail" : "",
    current.hideFooter ? "footer" : "",
    Object.values(settings.coursePreferences).some(({ hidden }) => hidden)
      ? "one or more dashboard course cards"
      : ""
  ].filter(Boolean);
  const hiddenIndicator = element("p", {
    className: hiddenSections.length ? "sc-message sc-compatibility-warning" : "sc-message",
    text: hiddenSections.length
      ? `Hidden Schoology sections: ${hiddenSections.join(", ")}. These choices are separate from visual presets.`
      : "All recognized Schoology sections are visible."
  });
  const restoreSections = element("button", {
    className: "sc-button-primary",
    text: "Restore all Schoology sections"
  });
  restoreSections.type = "button";
  restoreSections.disabled = hiddenSections.length === 0;
  restoreSections.addEventListener("click", () => {
    void mutateSettings({ kind: "RESTORE_VISIBILITY" })
      .then(() => {
        announce("All recognized Schoology sections and dashboard cards restored.");
      })
      .then(render)
      .catch((error: unknown) => {
        announce(
          error instanceof Error ? error.message : "Could not restore Schoology sections.",
          true
        );
      });
  });
  resetLayout.type = "button";
  resetLayout.addEventListener("click", () => {
    const defaults = DEFAULT_SETTINGS.nativeCustomization;
    void save(
      {
        ...current,
        cardTreatment: defaults.cardTreatment,
        contentWidth: defaults.contentWidth,
        controlStyle: defaults.controlStyle,
        corners: defaults.corners,
        density: defaults.density,
        font: defaults.font,
        hideFooter: defaults.hideFooter,
        hideLeftRail: defaults.hideLeftRail,
        hideRightRail: defaults.hideRightRail,
        layoutStyle: defaults.layoutStyle,
        motionIntensity: defaults.motionIntensity,
        navigationTreatment: defaults.navigationTreatment,
        railTreatment: defaults.railTreatment,
        shadow: defaults.shadow,
        tabTreatment: defaults.tabTreatment
      },
      "Layout and visibility reset."
    ).then(render);
  });

  node.append(
    row("enabled", "Customize native Schoology pages", enabled),
    selectControl("contrastMode", "Contrast mode", [
      ["automatic", "Automatic WCAG AA (recommended)"],
      ["preserve", "Preserve chosen colors with warnings"],
      ["high-contrast", "High contrast"],
      ["manual", "Manual advanced"]
    ]),
    presetGallery(),
    preview,
    contrastNote,
    ...(Object.keys(NATIVE_THEME_TOKEN_LABELS) as Array<keyof NativeThemeTokens>).map(colorControl),
    selectControl("font", "System font family", [
      ["native", "Schoology default"],
      ["system", "System"],
      ["humanist", "Humanist"],
      ["rounded", "Rounded"],
      ["serif", "Serif"]
    ]),
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
      ["subtle", "Subtle"],
      ["elevated", "Elevated"],
      ["crisp", "Crisp offset"]
    ]),
    selectControl("density", "Native information density", [
      ["comfortable", "Comfortable"],
      ["compact", "Compact"]
    ]),
    selectControl("layoutStyle", "Layout style", [
      ["minimal-flat", "Minimal flat"],
      ["soft-elevated", "Soft elevated"],
      ["outlined", "Outlined"],
      ["glass", "Glass-like (no blur)"],
      ["editorial", "Editorial"],
      ["dense-productivity", "Dense productivity"]
    ]),
    selectControl("navigationTreatment", "Navigation treatment", [
      ["solid", "Solid"],
      ["floating", "Floating"],
      ["minimal", "Minimal"]
    ]),
    selectControl("tabTreatment", "Tab treatment", [
      ["underline", "Underline"],
      ["segmented", "Segmented"],
      ["pills", "Pills"]
    ]),
    selectControl("railTreatment", "Rail treatment", [
      ["flat", "Flat"],
      ["cards", "Section cards"],
      ["outlined", "Outlined"]
    ]),
    selectControl("cardTreatment", "Course card treatment", [
      ["flat", "Flat"],
      ["elevated", "Elevated"],
      ["outlined", "Outlined"],
      ["image-forward", "Image forward"]
    ]),
    selectControl("controlStyle", "Control style", [
      ["solid", "Solid"],
      ["soft", "Soft"],
      ["outlined", "Outlined"],
      ["compact", "Compact"]
    ]),
    selectControl("motionIntensity", "Motion intensity", [
      ["none", "None"],
      ["subtle", "Subtle"],
      ["expressive", "Expressive"]
    ]),
    hiddenIndicator,
    restoreSections,
    visibilityControl("hideLeftRail", "Hide left rail when detected"),
    visibilityControl("hideRightRail", "Hide right rail when detected"),
    visibilityControl("hideFooter", "Hide footer when detected"),
    element("div", { className: "sc-cluster" }),
    resetAll
  );
  const resetCluster = node.querySelector<HTMLElement>(".sc-cluster:last-of-type");
  resetCluster?.append(resetColors, resetLayout);
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
  const wrapper = element("div", { className: "sc-stack" });
  const node = section(
    "courses",
    "Courses",
    "Courses appear here after they are detected in upcoming work. Nicknames and colors stay private."
  );
  wrapper.append(node);
  const courses = Object.entries(settings.coursePreferences);
  if (courses.length === 0) {
    node.append(
      element("p", {
        className: "sc-message",
        text: "No courses detected yet. Visit a Schoology page with upcoming work, then return here."
      })
    );
    wrapper.append(gradeStudioSection(settings));
    return wrapper;
  }

  function gradeStudioSection(settings: Settings): HTMLElement {
    const node = section(
      "grades",
      "Grade scenario studio",
      "Create local, read-only points-based scenarios. Official Schoology grades are never edited."
    );
    node.append(
      element("p", {
        className: "sc-message",
        text: "Weighted categories, dropped grades, and extra credit are shown as unsupported until their rules are verified."
      })
    );

    const form = element("form", { className: "sc-grade-form" });
    const input = (
      name: string,
      labelText: string,
      value: string,
      options: { max?: string; min?: string; step?: string; type?: string } = {}
    ): HTMLInputElement => {
      const field = element("div", { className: "sc-field" });
      const label = element("label", { text: labelText });
      const control = element("input");
      control.name = name;
      control.id = `grade-${name}`;
      control.type = options.type ?? "number";
      control.value = value;
      if (options.min) control.min = options.min;
      if (options.max) control.max = options.max;
      if (options.step) control.step = options.step;
      control.required = true;
      label.htmlFor = control.id;
      field.append(label, control);
      form.append(field);
      return control;
    };
    const name = input("name", "Scenario name", "", { type: "text" });
    name.maxLength = 80;
    const currentEarned = input("current-earned", "Current points earned", "0", {
      min: "0",
      step: "0.01"
    });
    const currentPossible = input("current-possible", "Current points possible", "100", {
      min: "0.01",
      step: "0.01"
    });
    const hypotheticalEarned = input("hypothetical-earned", "Hypothetical score", "0", {
      min: "0",
      step: "0.01"
    });
    const hypotheticalPossible = input(
      "hypothetical-possible",
      "Hypothetical points possible",
      "100",
      { min: "0.01", step: "0.01" }
    );
    const target = input("target", "Target percentage", "90", {
      max: "100",
      min: "0",
      step: "0.1"
    });
    const ruleField = element("div", { className: "sc-field" });
    const ruleLabel = element("label", { text: "Gradebook rule" });
    const rule = element("select");
    rule.id = "grade-rule";
    ruleLabel.htmlFor = rule.id;
    const gradeRules: Array<[GradeScenario["rule"], string]> = [
      ["points", "Total points"],
      ["weighted", "Weighted categories (unsupported)"],
      ["dropped", "Dropped grades (unsupported)"],
      ["extra-credit", "Extra credit (unsupported)"]
    ];
    for (const [value, text] of gradeRules) {
      const option = element("option", { text });
      option.value = value;
      rule.append(option);
    }
    ruleField.append(ruleLabel, rule);
    form.append(ruleField);
    const add = element("button", { text: "Add scenario" });
    add.type = "submit";
    form.append(add);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const scenario: GradeScenario = {
        currentEarned: Number(currentEarned.value),
        currentPossible: Number(currentPossible.value),
        hypotheticalEarned: Number(hypotheticalEarned.value),
        hypotheticalPossible: Number(hypotheticalPossible.value),
        id: crypto.randomUUID(),
        name: name.value.trim(),
        rule: rule.value as GradeScenario["rule"],
        targetPercent: Number(target.value)
      };
      gradeUndoSnapshot = settings.gradeScenarios;
      void mutateSettings({
        kind: "SET_GRADE_SCENARIOS",
        scenarios: [...settings.gradeScenarios, scenario]
      }).then(render);
    });
    node.append(form);

    const actions = element("div", { className: "sc-cluster" });
    const undo = element("button", { className: "sc-button-secondary", text: "Undo last change" });
    undo.type = "button";
    undo.disabled = gradeUndoSnapshot === null;
    undo.addEventListener("click", () => {
      if (!gradeUndoSnapshot) return;
      const snapshot = gradeUndoSnapshot;
      gradeUndoSnapshot = settings.gradeScenarios;
      void mutateSettings({ kind: "SET_GRADE_SCENARIOS", scenarios: snapshot }).then(render);
    });
    const reset = element("button", { className: "sc-button-danger", text: "Reset all scenarios" });
    reset.type = "button";
    reset.disabled = settings.gradeScenarios.length === 0;
    reset.addEventListener("click", () => {
      gradeUndoSnapshot = settings.gradeScenarios;
      void mutateSettings({ kind: "SET_GRADE_SCENARIOS", scenarios: [] }).then(render);
    });
    actions.append(undo, reset);
    node.append(actions);

    const list = element("div", { className: "sc-grade-scenarios" });
    for (const scenario of settings.gradeScenarios) {
      const result = evaluateGradeScenario(scenario);
      const card = element("article", { className: "sc-card sc-stack" });
      card.append(element("h3", { text: scenario.name }));
      if (result.status === "unsupported") {
        card.append(element("p", { className: "sc-message", text: result.explanation }));
      } else {
        const projected = result.projectedPercent?.toFixed(2) ?? "Unavailable";
        const current = result.currentPercent?.toFixed(2) ?? "Unavailable";
        card.append(
          element("p", {
            text: `Current ${current}% · Projected ${projected}% · Change ${result.comparisonPoints?.toFixed(2) ?? "—"} points`
          }),
          element("p", {
            text:
              result.neededScore === null
                ? "Needed score unavailable."
                : result.neededScore <= 0
                  ? "The target is already met before the hypothetical item."
                  : result.neededScore > scenario.hypotheticalPossible
                    ? `Target would require ${result.neededScore.toFixed(2)} of ${scenario.hypotheticalPossible} points and is not reachable with this item alone.`
                    : `Score needed for ${scenario.targetPercent}%: ${result.neededScore.toFixed(2)} of ${scenario.hypotheticalPossible} points.`
          }),
          element("p", { className: "sc-muted", text: result.explanation })
        );
      }
      const remove = element("button", { className: "sc-button-danger", text: "Delete scenario" });
      remove.type = "button";
      remove.addEventListener("click", () => {
        gradeUndoSnapshot = settings.gradeScenarios;
        void mutateSettings({
          kind: "SET_GRADE_SCENARIOS",
          scenarios: settings.gradeScenarios.filter(({ id }) => id !== scenario.id)
        }).then(render);
      });
      card.append(remove);
      list.append(card);
    }
    node.append(list);
    return node;
  }

  for (const [courseId, preference] of courses) {
    let currentPreference = preference;
    const saveCourse = (
      changes: Partial<typeof preference>,
      confirmation: string
    ): Promise<void> => {
      currentPreference = { ...currentPreference, ...changes };
      return mutateSettings({
        courseId,
        kind: "SET_COURSE",
        preference: currentPreference
      }).then(() => {
        announce(confirmation);
      });
    };
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
      void saveCourse({ nickname: nextNickname }, `${nextNickname} saved.`);
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
      void saveCourse({ accent: color.value }, `${currentPreference.nickname} color saved.`);
    });
    colorField.append(colorLabel, color);

    const favoriteLabel = element("label", { className: "sc-check" });
    const favorite = element("input");
    favorite.type = "checkbox";
    favorite.checked = preference.favorite;
    favorite.addEventListener("change", () => {
      void saveCourse({ favorite: favorite.checked }, "Course favorite saved.");
    });
    favoriteLabel.append(favorite, element("span", { text: "Favorite course" }));

    const hiddenLabel = element("label", { className: "sc-check" });
    const hidden = element("input");
    hidden.type = "checkbox";
    hidden.checked = preference.hidden;
    hidden.addEventListener("change", () => {
      void saveCourse(
        { hidden: hidden.checked, visibilityControlsVersion: 1 },
        "Dashboard visibility saved."
      ).then(render);
    });
    hiddenLabel.append(hidden, element("span", { text: "Hide detected dashboard card" }));

    const orderField = element("div", { className: "sc-field" });
    const orderLabel = element("label", { text: "Dashboard order" });
    const order = element("input");
    order.type = "number";
    order.min = "0";
    order.max = "999";
    order.value = String(preference.order);
    orderLabel.htmlFor = `${nicknameId}-order`;
    order.id = `${nicknameId}-order`;
    order.addEventListener("change", () => {
      void saveCourse({ order: Number(order.value) }, "Dashboard order saved.");
    });
    orderField.append(orderLabel, order);

    const quickLabelField = element("div", { className: "sc-field" });
    const quickLabel = element("input");
    quickLabel.maxLength = 40;
    quickLabel.placeholder = "Quick link label";
    quickLabel.value = preference.quickLinks[0]?.label ?? "";
    const quickLabelText = element("label", { text: "Quick link label" });
    quickLabelText.htmlFor = `${nicknameId}-quick-label`;
    quickLabel.id = `${nicknameId}-quick-label`;
    quickLabelField.append(quickLabelText, quickLabel);

    const quickUrlField = element("div", { className: "sc-field" });
    const quickUrl = element("input");
    quickUrl.type = "url";
    quickUrl.placeholder = "https://…";
    quickUrl.value = preference.quickLinks[0]?.url ?? "";
    const quickUrlLabel = element("label", { text: "Quick link URL" });
    quickUrlLabel.htmlFor = `${nicknameId}-quick-url`;
    quickUrl.id = `${nicknameId}-quick-url`;
    quickUrlField.append(quickUrlLabel, quickUrl);
    const saveQuickLink = (): void => {
      const label = quickLabel.value.trim();
      const url = quickUrl.value.trim();
      const quickLinks =
        label && url ? [{ label, url }, ...currentPreference.quickLinks.slice(1)] : [];
      void saveCourse({ quickLinks }, "Course quick link saved.");
    };
    quickLabel.addEventListener("change", saveQuickLink);
    quickUrl.addEventListener("change", saveQuickLink);

    row.append(
      nicknameField,
      colorField,
      favoriteLabel,
      hiddenLabel,
      orderField,
      quickLabelField,
      quickUrlField
    );
    node.append(row);
  }
  wrapper.append(gradeStudioSection(settings));
  return wrapper;
}

function domainsSection(
  settings: Settings,
  compatibility: ThemeCompatibilityReport | null
): HTMLElement {
  const node = section(
    "compatibility",
    "Compatibility and themed regions",
    "See exactly what the extension recognized on the most recently visited Schoology page. Unknown regions remain native."
  );
  node.append(
    element("p", {
      className: "sc-message",
      text: "Status: Experimental. Automated implementation checks pass; manual real-Schoology sign-off is still needed for institution-specific layouts, 200% zoom, assistive technology, and observer performance."
    })
  );
  if (!compatibility) {
    node.append(
      element("p", {
        className: "sc-message",
        text: "No page-region report is available yet. Visit a supported Schoology page, then return here."
      })
    );
  } else {
    if (compatibility.layoutWarning) {
      node.append(
        element("p", {
          className: "sc-message sc-compatibility-warning",
          text: compatibility.layoutWarning
        })
      );
    }
    const grid = element("div", { className: "sc-compatibility-grid" });
    const reportList = (title: string, items: string[], tone = ""): HTMLElement => {
      const card = element("div", { className: `sc-card sc-stack ${tone}`.trim() });
      card.append(element("h3", { text: title }));
      const list = element("ul");
      for (const item of items) list.append(element("li", { text: item }));
      card.append(list);
      return card;
    };
    grid.append(
      reportList(
        "Detected and themed",
        compatibility.themed.length
          ? compatibility.themed.map(
              (region) => `${REGION_LABELS[region]} (${compatibility.detected[region] ?? 0})`
            )
          : ["No recognizable theme regions detected."]
      ),
      reportList("Preserved as native", compatibility.nativePreserved),
      reportList(
        "Unsupported on this page",
        compatibility.unsupported.length
          ? compatibility.unsupported
          : ["All expected shell regions were recognized."],
        compatibility.unsupported.length ? "sc-compatibility-warning" : ""
      )
    );
    node.append(
      grid,
      element("p", {
        className: "sc-muted",
        text: `Last updated ${new Date(compatibility.updatedAt).toLocaleString()}.`
      })
    );
  }

  const referenceRows: Array<[string, string, string, string]> = [
    [
      "Page routing",
      "Available",
      "Pinned home, course, materials, grades, and assessment route adapters",
      "Explicit route capabilities replace broad pathname guesses"
    ],
    [
      "Home shell and To Do rail",
      "Experimental",
      "Verified wrapper/center/right-rail adapters with layout rollback",
      "Unknown layouts keep native structure and report unsupported regions"
    ],
    [
      "Dashboard cards",
      "Experimental",
      "Scoped sgy-card and semantic fallback adapters",
      "Images and official status semantics remain native"
    ],
    [
      "Visual themes",
      "Available",
      "20 local semantic presets with contrast matrices",
      "No remote assets, fonts, theme marketplace, or telemetry"
    ],
    [
      "Grade planning",
      "Experimental",
      "Separate read-only points-based scenario studio",
      "Never rewrites official grades; unsupported rules are explicit"
    ],
    [
      "API-key and analytics features",
      "Unsupported",
      "Intentionally not implemented",
      "Local-only design avoids credentials and tracking"
    ]
  ];
  const matrix = element("table", { className: "sc-compatibility-table" });
  const head = element("thead");
  const headRow = element("tr");
  for (const heading of ["Referenced capability", "Our status", "Implementation", "Difference"]) {
    headRow.append(element("th", { text: heading }));
  }
  head.append(headRow);
  const body = element("tbody");
  for (const row of referenceRows) {
    const tableRow = element("tr");
    for (const value of row) tableRow.append(element("td", { text: value }));
    body.append(tableRow);
  }
  matrix.append(head, body);
  node.append(
    element("h3", { text: "SchoologyPlus compatibility reference" }),
    element("p", {
      className: "sc-muted",
      text: "Compared with MIT-licensed SchoologyPlus at pinned commit 85e2e869. Status is evidence-based and does not imply complete real-site parity."
    }),
    matrix,
    element("h3", { text: "Custom-domain access" }),
    element("p", {
      className: "sc-muted",
      text: "Custom Schoology domains are enabled only after you grant access from the toolbar popup."
    })
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
  const [settings, compatibility] = await Promise.all([loadSettings(), loadThemeCompatibility()]);
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
    ["#grades", "Grade scenarios"],
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
    domainsSection(settings, compatibility),
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
