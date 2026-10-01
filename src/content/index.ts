import { isRuntimeMessage, type RuntimeResponse } from "../shared/messages";
import { extractUpcoming } from "../schoology/upcoming-adapter";
import { existingTodayHost, TodayPanel } from "./today-panel";

if (!existingTodayHost()) {
  const initialSnapshot = extractUpcoming(document, location);
  if (initialSnapshot.capabilities.supported) {
    const panel = new TodayPanel(initialSnapshot);
    void panel.initialize();

    let refreshTimer: number | undefined;
    const observer = new MutationObserver(() => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => panel.refresh(), 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });

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
}
