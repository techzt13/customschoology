import { describe, expect, it } from "vitest";
import { detectMaterialEntries } from "../src/schoology/materials-adapter";

describe("materials adapter", () => {
  it("detects known assignment and assessment material rows without duplicates", () => {
    document.body.innerHTML = `
      <ul class="materials-list">
        <li><a href="https://example.schoology.com/assignment/10">Essay</a></li>
        <li><a href="https://example.schoology.com/assessment/20">Quiz</a></li>
      </ul>`;
    const entries = detectMaterialEntries(document);
    expect(entries.map(({ link }) => link.textContent)).toEqual(["Essay", "Quiz"]);
  });

  it("leaves unknown material layouts untouched", () => {
    document.body.innerHTML = '<div class="custom-material"><a href="/assignment/1">Task</a></div>';
    expect(detectMaterialEntries(document)).toEqual([]);
  });
});
