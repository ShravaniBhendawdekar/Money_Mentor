import {
  compactInr,
  formatPercent,
  inr,
  type FireInputs,
  type FirePlan,
} from "./finance";

export type FireGuidanceResult = {
  source: "gemini" | "fallback";
  sections: {
    plan: string[];
    risks: string[];
    nextActions: string[];
    disclaimer: string;
  };
};

export async function generateFireGuidance(
  inputs: FireInputs,
  plan: FirePlan,
): Promise<FireGuidanceResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash";
  const fallback = buildFallbackSummary(inputs, plan);

  if (!apiKey) {
    return { source: "fallback", sections: fallback };
  }

  try {
    const prompt = [
      "You are an Indian FIRE planning copilot.",
      "Use only the facts below. Do not invent liabilities, dependents, or planned expenses if they are missing.",
      "Every bullet must contain at least one number from the facts.",
      "Avoid filler phrases like market volatility, lifestyle creep, or stay disciplined unless tied to a number in the facts.",
      "Return plain text in exactly this format:",
      "PLAN:",
      "- bullet 1",
      "- bullet 2",
      "RISKS:",
      "- bullet 1",
      "- bullet 2",
      "NEXT_ACTIONS:",
      "- bullet 1",
      "- bullet 2",
      "- bullet 3",
      "DISCLAIMER:",
      "one short sentence",
      "",
      "FACTS:",
      ...buildFactSheet(inputs, plan),
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      return { source: "fallback", sections: fallback };
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim();

    if (!text) {
      return { source: "fallback", sections: fallback };
    }

    const parsed = parseStructuredResponse(text, fallback);
    if (!isGroundedResponse(parsed, inputs)) {
      return { source: "fallback", sections: fallback };
    }

    return { source: "gemini", sections: parsed };
  } catch {
    return { source: "fallback", sections: fallback };
  }
}

function buildFactSheet(inputs: FireInputs, plan: FirePlan) {
  const lines = [
    `Current age: ${inputs.age}`,
    `Target retirement age: ${inputs.retirementAge}`,
    `Years to retire: ${plan.yearsToRetire}`,
    `Annual income: ${inr(inputs.annualIncome)}`,
    `Monthly expenses: ${inr(inputs.monthlyExpenses)}`,
    `Retirement draw today: ${inr(plan.assumptions.retirementDrawToday)}`,
    `Retirement draw at retirement: ${inr(plan.assumptions.retirementDrawAtRetirement)}`,
    `Inflation: ${formatPercent(plan.assumptions.inflationRate * 100)}`,
    `Pre-retirement return: ${formatPercent(plan.assumptions.preRetirementReturn * 100)}`,
    `Post-retirement return: ${formatPercent(plan.assumptions.postRetirementReturn * 100)}`,
    `Safe withdrawal rate: ${formatPercent(plan.assumptions.safeWithdrawalRate * 100)}`,
    `Income growth: ${formatPercent(plan.assumptions.incomeGrowthRate * 100)}`,
    `Target corpus: ${inr(plan.targetCorpus)}`,
    `Current SIP path at retirement: ${inr(plan.projectedCorpusWithoutChanges)}`,
    `Required SIP: ${inr(plan.requiredSip)} per month`,
    `Current SIP: ${inr(plan.currentSip)} per month`,
    `Current path retirement age: ${plan.estimatedRetirementAgeOnCurrentPath}`,
    `Emergency fund target: ${inr(plan.emergencyFund.target)}`,
    `Emergency fund gap: ${inr(plan.emergencyFund.gap)}`,
    `Primary cover target: ${inr(plan.insurance.primaryTarget)}`,
    `Primary cover gap: ${inr(plan.insurance.primaryGap)}`,
    `Corpus lasts until age: ${plan.longevity.lastsUntilAge}`,
    `Required SIP share of take-home: ${formatPercent(plan.takeHomeFeasibility.requiredSipShare * 100)}`,
    `Estimated monthly take-home: ${inr(plan.takeHomeFeasibility.monthlyTakeHome)}`,
    `Year 5 take-home: ${inr(plan.takeHomeFeasibility.projectedMonthlyTakeHomeInYear5)}`,
    `Required SIP share in year 5: ${formatPercent(plan.takeHomeFeasibility.projectedSipShareInYear5 * 100)}`,
    `Step-up SIP year 1: ${inr(plan.stepUpSipPlan.yearOneSip)}`,
    `Step-up SIP year 10: ${inr(plan.stepUpSipPlan.yearTenSip)}`,
    `Lower-return case: if returns are ${formatPercent(plan.sensitivity.lowerReturnAssumption * 100)}, retirement shifts to age ${plan.sensitivity.lowerReturnRetirementAge}`,
  ];

  if (inputs.currentLiquidSavings > 0) {
    lines.push(`Current liquid savings: ${inr(inputs.currentLiquidSavings)}`);
  }

  if (inputs.liabilities > 0) {
    lines.push(`Outstanding liabilities: ${inr(inputs.liabilities)}`);
  }

  if (inputs.dependents > 0) {
    lines.push(`Dependents: ${inputs.dependents}`);
  }

  if (plan.plannedExpenseSchedule.length > 0) {
    lines.push(
      ...plan.plannedExpenseSchedule.map(
        (expense) =>
          `Planned expense in ${expense.year}: ${inr(expense.inflatedAmount)} (${expense.phase})`,
      ),
    );
  }

  return lines;
}

function parseStructuredResponse(
  response: string,
  fallback: FireGuidanceResult["sections"],
): FireGuidanceResult["sections"] {
  const sections = {
    plan: extractBullets(response, "PLAN"),
    risks: extractBullets(response, "RISKS"),
    nextActions: extractBullets(response, "NEXT_ACTIONS"),
    disclaimer: extractDisclaimer(response),
  };

  return {
    plan: sections.plan.length ? sections.plan : fallback.plan,
    risks: sections.risks.length ? sections.risks : fallback.risks,
    nextActions: sections.nextActions.length
      ? sections.nextActions
      : fallback.nextActions,
    disclaimer: sections.disclaimer || fallback.disclaimer,
  };
}

function extractBullets(text: string, label: "PLAN" | "RISKS" | "NEXT_ACTIONS") {
  const sectionRegex = new RegExp(
    `${label}:([\\s\\S]*?)(?:PLAN:|RISKS:|NEXT_ACTIONS:|DISCLAIMER:|$)`,
    "i",
  );
  const match = text.match(sectionRegex)?.[1] ?? "";
  return match
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean);
}

function extractDisclaimer(text: string) {
  const match = text.match(/DISCLAIMER:([\s\S]*)$/i)?.[1] ?? "";
  return match.trim().replace(/\s+/g, " ");
}

function isGroundedResponse(
  sections: FireGuidanceResult["sections"],
  inputs: FireInputs,
) {
  const bullets = [...sections.plan, ...sections.risks, ...sections.nextActions];
  const bannedPhrases = [
    "market volatility",
    "lifestyle creep",
    "stay disciplined",
    "diversify across cycles",
  ];

  if (bullets.length === 0) {
    return false;
  }

  if (bullets.some((bullet) => !/\d/.test(bullet))) {
    return false;
  }

  if (bullets.some((bullet) =>
    bannedPhrases.some((phrase) => bullet.toLowerCase().includes(phrase)),
  )) {
    return false;
  }

  if (inputs.dependents === 0 && bullets.some((bullet) => /dependents?/i.test(bullet))) {
    return false;
  }

  if (inputs.liabilities === 0 && bullets.some((bullet) => /liabilit/i.test(bullet))) {
    return false;
  }

  if (
    inputs.plannedExpenses.length === 0 &&
    bullets.some((bullet) => /planned expense|education|wedding|down payment/i.test(bullet))
  ) {
    return false;
  }

  return true;
}

function buildFallbackSummary(
  inputs: FireInputs,
  plan: FirePlan,
): FireGuidanceResult["sections"] {
  const coverSentence =
    plan.insurance.primaryGap > 0
      ? `Primary life cover is short by ${inr(plan.insurance.primaryGap)} against a target of ${inr(plan.insurance.primaryTarget)}.`
      : `Primary life cover already covers the ${inr(plan.insurance.primaryTarget)} target.`;

  return {
    plan: [
      `To retire at ${inputs.retirementAge}, grow ${inr(plan.assumptions.retirementDrawToday)} today to ${inr(plan.assumptions.retirementDrawAtRetirement)} and build about ${compactInr(plan.targetCorpus)} at a ${formatPercent(plan.assumptions.safeWithdrawalRate * 100)} withdrawal rate.`,
      `The direct path needs about ${inr(plan.requiredSip)} per month, while the step-up option starts near ${inr(plan.stepUpSipPlan.yearOneSip)} and reaches about ${inr(plan.stepUpSipPlan.yearTenSip)} by year 10.`,
    ],
    risks: [
      `The emergency reserve target is ${inr(plan.emergencyFund.target)} and the current gap is ${inr(plan.emergencyFund.gap)}${plan.emergencyFund.note ? ` because ${plan.emergencyFund.note.toLowerCase()}` : "."}`,
      `${coverSentence} If pre-retirement returns average ${formatPercent(plan.sensitivity.lowerReturnAssumption * 100)} instead of ${formatPercent(plan.assumptions.preRetirementReturn * 100)}, the current path shifts retirement to about age ${plan.sensitivity.lowerReturnRetirementAge}.`,
    ],
    nextActions: [
      `Move the SIP from ${inr(plan.currentSip)} to ${inr(plan.requiredSip)} if possible, or use the 10% step-up route starting at ${inr(plan.stepUpSipPlan.yearOneSip)}.`,
      `Keep emergency savings moving toward ${inr(plan.emergencyFund.target)} and review the retirement spending assumption of ${inr(plan.assumptions.retirementDrawToday)} in today's value.`,
      `At the current projection, the corpus lasts until about age ${plan.longevity.lastsUntilAge}, and ${inr(plan.requiredSip)} is ${formatPercent(plan.takeHomeFeasibility.requiredSipShare * 100)} of the estimated take-home of ${inr(plan.takeHomeFeasibility.monthlyTakeHome)} per month.`,
      `At ${formatPercent(plan.assumptions.incomeGrowthRate * 100)} income growth, the same ${inr(plan.requiredSip)} falls to about ${formatPercent(plan.takeHomeFeasibility.projectedSipShareInYear5 * 100)} of the projected year-5 take-home of ${inr(plan.takeHomeFeasibility.projectedMonthlyTakeHomeInYear5)} per month.`,
    ],
    disclaimer:
      "Guidance only, not licensed investment advice. Review big portfolio and insurance decisions with a SEBI-registered advisor.",
  };
}
