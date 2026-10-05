import { describe, expect, it } from "vitest";
import { evaluateGradeScenario } from "../src/domain/grade-planning";
import type { GradeScenario } from "../src/shared/models";

const scenario: GradeScenario = {
  currentEarned: 80,
  currentPossible: 100,
  hypotheticalEarned: 18,
  hypotheticalPossible: 20,
  id: "scenario-1",
  name: "Quiz plan",
  rule: "points",
  targetPercent: 85
};

describe("grade scenario evaluation", () => {
  it("calculates a points-based projection and score needed", () => {
    const result = evaluateGradeScenario(scenario);

    expect(result.status).toBe("supported");
    expect(result.currentPercent).toBe(80);
    expect(result.projectedPercent).toBeCloseTo(81.6667, 3);
    expect(result.neededScore).toBe(22);
    expect(result.explanation).toContain("Points-based");
  });

  it.each(["weighted", "dropped", "extra-credit"] as const)(
    "returns an explicit unsupported state for %s rules",
    (rule) => {
      const result = evaluateGradeScenario({ ...scenario, rule });
      expect(result.status).toBe("unsupported");
      expect(result.projectedPercent).toBeNull();
      expect(result.explanation.length).toBeGreaterThan(20);
    }
  );
});
