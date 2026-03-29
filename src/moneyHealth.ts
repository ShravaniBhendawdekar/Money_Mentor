import { computeFirePlan, inr, type FireInputs } from "./finance";

export type MoneyHealthInputs = {
  age: number;
  annualIncome: number;
  monthlyExpenses: number;
  dependents: number;
  targetRetirementAge: number;
  liquidSavings: number;
  currentLifeCover: number;
  healthInsuranceCover: number;
  equityInvestments: number;
  debtInvestments: number;
  retirementInvestments: number;
  currentMonthlySip: number;
  monthlyEmis: number;
  highInterestDebt: number;
  liabilities: number;
  annualTaxSavingInvestments: number;
  annualHealthInsurancePremium: number;
};

type FieldMessages = {
  errors: string[];
  warnings: string[];
};

export type MoneyHealthValidation = {
  errors: string[];
  warnings: string[];
  fields: Record<string, FieldMessages>;
};

export type MoneyHealthDimension = {
  id:
    | "emergency"
    | "insurance"
    | "investments"
    | "debt"
    | "tax"
    | "retirement";
  label: string;
  score: number;
  tone: "amber" | "rose" | "violet" | "green";
  summary: string;
  detail: string;
};

export type MoneyHealthAction = {
  title: string;
  detail: string;
  impact: string;
  tone: "amber" | "violet" | "green";
};

export type MoneyHealthPlan = {
  overallScore: number;
  grade: "Excellent" | "Strong" | "Fair" | "Fragile";
  biggestOpportunity: string;
  dimensions: MoneyHealthDimension[];
  actions: MoneyHealthAction[];
  metrics: {
    emergencyMonths: number;
    emergencyTarget: number;
    emergencyGap: number;
    lifeCoverTarget: number;
    healthCoverTarget: number;
    investmentMix: {
      equity: number;
      debt: number;
      retirement: number;
    };
    debtToIncomeRatio: number;
    emiRatio: number;
    taxSavingsUsed: number;
    taxSavingsTarget: number;
    retirementTargetCorpus: number;
    retirementCurrentPathAge: number;
    retirementRequiredSip: number;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const round = (value: number) => Math.round(value);

const percent = (value: number) => `${value.toFixed(1)}%`;

export function validateMoneyHealthInputs(
  inputs: MoneyHealthInputs,
): MoneyHealthValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fields: Record<string, FieldMessages> = {};
  const monthlyIncome = inputs.annualIncome / 12;

  const push = (key: string, tone: "errors" | "warnings", message: string) => {
    const bucket = fields[key] ?? { errors: [], warnings: [] };
    bucket[tone].push(message);
    fields[key] = bucket;
  };

  if (inputs.age < 18 || inputs.age > 70) {
    const message = "Current age should be between 18 and 70 years.";
    errors.push(message);
    push("age", "errors", message);
  }

  if (inputs.targetRetirementAge <= inputs.age + 5) {
    const message = "Retirement age should be at least 5 years after your current age.";
    errors.push(message);
    push("targetRetirementAge", "errors", message);
  }

  if (inputs.annualIncome <= 0) {
    const message = "Annual income must be greater than zero.";
    errors.push(message);
    push("annualIncome", "errors", message);
  }

  if (inputs.monthlyExpenses <= 0) {
    const message = "Monthly expenses must be greater than zero.";
    errors.push(message);
    push("monthlyExpenses", "errors", message);
  }

  if (inputs.monthlyExpenses >= monthlyIncome) {
    const message = "Monthly expenses should stay below monthly income.";
    errors.push(message);
    push("monthlyExpenses", "errors", message);
  }

  if (inputs.currentMonthlySip < 0) {
    const message = "Current SIP cannot be negative.";
    errors.push(message);
    push("currentMonthlySip", "errors", message);
  }

  if (inputs.monthlyEmis < 0 || inputs.highInterestDebt < 0 || inputs.liabilities < 0) {
    const message = "Debt values cannot be negative.";
    errors.push(message);
    push("monthlyEmis", "errors", message);
  }

  if (inputs.monthlyEmis > monthlyIncome) {
    const message = "Monthly EMIs look higher than income. Check the debt inputs.";
    warnings.push(message);
    push("monthlyEmis", "warnings", message);
  }

  if (inputs.currentLifeCover > 0 && inputs.dependents === 0 && inputs.liabilities === 0) {
    const message = "If nobody depends on your income, life cover matters less than health cover.";
    warnings.push(message);
    push("currentLifeCover", "warnings", message);
  }

  if (inputs.healthInsuranceCover <= 0) {
    const message = "Add your health insurance cover so the score can judge protection correctly.";
    warnings.push(message);
    push("healthInsuranceCover", "warnings", message);
  }

  if (
    inputs.equityInvestments + inputs.debtInvestments + inputs.retirementInvestments <=
    0
  ) {
    const message = "Add your current investments so the wellness score can assess diversification.";
    errors.push(message);
    push("equityInvestments", "errors", message);
  }

  return { errors, warnings, fields };
}

function computeRetirementReadiness(inputs: MoneyHealthInputs) {
  const fireInputs: FireInputs = {
    age: inputs.age,
    retirementAge: inputs.targetRetirementAge,
    lifeExpectancy: 90,
    annualIncome: inputs.annualIncome,
    monthlyExpenses: inputs.monthlyExpenses,
    currentMfCorpus: inputs.equityInvestments + inputs.debtInvestments,
    currentPpfCorpus: inputs.retirementInvestments,
    epfCorpus: 0,
    currentLiquidSavings: inputs.liquidSavings,
    targetMonthlyDrawToday: inputs.monthlyExpenses,
    currentMonthlySip: inputs.currentMonthlySip,
    annualIncomeGrowthRate: 0.08,
    inflationRate: 0.06,
    preRetirementReturn: 0.11,
    postRetirementReturn: 0.07,
    safeWithdrawalRate: 0.04,
    currentLifeCover: inputs.currentLifeCover,
    hasPureTermPlan: true,
    liabilities: inputs.liabilities,
    dependents: inputs.dependents,
    plannedExpenses: [],
  };

  return computeFirePlan(fireInputs);
}

export function computeMoneyHealthPlan(
  inputs: MoneyHealthInputs,
): MoneyHealthPlan {
  const monthlyIncome = Math.max(inputs.annualIncome / 12, 1);
  const emergencyTarget = inputs.monthlyExpenses * 6;
  const emergencyMonths = inputs.monthlyExpenses > 0
    ? inputs.liquidSavings / inputs.monthlyExpenses
    : 0;
  const emergencyGap = Math.max(emergencyTarget - inputs.liquidSavings, 0);

  const totalInvestments =
    inputs.equityInvestments + inputs.debtInvestments + inputs.retirementInvestments;
  const lifeCoverTarget =
    inputs.dependents > 0
      ? Math.max(inputs.annualIncome * 10 + inputs.liabilities - totalInvestments, 0)
      : Math.max(inputs.liabilities, 0);
  const healthCoverTarget = Math.max(500_000 * Math.max(inputs.dependents + 1, 1), 500_000);

  const emergencyScore = round(clamp((emergencyMonths / 6) * 100, 0, 100));

  const lifeRatio =
    lifeCoverTarget > 0 ? clamp(inputs.currentLifeCover / lifeCoverTarget, 0, 1) : 1;
  const healthRatio = clamp(inputs.healthInsuranceCover / healthCoverTarget, 0, 1);
  const insuranceScore = round(
    inputs.dependents > 0
      ? lifeRatio * 70 + healthRatio * 30
      : healthRatio * 70 + lifeRatio * 30,
  );

  const equityShare = totalInvestments > 0 ? inputs.equityInvestments / totalInvestments : 0;
  const debtShare = totalInvestments > 0 ? inputs.debtInvestments / totalInvestments : 0;
  const retirementShare =
    totalInvestments > 0 ? inputs.retirementInvestments / totalInvestments : 0;
  const activeBuckets = [
    inputs.equityInvestments,
    inputs.debtInvestments,
    inputs.retirementInvestments,
  ].filter((value) => value > 0).length;
  const diversificationBase = (activeBuckets / 3) * 55;
  const concentrationPenalty =
    clamp(Math.max(equityShare, debtShare, retirementShare) - 0.55, 0, 0.45) / 0.45;
  const sipBonus = inputs.currentMonthlySip > 0 ? 15 : 0;
  const investmentScore = round(
    clamp(diversificationBase + (1 - concentrationPenalty) * 30 + sipBonus, 0, 100),
  );

  const emiRatio = inputs.monthlyEmis / monthlyIncome;
  const highInterestRatio = inputs.highInterestDebt / Math.max(inputs.annualIncome, 1);
  const liabilityRatio = inputs.liabilities / Math.max(inputs.annualIncome * 4, 1);
  const debtScore = round(
    clamp(
      100 -
        clamp(emiRatio / 0.45, 0, 1) * 45 -
        clamp(highInterestRatio, 0, 1) * 35 -
        clamp(liabilityRatio, 0, 1) * 20,
      0,
      100,
    ),
  );

  const taxSavingsTarget = 175_000;
  const taxUsed = Math.min(
    inputs.annualTaxSavingInvestments + inputs.annualHealthInsurancePremium,
    taxSavingsTarget,
  );
  const taxScore = round(clamp((taxUsed / taxSavingsTarget) * 100, 0, 100));

  const retirementPlan = computeRetirementReadiness(inputs);
  const readinessRatio =
    retirementPlan.targetCorpus > 0
      ? retirementPlan.projectedCorpusWithoutChanges / retirementPlan.targetCorpus
      : 0;
  const retirementTimingGap = Math.max(
    retirementPlan.estimatedRetirementAgeOnCurrentPath - inputs.targetRetirementAge,
    0,
  );
  const retirementScore = round(
    clamp(
      clamp(readinessRatio, 0, 1) * 70 +
        clamp(1 - retirementTimingGap / 12, 0, 1) * 30,
      0,
      100,
    ),
  );

  const dimensions: MoneyHealthDimension[] = [
    {
      id: "emergency",
      label: "Emergency fund",
      score: emergencyScore,
      tone: emergencyScore >= 75 ? "green" : "amber",
      summary:
        emergencyMonths >= 6
          ? `${emergencyMonths.toFixed(1)} months saved, target met`
          : `${emergencyMonths.toFixed(1)} months saved, target is 6`,
      detail:
        emergencyGap > 0
          ? `Build another ${inr(emergencyGap)} to complete a 6-month reserve.`
          : "Your liquid reserve can already handle a 6-month shock.",
    },
    {
      id: "insurance",
      label: "Insurance cover",
      score: insuranceScore,
      tone: insuranceScore >= 75 ? "green" : "rose",
      summary:
        inputs.dependents > 0
          ? `Life cover ${inr(inputs.currentLifeCover)} against a target of ${inr(lifeCoverTarget)}`
          : `Health cover ${inr(inputs.healthInsuranceCover)} against a target of ${inr(healthCoverTarget)}`,
      detail:
        lifeCoverTarget > inputs.currentLifeCover || healthCoverTarget > inputs.healthInsuranceCover
          ? `Protection still needs attention on life cover, health cover, or both.`
          : "Protection is broadly aligned with the current household setup.",
    },
    {
      id: "investments",
      label: "Investments",
      score: investmentScore,
      tone: "violet",
      summary: `Equity ${round(equityShare * 100)}%, debt ${round(debtShare * 100)}%, retirement ${round(retirementShare * 100)}%`,
      detail:
        activeBuckets >= 3
          ? "You have exposure across growth, stability, and retirement buckets."
          : "Add at least one more investment sleeve so the portfolio is not doing one job only.",
    },
    {
      id: "debt",
      label: "Debt health",
      score: debtScore,
      tone: debtScore >= 75 ? "green" : "amber",
      summary:
        inputs.highInterestDebt > 0
          ? `${inr(inputs.highInterestDebt)} high-interest debt and ${percent(emiRatio * 100)} EMI load`
          : `No high-interest debt, EMI load ${percent(emiRatio * 100)}`,
      detail:
        inputs.highInterestDebt > 0
          ? "Clear high-cost debt before chasing aggressive investing targets."
          : "Debt pressure is manageable if you keep EMIs from creeping higher.",
    },
    {
      id: "tax",
      label: "Tax efficiency",
      score: taxScore,
      tone: "amber",
      summary: `${inr(taxUsed)} used against a practical tax-saving target of ${inr(taxSavingsTarget)}`,
      detail:
        taxUsed < taxSavingsTarget
          ? `${inr(taxSavingsTarget - taxUsed)} of common deductions still looks unused this year.`
          : "You are already using the common tax-saving lanes fairly well.",
    },
    {
      id: "retirement",
      label: "Retirement",
      score: retirementScore,
      tone: "violet",
      summary: `Current path points to age ${retirementPlan.estimatedRetirementAgeOnCurrentPath}, target is ${inputs.targetRetirementAge}`,
      detail:
        retirementPlan.estimatedRetirementAgeOnCurrentPath > inputs.targetRetirementAge
          ? `The plan needs about ${inr(retirementPlan.requiredSip)} per month to fully support the target timeline.`
          : "Current saving pace is broadly aligned with the retirement target.",
    },
  ];

  const overallScore = round(
    dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length,
  );
  const grade =
    overallScore >= 85
      ? "Excellent"
      : overallScore >= 72
        ? "Strong"
        : overallScore >= 55
          ? "Fair"
          : "Fragile";

  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];

  const actions: MoneyHealthAction[] = [
    {
      title:
        emergencyGap > 0
          ? `Build another ${inr(emergencyGap)} in liquid reserves`
          : `Keep the emergency reserve at ${inr(emergencyTarget)}`,
      detail:
        emergencyGap > 0
          ? `That takes the buffer from ${emergencyMonths.toFixed(1)} months to the recommended 6 months.`
          : "The buffer is already strong, so this stays as a maintenance habit.",
      impact: "Improves resilience against job loss, medical shocks, and sudden family costs.",
      tone: "amber",
    },
    {
      title:
        retirementPlan.requiredSip > inputs.currentMonthlySip
          ? `Increase SIP by ${inr(Math.max(retirementPlan.requiredSip - inputs.currentMonthlySip, 0))}/month`
          : `Maintain the current SIP of ${inr(inputs.currentMonthlySip)}/month`,
      detail:
        retirementPlan.requiredSip > inputs.currentMonthlySip
          ? `That moves the retirement path closer to age ${inputs.targetRetirementAge} instead of age ${retirementPlan.estimatedRetirementAgeOnCurrentPath}.`
          : "The current contribution pace is not the biggest weak point right now.",
      impact: "Raises retirement readiness and lowers the pressure on future catch-up investing.",
      tone: "violet",
    },
    {
      title:
        taxUsed < taxSavingsTarget
          ? `Use another ${inr(taxSavingsTarget - taxUsed)} of tax-saving capacity`
          : "Keep tax-saving investments aligned with the annual limit",
      detail:
        taxUsed < taxSavingsTarget
          ? "Route it through the most suitable 80C and health-insurance buckets before year-end."
          : "Your current mix is already close to the common annual deduction range.",
      impact: "Improves tax efficiency and frees more cash for savings goals.",
      tone: "green",
    },
  ];

  return {
    overallScore,
    grade,
    biggestOpportunity: `${weakest.label} is the biggest opportunity to improve this month.`,
    dimensions,
    actions,
    metrics: {
      emergencyMonths,
      emergencyTarget,
      emergencyGap,
      lifeCoverTarget,
      healthCoverTarget,
      investmentMix: {
        equity: equityShare,
        debt: debtShare,
        retirement: retirementShare,
      },
      debtToIncomeRatio: inputs.liabilities / Math.max(inputs.annualIncome, 1),
      emiRatio,
      taxSavingsUsed: taxUsed,
      taxSavingsTarget,
      retirementTargetCorpus: retirementPlan.targetCorpus,
      retirementCurrentPathAge: retirementPlan.estimatedRetirementAgeOnCurrentPath,
      retirementRequiredSip: retirementPlan.requiredSip,
    },
  };
}
