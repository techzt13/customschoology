import { element } from "../shared/dom";
import type { PageSnapshot } from "../shared/models";
import type { RuntimeResponse } from "../shared/messages";
import { loadSettings, mutateSettings, normalizeDomain } from "../shared/storage";
import { originPattern } from "../schoology/url";

const appNode = document.querySelector<HTMLElement>("#app");
if (!appNode) throw new Error("Popup application root is missing.");
const app: HTMLElement = appNode;

function message(text: string, tone: "neutral" | "warning" = "neutral"): HTMLElement {
  const node = element("p", { className: "sc-message", text });
  if (tone === "warning") node.style.borderInlineStartColor = "var(--sc-warning)";
  return node;
}

async function activeTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

async function pageSnapshot(tabId: number): Promise<PageSnapshot | null> {
  try {
    const response: RuntimeResponse = await chrome.tabs.sendMessage(tabId, {
      type: "GET_PAGE_SNAPSHOT"
    });
    return response.ok ? (response.snapshot ?? null) : null;
  } catch {
    return null;
  }
}

async function enableDomain(domain: string, tabId: number): Promise<void> {
  const granted = await chrome.permissions.request({ origins: [originPattern(domain)] });
  if (!granted) throw new Error("Chrome did not grant access to this domain.");

  await mutateSettings({ domain, kind: "ADD_DOMAIN" });
  await chrome.runtime.sendMessage({ type: "REFRESH_DYNAMIC_SCRIPTS" });
  await chrome.scripting.executeScript({ files: ["assets/content.js"], target: { tabId } });
}

async function render(): Promise<void> {
  app.replaceChildren();
  app.className = "sc-popup sc-stack";
  app.setAttribute("aria-busy", "true");

  const settings = await loadSettings();
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.density = settings.density;
  document.documentElement.style.setProperty("--sc-accent", settings.accent);

  const heading = element("div");
  heading.append(
    element("p", { className: "sc-eyebrow", text: "Schoology Companion" }),
    element("h1", { text: "Your workspace" })
  );
  app.append(heading);

  const tab = await activeTab();
  if (!tab?.id || !tab.url) {
    app.append(message("Open a Schoology page to use this extension.", "warning"));
    app.setAttribute("aria-busy", "false");
    return;
  }

  const url = new URL(tab.url);
  const snapshot = await pageSnapshot(tab.id);
  if (snapshot?.capabilities.supported) {
    const status = element("span", {
      className: "sc-status",
      text: `${snapshot.capabilities.assignmentCount} assignments detected`
    });
    status.dataset.tone = "success";
    app.append(status);

    const openToday = element("button", { text: "Open Today panel" });
    openToday.type = "button";
    openToday.addEventListener("click", () => {
      void chrome.tabs
        .sendMessage(tab.id!, { type: "OPEN_TODAY_PANEL" })
        .then(() => window.close());
    });
    app.append(openToday);
  } else {
    const domain = normalizeDomain(url.hostname);
    const isWebPage = url.protocol === "https:" && domain !== null;
    if (isWebPage) {
      app.append(
        message(
          settings.enabledDomains.includes(domain)
            ? "This page does not look like a supported Schoology layout."
            : "If this is your school's Schoology site, enable access for this domain.",
          "warning"
        )
      );
      if (!settings.enabledDomains.includes(domain)) {
        const enable = element("button", { text: `Enable ${domain}` });
        enable.type = "button";
        enable.addEventListener("click", () => {
          enable.disabled = true;
          enable.textContent = "Requesting access…";
          void enableDomain(domain, tab.id!)
            .then(() => render())
            .catch((error: unknown) => {
              enable.disabled = false;
              enable.textContent = `Enable ${domain}`;
              app.append(
                message(
                  error instanceof Error ? error.message : "Could not enable this domain.",
                  "warning"
                )
              );
            });
        });
        app.append(enable);
      }
    } else {
      app.append(message("Open a Schoology page to use Today.", "warning"));
    }
  }

  const settingsButton = element("button", {
    className: "sc-button-secondary",
    text: "Customize and manage data"
  });
  settingsButton.type = "button";
  settingsButton.addEventListener("click", () => void chrome.runtime.openOptionsPage());
  app.append(settingsButton);
  app.setAttribute("aria-busy", "false");
}

void render().catch((error: unknown) => {
  app.setAttribute("aria-busy", "false");
  app.append(
    message(error instanceof Error ? error.message : "The popup could not load.", "warning")
  );
});
