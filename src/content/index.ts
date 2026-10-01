import { isRuntimeMessage, type RuntimeResponse } from "../shared/messages";
import { loadSettings } from "../shared/storage";
import { extractUpcoming } from "../schoology/upcoming-adapter";
import { applyNativeCustomization, removeNativeCustomization } from "./native-customization";
import { existingTodayHost, TodayPanel } from "./today-panel";

async function initialize(): Promise<void> {
  if (existingTodayHost()) return;
  const initialSnapshot = extractUpcoming(document, location);
  if (!initialSnapshot.capabilities.supported) {
    removeNativeCustomization();
    return;
  }

  let settings = await loadSettings();
  applyNativeCustomization(settings);
  const panel = new TodayPanel(initialSnapshot);
  await panel.initialize();

  let refreshTimer: number | undefined;
  const observer = new MutationObserver(() => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      panel.refresh();
      applyNativeCustomization(settings);
    }, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.settings) return;
    void loadSettings().then((next) => {
      settings = next;
      applyNativeCustomization(settings);
    });
  });

  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse: (response: RuntimeResponse) => void) => {
      if (!isRuntimeMessage(message)) return false;
      if (message.type === "GET_PAGE_SNAPSHOT") {
        sendResponse({ ok: true, snapshot: extractUpcoming(document, location) });
        return false;
      }
      if (message.type === "OPEN_TODAY_PANEL") {
        panel.open();
        sendResponse({ ok: true });
        return false;
      }
      return false;
    }
  );
}

void initialize();
