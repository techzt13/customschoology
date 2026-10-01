import { detectMaterialEntries } from "../schoology/materials-adapter";

const ACTION_CLASS = "sc-material-plan-action";

export function installMaterialActions(openToday: () => void): void {
  for (const { container, link } of detectMaterialEntries(document)) {
    if (container.querySelector(`.${ACTION_CLASS}`)) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = ACTION_CLASS;
    button.textContent = "Plan in Today";
    button.setAttribute("aria-label", `Plan ${link.textContent?.trim() || "material"} in Today`);
    button.style.cssText =
      "margin-inline-start:.5rem;border:1px solid currentColor;border-radius:6px;padding:.25rem .5rem;background:transparent;color:inherit;";
    button.addEventListener("click", openToday);
    container.append(button);
  }
}
