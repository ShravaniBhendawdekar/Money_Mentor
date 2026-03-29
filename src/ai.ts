import { inr, type FireInputs, type FirePlan } from "./finance";

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
      "You are an Indian personal finance copilot.",
      "Generate a FIRE plan response for a retail Indian user.",
      "Do not claim to be a licensed advisor.",
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
      "Keep each bullet concrete and avoid markdown bold.",
      `Age: ${inputs.age}`,
      `Retirement age target: ${inputs.retirementAge}`,
      `Annual income: ${inr(inputs.annualIncome)}`,
      `Monthly expenses: ${inr(inputs.monthlyExpenses)}`,
      `Current corpus: ${inr(inputs.currentMfCorpus + inputs.currentPpfCorpus)}`,
      `Current SIP: ${inr(inputs.currentMonthlySip)}`,
      `Target monthly draw in today's terms: ${inr(inputs.targetMonthlyDrawToday)}`,
      `Required retirement corpus: ${inr(plan.targetCorpus)}`,
      `Required SIP: ${inr(plan.requiredSip)} per month`,
      `Current path estimated retirement age: ${plan.estimatedRetirementAgeOnCurrentPath}`,
      `Emergency fund gap: ${inr(plan.emergencyFundGap)}`,
      `Life cover gap: ${inr(plan.lifeCoverGap)}`,
      `Current life cover: ${inr(inputs.currentLifeCover)}`,
      `Liabilities: ${inr(inputs.liabilities)}`,
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

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
    if (!text) {
      return { source: "fallback", sections: fallback };
    }

    return { source: "gemini", sections: parseStructuredResponse(text, fallback) };
  } catch {
    return { source: "fallback", sections: fallback };
  }
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
    nextActions: sections.nextActions.length ? sections.nextActions : fallback.nextActions,
    disclaimer: sections.disclaimer || fallback.disclaimer,
  };
}

function extractBullets(text: string, label: "PLAN" | "RISKS" | "NEXT_ACTIONS") {
  const sectionRegex = new RegExp(`${label}:([\\s\\S]*?)(?:PLAN:|RISKS:|NEXT_ACTIONS:|DISCLAIMER:|$)`, "i");
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

function buildFallbackSummary(inputs: FireInputs, plan: FirePlan): FireGuidanceResult["sections"] {
  return {
    plan: [
      `To retire at ${inputs.retirementAge}, you need roughly ${inr(plan.targetCorpus)} and should move toward a monthly SIP of ${inr(plan.requiredSip)}.`,
      `On the current contribution path, retirement lands closer to age ${plan.estimatedRetirementAgeOnCurrentPath}.`,
    ],
    risks: [
      `The current emergency reserve is short by ${inr(plan.emergencyFundGap)}, which leaves the plan exposed if income is interrupted.`,
      `Life cover is short by ${inr(plan.lifeCoverGap)}, so dependents are under-protected on the current setup.`,
    ],
    nextActions: [
      `Increase SIP in phases until you approach ${inr(plan.requiredSip)} per month.`,
      `Close the emergency-fund gap before taking additional risk.`,
      `Raise life insurance toward ${inr(plan.lifeCoverTarget)} while keeping the portfolio equity-heavy early on and gradually de-risking over time.`,
    ],
    disclaimer:
      "AI guidance only, not licensed financial advice. Review important investment and insurance decisions with a SEBI-registered advisor.",
  };
}
