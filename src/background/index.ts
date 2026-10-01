import { isRuntimeMessage, type RuntimeResponse } from "../shared/messages";
import { applyMutation, loadSettings, saveSettings } from "../shared/storage";
import { originPattern } from "../schoology/url";

const DYNAMIC_SCRIPT_PREFIX = "schoology-companion-domain-";
let mutationQueue: Promise<void> = Promise.resolve();

function scriptId(domain: string): string {
  return `${DYNAMIC_SCRIPT_PREFIX}${domain.replaceAll(".", "-")}`;
}

async function refreshDynamicScripts(): Promise<void> {
  const existing = await chrome.scripting.getRegisteredContentScripts();
  const removable = existing
    .map(({ id }) => id)
    .filter((id) => id.startsWith(DYNAMIC_SCRIPT_PREFIX));
  if (removable.length > 0) await chrome.scripting.unregisterContentScripts({ ids: removable });

  const settings = await loadSettings();
  const candidates = settings.enabledDomains.filter((domain) => !domain.endsWith(".schoology.com"));
  const permissionChecks = await Promise.all(
    candidates.map(async (domain) => ({
      allowed: await chrome.permissions.contains({ origins: [originPattern(domain)] }),
      domain
    }))
  );
  const domains = permissionChecks.filter(({ allowed }) => allowed).map(({ domain }) => domain);
  if (domains.length === 0) return;

  await chrome.scripting.registerContentScripts(
    domains.map((domain) => ({
      id: scriptId(domain),
      js: ["assets/content.js"],
      matches: [originPattern(domain)],
      persistAcrossSessions: true,
      runAt: "document_idle"
    }))
  );
}

chrome.runtime.onInstalled.addListener(() => {
  void refreshDynamicScripts();
});

chrome.runtime.onStartup.addListener(() => {
  void refreshDynamicScripts();
});

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: RuntimeResponse) => void) => {
    if (!isRuntimeMessage(message)) return false;
    if (message.type === "REFRESH_DYNAMIC_SCRIPTS") {
      void refreshDynamicScripts()
        .then(() => sendResponse({ ok: true }))
        .catch((error: unknown) =>
          sendResponse({
            error: error instanceof Error ? error.message : "Could not update domain access.",
            ok: false
          })
        );
      return true;
    }
    if (message.type !== "MUTATE_SETTINGS") return false;

    mutationQueue = mutationQueue
      .catch(() => undefined)
      .then(async () => {
        const settings = applyMutation(await loadSettings(), message.mutation);
        await saveSettings(settings);
        sendResponse({ ok: true, settings });
      })
      .catch((error: unknown) =>
        sendResponse({
          error: error instanceof Error ? error.message : "Could not update settings.",
          ok: false
        })
      );
    return true;
  }
);
