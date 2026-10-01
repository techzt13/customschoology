export interface AssessmentAnalysis {
  reliable: boolean;
  total: number;
  unanswered: HTMLElement[];
}

const QUESTION_SELECTOR = "[data-question-id], .assessment-question[id^='question-']";

function questionAnswered(question: HTMLElement): boolean | null {
  const radioOrCheckbox = question.querySelectorAll<HTMLInputElement>(
    "input[type='radio'], input[type='checkbox']"
  );
  if (radioOrCheckbox.length > 0) return [...radioOrCheckbox].some((input) => input.checked);

  const fields = question.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("textarea, select, input[type='text'], input[type='number']");
  if (fields.length > 0) return [...fields].some((field) => field.value.trim().length > 0);

  const editable = question.querySelector<HTMLElement>("[contenteditable='true']");
  if (editable) return Boolean(editable.textContent?.trim());
  return null;
}

export function analyzeAssessment(document: Document): AssessmentAnalysis {
  const questions = [...document.querySelectorAll<HTMLElement>(QUESTION_SELECTOR)];
  if (questions.length === 0) return { reliable: false, total: 0, unanswered: [] };

  const unanswered: HTMLElement[] = [];
  for (const question of questions) {
    const answered = questionAnswered(question);
    if (answered === null) return { reliable: false, total: questions.length, unanswered: [] };
    if (!answered) unanswered.push(question);
  }
  return { reliable: true, total: questions.length, unanswered };
}
