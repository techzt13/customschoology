import type { GradeScenario } from "../shared/models";

export interface GradeScenarioResult {
  comparisonPoints: number | null;
  currentPercent: number | null;
  explanation: string;
  neededScore: number | null;
  projectedPercent: number | null;
  status: "supported" | "unsupported";
}

function percent(earned: number, possible: number): number | null {
  return possible > 0 ? (earned / possible) * 100 : null;
}

export function evaluateGradeScenario(scenario: GradeScenario): GradeScenarioResult {
  const currentPercent = percent(scenario.currentEarned, scenario.currentPossible);
  if (scenario.rule !== "points") {
    return {
      comparisonPoints: null,
      currentPercent,
      explanation:
        scenario.rule === "weighted"
          ? "Weighted categories require verified category weights and cannot be calculated from total points."
          : scenario.rule === "dropped"
            ? "Dropped-grade rules require verified teacher policy and are not simulated."
            : "Extra-credit behavior varies by gradebook configuration and is not simulated.",
      neededScore: null,
      projectedPercent: null,
      status: "unsupported"
    };
  }

  const projectedPercent = percent(
    scenario.currentEarned + scenario.hypotheticalEarned,
    scenario.currentPossible + scenario.hypotheticalPossible
  );
  const neededScore =
    (scenario.targetPercent / 100) * (scenario.currentPossible + scenario.hypotheticalPossible) -
    scenario.currentEarned;

  return {
    comparisonPoints:
      currentPercent === null || projectedPercent === null
        ? null
        : projectedPercent - currentPercent,
    currentPercent,
    explanation:
      "Points-based projection: (current earned + hypothetical earned) ÷ (current possible + hypothetical possible).",
    neededScore,
    projectedPercent,
    status: "supported"
  };
}
