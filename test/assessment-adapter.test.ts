import { describe, expect, it } from "vitest";
import { analyzeAssessment } from "../src/schoology/assessment-adapter";

describe("assessment unanswered detection", () => {
  it("reports unanswered supported question types", () => {
    document.body.innerHTML = `
      <form>
        <section data-question-id="1"><input type="radio" name="q1" checked></section>
        <section data-question-id="2"><textarea></textarea></section>
        <section data-question-id="3"><select><option value="">Choose</option><option value="a">A</option></select></section>
      </form>`;

    const result = analyzeAssessment(document);
    expect(result.reliable).toBe(true);
    expect(result.total).toBe(3);
    expect(result.unanswered).toHaveLength(2);
  });

  it("fails closed when an unknown question control is present", () => {
    document.body.innerHTML = '<section data-question-id="1"><canvas></canvas></section>';
    expect(analyzeAssessment(document)).toEqual({ reliable: false, total: 1, unanswered: [] });
  });
});
