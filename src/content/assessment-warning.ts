import { analyzeAssessment } from "../schoology/assessment-adapter";

const WARNING_ID = "schoology-companion-assessment-warning";

export function installAssessmentWarning(): void {
  if (document.getElementById(WARNING_ID)) return;
  const analysis = analyzeAssessment(document);
  if (!analysis.reliable) return;
  const form = analysis.unanswered[0]?.closest("form") ?? document.querySelector("form");
  if (!form) return;

  const banner = document.createElement("section");
  banner.id = WARNING_ID;
  banner.hidden = true;
  banner.setAttribute("role", "alert");
  banner.setAttribute("aria-live", "assertive");
  banner.style.cssText =
    "border:2px solid #9a5b00;border-radius:8px;background:#fff8e6;color:#2b1a00;padding:1rem;margin:1rem 0;";

  const message = document.createElement("p");
  message.style.margin = "0 0 .75rem";
  const review = document.createElement("button");
  review.type = "button";
  review.textContent = "Review first unanswered question";
  const submitAnyway = document.createElement("button");
  submitAnyway.type = "button";
  submitAnyway.textContent = "Submit anyway";
  submitAnyway.style.marginInlineStart = ".5rem";
  banner.append(message, review, submitAnyway);
  form.prepend(banner);

  let bypass = false;
  let submitter: HTMLElement | null = null;
  form.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.matches("button[type='submit'], input[type='submit']")
      ) {
        submitter = target;
      }
    },
    true
  );
  form.addEventListener(
    "submit",
    (event) => {
      if (bypass) {
        bypass = false;
        return;
      }
      const current = analyzeAssessment(document);
      if (!current.reliable || current.unanswered.length === 0) return;
      event.preventDefault();
      message.textContent = `${current.unanswered.length} of ${current.total} detected questions are unanswered. Schoology has not submitted this assessment.`;
      banner.hidden = false;
      review.focus();
    },
    true
  );
  review.addEventListener("click", () => {
    const first = analyzeAssessment(document).unanswered[0];
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    first?.querySelector<HTMLElement>("input, textarea, select, [contenteditable='true']")?.focus();
  });
  submitAnyway.addEventListener("click", () => {
    bypass = true;
    if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
      form.requestSubmit(submitter);
    } else {
      form.requestSubmit();
    }
  });
}
