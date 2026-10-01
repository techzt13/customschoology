import { describe, expect, it } from "vitest";
import { applyCourseWorkspace, removeCourseWorkspace } from "../src/content/course-workspace";
import { DEFAULT_SETTINGS } from "../src/shared/models";

describe("course workspace customization", () => {
  it("applies reversible order, visibility, accent, and safe quick links", () => {
    document.body.innerHTML = `
      <section class="course-dashboard">
        <article class="course-card" style="display:grid;order:7;border-inline-start:2px solid red">
          <a href="https://example.schoology.com/courses/42">Biology</a>
        </article>
      </section>`;
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.coursePreferences["42"] = {
      accent: "#123456",
      favorite: true,
      hidden: false,
      nickname: "Bio",
      order: 2,
      quickLinks: [
        { label: "Lab notes", url: "https://example.schoology.com/courses/42/materials" }
      ]
    };

    applyCourseWorkspace(settings);
    const card = document.querySelector<HTMLElement>(".course-card")!;
    expect(card.style.order).toBe("2");
    expect(card.style.display).toBe("grid");
    expect(card.style.borderInlineStart).toContain("var(--sc-course-accent)");
    expect(card.querySelector(".sc-course-quick-links a")?.textContent).toBe("Lab notes");

    removeCourseWorkspace();
    expect(card.style.order).toBe("7");
    expect(card.style.display).toBe("grid");
    expect(card.style.borderInlineStart).toBe("2px solid red");
    expect(card.querySelector(".sc-course-quick-links")).toBeNull();
  });
});
