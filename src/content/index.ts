import { isRuntimeMessage, type RuntimeResponse } from "../shared/messages";
import { loadSettings } from "../shared/storage";
import { extractUpcoming } from "../schoology/upcoming-adapter";
import { applyNativeCustomization, removeNativeCustomization } from "./native-customization";
import { applyCourseWorkspace, removeCourseWorkspace } from "./course-workspace";
import { installAssessmentWarning } from "./assessment-warning";
import { installMaterialActions } from "./material-actions";
import { existingTodayHost, TodayPanel } from "./today-panel";

async function initialize(): Promise<void> {
  if (existingTodayHost()) return;
  const initialSnapshot = extractUpcoming(document, location);
  if (!initialSnapshot.capabilities.supported) {
    removeNativeCustomization();
    removeCourseWorkspace();
    return;
  }

  let settings = await loadSettings();
  applyNativeCustomization(settings);
  applyCourseWorkspace(settings);
  installAssessmentWarning();
  const panel = new TodayPanel(initialSnapshot);
  await panel.initialize();
  installMaterialActions(() => panel.open());

  let refreshTimer: number | undefined;
  const observer = new MutationObserver(() => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      panel.refresh();
      applyNativeCustomization(settings);
      applyCourseWorkspace(settings);
      installAssessmentWarning();
      installMaterialActions(() => panel.open());
    }, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.settings) return;
    void loadSettings().then((next) => {
      settings = next;
      applyNativeCustomization(settings);
      applyCourseWorkspace(settings);
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
