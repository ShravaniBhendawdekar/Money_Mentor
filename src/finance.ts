export type PlannedExpenseInput = {
  amountToday: number;
  year: number;
};

export type FireInputs = {
  age: number;
  retirementAge: number;
  lifeExpectancy: number;
  annualIncome: number;
  monthlyExpenses: number;
  currentMfCorpus: number;
  currentPpfCorpus: number;
  epfCorpus: number;
  currentLiquidSavings: number;
  targetMonthlyDrawToday: number;
  currentMonthlySip: number;
  annualIncomeGrowthRate: number;
  inflationRate: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  safeWithdrawalRate: number;
  currentLifeCover: number;
  hasPureTermPlan: boolean;
  liabilities: number;
  dependents: number;
  plannedExpenses: PlannedExpenseInput[];
};

type FieldMessages = {
  errors: string[];
  warnings: string[];
};

export type FireValidation = {
  errors: string[];
  warnings: string[];
  fields: Record<string, FieldMessages>;
};

export type FireChartPoint = {
  age: number;
  year: number;
  corpus: number;
};

export type FireExpenseMarker = {
  age: number;
  year: number;
  label: string;
  phase: "accumulation" | "retirement";
};

export type FirePlan = {
  yearsToRetire: number;
  retirementYear: number;
  yearsAfterRetirement: number;
  targetMonthlyAtRetirement: number;
  targetCorpus: number;
  projectedCorpusWithoutChanges: number;
  recommendedCorpusAtRetirement: number;
  requiredSip: number;
  currentSip: number;
  estimatedRetirementAgeOnCurrentPath: number;
  assumptions: {
    preRetirementReturn: number;
    postRetirementReturn: number;
    inflationRate: number;
    safeWithdrawalRate: number;
    incomeGrowthRate: number;
    retirementDrawToday: number;
    retirementDrawAtRetirement: number;
  };
  emergencyFund: {
    target: number;
    currentLiquidSavings: number;
    gap: number;
    note?: string;
  };
  insurance: {
    primaryTarget: number;
    primaryGap: number;
  };
  takeHomeFeasibility: {
    grossMonthlyIncome: number;
    primaryMonthlyTakeHome: number;
    monthlyTakeHome: number;
    requiredSipShareOfIncome: number;
    requiredSipShare: number;
    projectedMonthlyTakeHomeInYear5: number;
    projectedSipShareInYear5: number;
    isStretched: boolean;
    isNotFeasible: boolean;
  };
  longevity: {
    lastsUntilAge: number;
    status: "critical" | "watch" | "strong";
    exhaustionAge: number | null;
    targetReachedLifeExpectancy: boolean;
  };
  stepUpSipPlan: {
    yearOneSip: number;
    annualIncreaseRate: number;
    yearTenSip: number;
    reachesTarget: boolean;
  };
  plannedExpenseSchedule: Array<{
    year: number;
    age: number;
    amountToday: number;
    inflatedAmount: number;
    phase: "accumulation" | "retirement";
  }>;
  chartSeries: {
    horizonAge: number;
    retirementAge: number;
    lifeExpectancy: number;
    goalCorpus: number;
    currentPath: FireChartPoint[];
    targetPath: FireChartPoint[];
    conservativePath: FireChartPoint[];
    expenseMarkers: FireExpenseMarker[];
    currentExhaustionAge: number | null;
    targetExhaustionAge: number | null;
    conservativeExhaustionAge: number | null;
  };
  glidepath: Array<{
    age: number;
    ageLabel: string;
    equity: number;
    debt: number;
    action: string;
    current?: boolean;
  }>;
  sipAllocation: {
    total: number;
    equityWeight: number;
    debtWeight: number;
    buckets: Array<{ label: string; amount: number; tone: "purple" | "slate" }>;
  };
  monthlyRoadmap: Array<{
    month: number;
    focus: string;
    equitySip: number;
    debtSip: number;
    projectedCorpus: number;
  }>;
  taxSavingMoves: Array<{
    title: string;
    detail: string;
  }>;
  decision: {
    status: "on_track" | "behind" | "not_feasible";
    retirementAgePossible: number;
    sipRequired: number;
    message: string;
  };
  scenarios: Array<{
    id: "current" | "recommended" | "conservative";
    label: string;
    retirementAgePossible: number;
    sip: number;
    corpusAtRetirement: number;
    status: "on_track" | "behind" | "not_feasible";
    message: string;
  }>;
  sensitivity: {
    lowerReturnAssumption: number;
    lowerReturnRetirementAge: number;
  };
};

export type TaxInputs = {
  baseSalary: number;
  hraComponent: number;
  annualRent: number;
  isMetro: boolean;
  section80c: number;
  nps: number;
  homeLoanInterest: number;
  otherDeductions: number;
};

export type TaxBreakdownRow = {
  label: string;
  amount: number;
  note?: string;
};

export type TaxResult = {
  oldRegimeTaxableIncome: number;
  newRegimeTaxableIncome: number;
  oldRegimeTax: number;
  newRegimeTax: number;
  optimalRegime: "Old" | "New";
  oldBreakdown: TaxBreakdownRow[];
  newBreakdown: TaxBreakdownRow[];
  missedDeductions: Array<{ label: string; amount: number; why: string }>;
  rankedInstruments: Array<{ name: string; liquidity: string; risk: string; rationale: string }>;
};

export type PortfolioFund = {
  name: string;
  amc: string;
  value: number;
  expenseRegular: number;
  expenseDirect: number;
  unitsHeldForMoreThanYear: number;
  nav: number;
  oneYearReturn: number;
  holdings: Array<{ stock: string; weight: number }>;
};

export type Cashflow = {
  date: string;
  amount: number;
};

export type PortfolioInputs = {
  funds: PortfolioFund[];
  cashflows: Cashflow[];
};

export type PortfolioResult = {
  portfolioValue: number;
  xirr: number;
  overlapByStock: Array<{ stock: string; weightedExposure: number; funds: string[] }>;
  expenseDragAnnual: number;
  rebalanceActions: Array<{ fromFund: string; toFund: string; amount: number; taxNote: string }>;
};

const round = (value: number) => Math.round(value);

export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const compactInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export function validateFireInputs(inputs: FireInputs): FireValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fields: FireValidation["fields"] = {};
  const currentYear = new Date().getFullYear();
  const maxExpenseYear = currentYear + Math.max(100 - inputs.age, 0);
  const monthlyIncome = inputs.annualIncome / 12;
  const pushFieldMessage = (
    key: string,
    tone: "errors" | "warnings",
    message: string,
  ) => {
    const current = fields[key] ?? { errors: [], warnings: [] };
    current[tone].push(message);
    fields[key] = current;
  };

  if (inputs.age < 18 || inputs.age > 70) {
    const message = "Current age should be between 18 and 70 years.";
    errors.push(message);
    pushFieldMessage("age", "errors", message);
  }

  if (inputs.retirementAge <= inputs.age + 5) {
    const message = "Retirement age must be at least 5 years after your current age.";
    errors.push(message);
    pushFieldMessage("retirementAge", "errors", message);
  }

  if (inputs.retirementAge > 75) {
    const message = "Retirement age above 75 is unusual for a FIRE plan. Double-check the target.";
    warnings.push(message);
    pushFieldMessage("retirementAge", "warnings", message);
  }

  if (inputs.lifeExpectancy <= inputs.retirementAge) {
    const message = "Life expectancy must be higher than retirement age.";
    errors.push(message);
    pushFieldMessage("lifeExpectancy", "errors", message);
  }

  if (inputs.lifeExpectancy < 85) {
    const message = "Life expectancy below 85 may understate longevity risk.";
    warnings.push(message);
    pushFieldMessage("lifeExpectancy", "warnings", message);
  }

  if (inputs.annualIncome <= 0) {
    const message = "Annual income must be greater than zero.";
    errors.push(message);
    pushFieldMessage("annualIncome", "errors", message);
  }

  if (inputs.monthlyExpenses <= 0) {
    const message = "Monthly expenses must be greater than zero.";
    errors.push(message);
    pushFieldMessage("monthlyExpenses", "errors", message);
  }

  if (inputs.monthlyExpenses >= monthlyIncome) {
    const message = "Monthly expenses must stay below monthly income for a workable FIRE plan.";
    errors.push(message);
    pushFieldMessage("monthlyExpenses", "errors", message);
  }

  if (inputs.currentMonthlySip < 0) {
    const message = "Current monthly SIP cannot be negative.";
    errors.push(message);
    pushFieldMessage("currentMonthlySip", "errors", message);
  }

  if (inputs.currentMonthlySip > Math.max(monthlyIncome - inputs.monthlyExpenses, 0)) {
    const message = "Current SIP is higher than the visible monthly surplus from your own income.";
    warnings.push(message);
    pushFieldMessage("currentMonthlySip", "warnings", message);
  }

  if (inputs.targetMonthlyDrawToday <= 0) {
    const message = "Retirement spending target must be greater than zero.";
    errors.push(message);
    pushFieldMessage("targetMonthlyDrawToday", "errors", message);
  } else if (inputs.targetMonthlyDrawToday < inputs.monthlyExpenses * 0.6) {
    const message = "Target retirement spending is much lower than current monthly expenses. Check whether lifestyle costs are understated.";
    warnings.push(message);
    pushFieldMessage("targetMonthlyDrawToday", "warnings", message);
  }

  if (inputs.preRetirementReturn < 0.06 || inputs.preRetirementReturn > 0.18) {
    const message = "Expected return is outside the usual 6% to 18% planning range.";
    warnings.push(message);
    pushFieldMessage("preRetirementReturn", "warnings", message);
  }

  if (inputs.inflationRate < 0.03 || inputs.inflationRate > 0.1) {
    const message = "Inflation is outside the usual 3% to 10% planning range.";
    warnings.push(message);
    pushFieldMessage("inflationRate", "warnings", message);
  }

  if (inputs.preRetirementReturn <= inputs.inflationRate) {
    const message = "Expected return is at or below inflation, which makes the plan unusually conservative.";
    warnings.push(message);
    pushFieldMessage("preRetirementReturn", "warnings", message);
  }

  if (inputs.safeWithdrawalRate < 0.025 || inputs.safeWithdrawalRate > 0.06) {
    const message = "Safe withdrawal rate is outside the typical 2.5% to 6% range.";
    warnings.push(message);
    pushFieldMessage("safeWithdrawalRate", "warnings", message);
  }

  if (inputs.currentLifeCover > 0 && !inputs.hasPureTermPlan) {
    const message = "Count life cover only if it is a pure term plan.";
    errors.push(message);
    pushFieldMessage("hasPureTermPlan", "errors", message);
  }

  if (inputs.currentLifeCover < 0) {
    const message = "Current life cover cannot be negative.";
    errors.push(message);
    pushFieldMessage("currentLifeCover", "errors", message);
  }

  if (inputs.liabilities < 0) {
    const message = "Outstanding liabilities cannot be negative.";
    errors.push(message);
    pushFieldMessage("liabilities", "errors", message);
  }

  if (inputs.dependents < 0) {
    const message = "Dependents cannot be negative.";
    errors.push(message);
    pushFieldMessage("dependents", "errors", message);
  }

  inputs.plannedExpenses.forEach((expense, index) => {
    const amountKey = `plannedExpenses.${index}.amountToday`;
    const yearKey = `plannedExpenses.${index}.year`;
    const hasAmount = expense.amountToday > 0;
    const hasYear = expense.year > 0;

    if (hasAmount !== hasYear) {
      const message = "Add both an amount and a year for each planned expense.";
      errors.push(message);
      pushFieldMessage(hasAmount ? yearKey : amountKey, "errors", message);
    }

    if (hasAmount && expense.year < currentYear) {
      const message = `Expense year must be ${currentYear} or later.`;
      errors.push(message);
      pushFieldMessage(yearKey, "errors", message);
    }

    if (hasAmount && expense.year > maxExpenseYear) {
      const message = `Expense year should stay within the planning horizon up to ${maxExpenseYear}.`;
      errors.push(message);
      pushFieldMessage(yearKey, "errors", message);
    }
  });

  const currentVisibleSurplus = Math.max(monthlyIncome - inputs.monthlyExpenses, 0);

  if (inputs.currentMonthlySip > currentVisibleSurplus) {
    const message = "Current SIP is higher than the visible monthly surplus.";
    warnings.push(message);
    pushFieldMessage("currentMonthlySip", "warnings", message);
  }

  return { errors, warnings, fields };
}

export function computeFirePlan(inputs: FireInputs): FirePlan {
  const currentYear = new Date().getFullYear();
  const yearsToRetire = Math.max(inputs.retirementAge - inputs.age, 1);
  const retirementYear = currentYear + yearsToRetire;
  const yearsAfterRetirement = Math.max(inputs.lifeExpectancy - inputs.retirementAge, 1);
  const targetMonthlyAtRetirement = round(
    inputs.targetMonthlyDrawToday * Math.pow(1 + inputs.inflationRate, yearsToRetire),
  );
  const targetCorpus = round(
    (targetMonthlyAtRetirement * 12) / Math.max(inputs.safeWithdrawalRate, 0.01),
  );
  const retirementCorpusBase =
    inputs.currentMfCorpus + inputs.currentPpfCorpus + inputs.epfCorpus;
  const currentSip = inputs.currentMonthlySip;
  const plannedExpenseSchedule = normalizePlannedExpenses(
    inputs.plannedExpenses,
    inputs.age,
    currentYear,
    retirementYear,
    inputs.inflationRate,
  );
  const accumulationExpenses = buildExpenseMap(plannedExpenseSchedule, "accumulation");
  const retirementExpenses = buildExpenseMap(plannedExpenseSchedule, "retirement");
  const currentPathAccumulation = simulateAccumulation({
    initialCorpus: retirementCorpusBase,
    startAge: inputs.age,
    startYear: currentYear,
    years: yearsToRetire,
    annualReturn: inputs.preRetirementReturn,
    getMonthlySip: () => currentSip,
    expenseMap: accumulationExpenses,
  });
  const requiredSip = round(
    findRequiredImmediateSip({
      targetCorpus,
      initialCorpus: retirementCorpusBase,
      startAge: inputs.age,
      startYear: currentYear,
      yearsToRetire,
      annualReturn: inputs.preRetirementReturn,
      expenseMap: accumulationExpenses,
    }),
  );
  const recommendedAccumulation = simulateAccumulation({
    initialCorpus: retirementCorpusBase,
    startAge: inputs.age,
    startYear: currentYear,
    years: yearsToRetire,
    annualReturn: inputs.preRetirementReturn,
    getMonthlySip: () => requiredSip,
    expenseMap: accumulationExpenses,
  });
  const estimatedRetirementAgeOnCurrentPath = solveAgeToTarget({
    initialCorpus: retirementCorpusBase,
    startAge: inputs.age,
    startYear: currentYear,
    annualReturn: inputs.preRetirementReturn,
    targetCorpus,
    monthlySip: currentSip,
    expenseMap: accumulationExpenses,
  });
  const recommendedDrawdown = simulateDrawdown({
    startingCorpus: recommendedAccumulation.endingCorpus,
    startAge: inputs.retirementAge,
    startYear: retirementYear,
    lifeExpectancy: inputs.lifeExpectancy,
    annualReturn: inputs.postRetirementReturn,
    inflationRate: inputs.inflationRate,
    startingAnnualSpend: targetMonthlyAtRetirement * 12,
    expenseMap: retirementExpenses,
  });
  const currentPathDrawdown = simulateDrawdown({
    startingCorpus: currentPathAccumulation.endingCorpus,
    startAge: inputs.retirementAge,
    startYear: retirementYear,
    lifeExpectancy: inputs.lifeExpectancy,
    annualReturn: inputs.postRetirementReturn,
    inflationRate: inputs.inflationRate,
    startingAnnualSpend: targetMonthlyAtRetirement * 12,
    expenseMap: retirementExpenses,
  });
  const emergencyFundTarget = round(inputs.monthlyExpenses * 6);
  const emergencyFundGap = round(
    Math.max(emergencyFundTarget - inputs.currentLiquidSavings, 0),
  );
  const annualExpenses = inputs.monthlyExpenses * 12;
  const primaryCoverTarget =
    inputs.dependents === 0
      ? round(inputs.liabilities)
      : round(
          Math.max(
            inputs.annualIncome * yearsToRetire +
              inputs.liabilities +
              10 * annualExpenses -
              retirementCorpusBase,
            0,
          ),
        );
  const primaryMonthlyTakeHome = estimateMonthlyTakeHome(inputs.annualIncome);
  const projectedPrimaryTakeHomeInYear5 = estimateMonthlyTakeHome(
    inputs.annualIncome * Math.pow(1 + inputs.annualIncomeGrowthRate, 4),
  );
  const projectedMonthlyTakeHomeInYear5 = round(projectedPrimaryTakeHomeInYear5);
  const grossMonthlyIncome = round(inputs.annualIncome / 12);
  const requiredSipShareOfIncome =
    grossMonthlyIncome > 0 ? requiredSip / grossMonthlyIncome : 0;
  const requiredSipShare =
    primaryMonthlyTakeHome > 0 ? requiredSip / primaryMonthlyTakeHome : 0;
  const projectedSipShareInYear5 =
    projectedMonthlyTakeHomeInYear5 > 0
      ? requiredSip / projectedMonthlyTakeHomeInYear5
      : 0;
  const isNotFeasible = requiredSipShareOfIncome > 0.4;
  const stepUpSipPlan = buildStepUpSipPlan({
    targetCorpus,
    initialCorpus: retirementCorpusBase,
    startAge: inputs.age,
    startYear: currentYear,
    yearsToRetire,
    annualReturn: inputs.preRetirementReturn,
    expenseMap: accumulationExpenses,
  });
  const lowerReturnAssumption = Math.max(inputs.preRetirementReturn - 0.02, 0.02);
  const conservativePostRetirementReturn = Math.max(
    inputs.postRetirementReturn - 0.02,
    0.01,
  );
  const lowerReturnRetirementAge = solveAgeToTarget({
    initialCorpus: retirementCorpusBase,
    startAge: inputs.age,
    startYear: currentYear,
    annualReturn: lowerReturnAssumption,
    targetCorpus,
    monthlySip: currentSip,
    expenseMap: accumulationExpenses,
  });
  const conservativeRequiredSip = round(
    findRequiredImmediateSip({
      targetCorpus,
      initialCorpus: retirementCorpusBase,
      startAge: inputs.age,
      startYear: currentYear,
      yearsToRetire,
      annualReturn: lowerReturnAssumption,
      expenseMap: accumulationExpenses,
    }),
  );
  const conservativeAccumulation = simulateAccumulation({
    initialCorpus: retirementCorpusBase,
    startAge: inputs.age,
    startYear: currentYear,
    years: yearsToRetire,
    annualReturn: lowerReturnAssumption,
    getMonthlySip: () => conservativeRequiredSip,
    expenseMap: accumulationExpenses,
  });
  const conservativeDrawdown = simulateDrawdown({
    startingCorpus: conservativeAccumulation.endingCorpus,
    startAge: inputs.retirementAge,
    startYear: retirementYear,
    lifeExpectancy: inputs.lifeExpectancy,
    annualReturn: conservativePostRetirementReturn,
    inflationRate: inputs.inflationRate,
    startingAnnualSpend: targetMonthlyAtRetirement * 12,
    expenseMap: retirementExpenses,
  });
  const horizonAge = Math.max(inputs.lifeExpectancy, inputs.retirementAge + 5);
  const glidepath = buildGlidepath(inputs.age, inputs.retirementAge);
  const sipAllocation = buildSipAllocation(requiredSip, glidepath[0]?.equity ?? 50);
  const monthlyRoadmap = buildMonthlyRoadmap({
    initialCorpus: retirementCorpusBase,
    annualReturn: inputs.preRetirementReturn,
    requiredSip,
    sipAllocation,
    emergencyFundGap,
    insuranceGap: Math.max(primaryCoverTarget - inputs.currentLifeCover, 0),
  });
  const taxSavingMoves = buildTaxSavingMoves(sipAllocation);
  const retirementAgePossible = isNotFeasible
    ? solveFeasibleRetirementAge({
        inputs,
        initialCorpus: retirementCorpusBase,
        currentYear,
        expenseMap: accumulationExpenses,
        monthlyIncomeCap: grossMonthlyIncome * 0.4,
      })
    : estimatedRetirementAgeOnCurrentPath;
  const currentStatus =
    currentSip >= requiredSip && currentPathDrawdown.lastsUntilAge >= inputs.lifeExpectancy
      ? ("on_track" as const)
      : isNotFeasible
        ? ("not_feasible" as const)
        : ("behind" as const);
  const decisionStatus = isNotFeasible
    ? ("not_feasible" as const)
    : currentStatus === "on_track"
      ? ("on_track" as const)
      : ("behind" as const);
  const decisionMessage = isNotFeasible
    ? `You cannot retire at ${inputs.retirementAge} with a required SIP of ${inr(requiredSip)} because that is ${formatPercent(requiredSipShareOfIncome * 100)} of your monthly income. Delay retirement toward age ${Math.round(retirementAgePossible)}, reduce retirement spending, or use the ${formatPercent(stepUpSipPlan.annualIncreaseRate * 100)} step-up SIP path starting at ${inr(stepUpSipPlan.yearOneSip)}.`
    : currentStatus === "on_track"
      ? `You are on track for age ${inputs.retirementAge}. Keep the monthly SIP near ${inr(requiredSip)} and the corpus is projected to last until age ${recommendedDrawdown.lastsUntilAge}.`
      : `You are behind the target for age ${inputs.retirementAge}. At the current SIP of ${inr(currentSip)}, retirement lands closer to age ${estimatedRetirementAgeOnCurrentPath}. Increase SIP by ${inr(Math.max(requiredSip - currentSip, 0))}, reduce retirement spending, or step up gradually from ${inr(stepUpSipPlan.yearOneSip)}.`;
  const scenarios: FirePlan["scenarios"] = [
    {
      id: "current",
      label: "Current plan",
      retirementAgePossible: estimatedRetirementAgeOnCurrentPath,
      sip: round(currentSip),
      corpusAtRetirement: round(currentPathAccumulation.endingCorpus),
      status: currentStatus,
      message:
        currentStatus === "on_track"
          ? `Current SIP already supports age ${inputs.retirementAge}.`
          : `Current SIP reaches the target closer to age ${estimatedRetirementAgeOnCurrentPath}.`,
    },
    {
      id: "recommended",
      label: "Recommended plan",
      retirementAgePossible: inputs.retirementAge,
      sip: requiredSip,
      corpusAtRetirement: round(recommendedAccumulation.endingCorpus),
      status: isNotFeasible ? "not_feasible" : "on_track",
      message: isNotFeasible
        ? `The direct SIP of ${inr(requiredSip)} is too high relative to income.`
        : `This SIP gets you to age ${inputs.retirementAge} with the target corpus.`,
    },
    {
      id: "conservative",
      label: "Conservative plan",
      retirementAgePossible: Math.max(inputs.retirementAge, lowerReturnRetirementAge),
      sip: conservativeRequiredSip,
      corpusAtRetirement: round(conservativeAccumulation.endingCorpus),
      status:
        conservativeRequiredSip > grossMonthlyIncome * 0.4 ? "not_feasible" : "behind",
      message: `At ${formatPercent(lowerReturnAssumption * 100)} accumulation returns, the plan needs about ${inr(conservativeRequiredSip)} per month.`,
    },
  ];

  return {
    yearsToRetire,
    retirementYear,
    yearsAfterRetirement,
    targetMonthlyAtRetirement,
    targetCorpus,
    projectedCorpusWithoutChanges: round(currentPathAccumulation.endingCorpus),
    recommendedCorpusAtRetirement: round(recommendedAccumulation.endingCorpus),
    requiredSip,
    currentSip: round(currentSip),
    estimatedRetirementAgeOnCurrentPath,
    assumptions: {
      preRetirementReturn: inputs.preRetirementReturn,
      postRetirementReturn: inputs.postRetirementReturn,
      inflationRate: inputs.inflationRate,
      safeWithdrawalRate: inputs.safeWithdrawalRate,
      incomeGrowthRate: inputs.annualIncomeGrowthRate,
      retirementDrawToday: inputs.targetMonthlyDrawToday,
      retirementDrawAtRetirement: targetMonthlyAtRetirement,
    },
    emergencyFund: {
      target: emergencyFundTarget,
      currentLiquidSavings: round(inputs.currentLiquidSavings),
      gap: emergencyFundGap,
      note:
        inputs.currentLiquidSavings === 0
          ? "No liquid emergency reserve is currently recorded."
          : undefined,
    },
    insurance: {
      primaryTarget: primaryCoverTarget,
      primaryGap: round(Math.max(primaryCoverTarget - inputs.currentLifeCover, 0)),
    },
    takeHomeFeasibility: {
      grossMonthlyIncome,
      primaryMonthlyTakeHome: round(primaryMonthlyTakeHome),
      monthlyTakeHome: round(primaryMonthlyTakeHome),
      requiredSipShareOfIncome,
      requiredSipShare,
      projectedMonthlyTakeHomeInYear5,
      projectedSipShareInYear5,
      isStretched: requiredSipShare > 0.6,
      isNotFeasible,
    },
    longevity: {
      lastsUntilAge: recommendedDrawdown.lastsUntilAge,
      status: recommendedDrawdown.status,
      exhaustionAge: recommendedDrawdown.exhaustionAge,
      targetReachedLifeExpectancy:
        recommendedDrawdown.exhaustionAge === null ||
        recommendedDrawdown.exhaustionAge >= inputs.lifeExpectancy,
    },
    stepUpSipPlan,
    plannedExpenseSchedule,
    chartSeries: {
      horizonAge,
      retirementAge: inputs.retirementAge,
      lifeExpectancy: inputs.lifeExpectancy,
      goalCorpus: targetCorpus,
      currentPath: trimChartSeries(
        [...currentPathAccumulation.points, ...currentPathDrawdown.points],
        horizonAge,
      ),
      targetPath: trimChartSeries(
        [...recommendedAccumulation.points, ...recommendedDrawdown.points],
        horizonAge,
      ),
      conservativePath: trimChartSeries(
        [...conservativeAccumulation.points, ...conservativeDrawdown.points],
        horizonAge,
      ),
      expenseMarkers: plannedExpenseSchedule.map((expense) => ({
        age: expense.age,
        year: expense.year,
        label: `${expense.year}: ${compactInr(expense.inflatedAmount)}`,
        phase: expense.phase,
      })),
      currentExhaustionAge: currentPathDrawdown.exhaustionAge,
      targetExhaustionAge: recommendedDrawdown.exhaustionAge,
      conservativeExhaustionAge: conservativeDrawdown.exhaustionAge,
    },
    glidepath,
    sipAllocation,
    monthlyRoadmap,
    taxSavingMoves,
    decision: {
      status: decisionStatus,
      retirementAgePossible,
      sipRequired: requiredSip,
      message: decisionMessage,
    },
    scenarios,
    sensitivity: {
      lowerReturnAssumption,
      lowerReturnRetirementAge,
    },
  };
}

function normalizePlannedExpenses(
  plannedExpenses: PlannedExpenseInput[],
  currentAge: number,
  currentYear: number,
  retirementYear: number,
  inflationRate: number,
) {
  return plannedExpenses
    .filter((expense) => expense.amountToday > 0 && expense.year > 0)
    .map((expense) => {
      const yearsAhead = Math.max(expense.year - currentYear, 0);
      return {
        year: expense.year,
        age: Number((currentAge + yearsAhead).toFixed(1)),
        amountToday: round(expense.amountToday),
        inflatedAmount: round(
          expense.amountToday * Math.pow(1 + inflationRate, yearsAhead),
        ),
        phase:
          expense.year <= retirementYear
            ? ("accumulation" as const)
            : ("retirement" as const),
      };
    })
    .sort((left, right) => left.year - right.year);
}

function buildExpenseMap(
  expenses: FirePlan["plannedExpenseSchedule"],
  phase: "accumulation" | "retirement",
) {
  return expenses
    .filter((expense) => expense.phase === phase)
    .reduce((map, expense) => {
      map.set(expense.year, (map.get(expense.year) ?? 0) + expense.inflatedAmount);
      return map;
    }, new Map<number, number>());
}

function getMonthlyRate(annualRate: number) {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

function simulateAccumulation({
  initialCorpus,
  startAge,
  startYear,
  years,
  annualReturn,
  getMonthlySip,
  expenseMap,
}: {
  initialCorpus: number;
  startAge: number;
  startYear: number;
  years: number;
  annualReturn: number;
  getMonthlySip: (yearOffset: number) => number;
  expenseMap: Map<number, number>;
}) {
  const monthlyRate = getMonthlyRate(annualReturn);
  const points: FireChartPoint[] = [
    { age: startAge, year: startYear, corpus: round(Math.max(initialCorpus, 0)) },
  ];
  let corpus = Math.max(initialCorpus, 0);

  for (let yearOffset = 0; yearOffset < years; yearOffset += 1) {
    const simulationYear = startYear + yearOffset;
    corpus = Math.max(corpus - (expenseMap.get(simulationYear) ?? 0), 0);
    const monthlySip = Math.max(getMonthlySip(yearOffset), 0);

    for (let month = 0; month < 12; month += 1) {
      corpus = corpus * (1 + monthlyRate) + monthlySip;
    }

    points.push({
      age: startAge + yearOffset + 1,
      year: simulationYear + 1,
      corpus: round(Math.max(corpus, 0)),
    });
  }

  return {
    endingCorpus: Math.max(corpus, 0),
    points,
  };
}

function simulateDrawdown({
  startingCorpus,
  startAge,
  startYear,
  lifeExpectancy,
  annualReturn,
  inflationRate,
  startingAnnualSpend,
  expenseMap,
}: {
  startingCorpus: number;
  startAge: number;
  startYear: number;
  lifeExpectancy: number;
  annualReturn: number;
  inflationRate: number;
  startingAnnualSpend: number;
  expenseMap: Map<number, number>;
}) {
  const points: FireChartPoint[] = [];
  let corpus = Math.max(startingCorpus, 0);
  const annualSpend = startingAnnualSpend;
  const realReturn = (1 + annualReturn) / (1 + inflationRate) - 1;
  let exhaustionAge: number | null = null;

  for (let yearOffset = 0; startAge + yearOffset < lifeExpectancy; yearOffset += 1) {
    const currentAge = startAge + yearOffset;
    const simulationYear = startYear + yearOffset;
    corpus = Math.max(corpus - (expenseMap.get(simulationYear) ?? 0), 0);

    if (corpus <= 0) {
      exhaustionAge = currentAge;
      points.push({ age: currentAge, year: simulationYear, corpus: 0 });
      break;
    }

    corpus = Math.max(corpus * (1 + realReturn) - annualSpend, 0);

    if (corpus <= 0) {
      exhaustionAge = currentAge + 1;
      points.push({ age: currentAge + 1, year: simulationYear + 1, corpus: 0 });
      break;
    }

    points.push({
      age: currentAge + 1,
      year: simulationYear + 1,
      corpus: round(corpus),
    });
  }

  const lastsUntilAge = exhaustionAge ?? lifeExpectancy;
  return {
    points,
    exhaustionAge,
    lastsUntilAge,
    status:
      lastsUntilAge < 85
        ? ("critical" as const)
        : lastsUntilAge < 90
          ? ("watch" as const)
          : ("strong" as const),
  };
}

function trimChartSeries(points: FireChartPoint[], horizonAge: number) {
  return points
    .filter((point) => point.age <= horizonAge)
    .map((point) => ({ ...point, corpus: Math.max(point.corpus, 0) }));
}

function solveAgeToTarget({
  initialCorpus,
  startAge,
  startYear,
  annualReturn,
  targetCorpus,
  monthlySip,
  expenseMap,
}: {
  initialCorpus: number;
  startAge: number;
  startYear: number;
  annualReturn: number;
  targetCorpus: number;
  monthlySip: number;
  expenseMap: Map<number, number>;
}) {
  if (initialCorpus >= targetCorpus) {
    return Number(startAge.toFixed(1));
  }

  const monthlyRate = getMonthlyRate(annualReturn);
  let corpus = Math.max(initialCorpus, 0);
  const maxMonths = Math.max(Math.round((100 - startAge) * 12), 12);

  for (let month = 0; month < maxMonths; month += 1) {
    if (month % 12 === 0) {
      const simulationYear = startYear + month / 12;
      corpus = Math.max(corpus - (expenseMap.get(simulationYear) ?? 0), 0);
      if (corpus >= targetCorpus) {
        return Number((startAge + month / 12).toFixed(1));
      }
    }

    corpus = corpus * (1 + monthlyRate) + monthlySip;

    if (corpus >= targetCorpus) {
      return Number((startAge + (month + 1) / 12).toFixed(1));
    }
  }

  return 100;
}

function findRequiredImmediateSip({
  targetCorpus,
  initialCorpus,
  startAge,
  startYear,
  yearsToRetire,
  annualReturn,
  expenseMap,
}: {
  targetCorpus: number;
  initialCorpus: number;
  startAge: number;
  startYear: number;
  yearsToRetire: number;
  annualReturn: number;
  expenseMap: Map<number, number>;
}) {
  const simulate = (monthlySip: number) =>
    simulateAccumulation({
      initialCorpus,
      startAge,
      startYear,
      years: yearsToRetire,
      annualReturn,
      getMonthlySip: () => monthlySip,
      expenseMap,
    }).endingCorpus;

  if (simulate(0) >= targetCorpus) {
    return 0;
  }

  const months = Math.max(yearsToRetire * 12, 1);
  const monthlyRate = getMonthlyRate(annualReturn);
  const futureExistingCorpus = simulateAccumulation({
    initialCorpus,
    startAge,
    startYear,
    years: yearsToRetire,
    annualReturn,
    getMonthlySip: () => 0,
    expenseMap,
  }).endingCorpus;
  const netGap = Math.max(targetCorpus - futureExistingCorpus, 0);
  const sipFactor =
    monthlyRate === 0
      ? months
      : (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

  let low = 0;
  let high = Math.max(netGap / Math.max(sipFactor, 1), 25_000);

  while (simulate(high) < targetCorpus && high < 5_000_000) {
    high *= 2;
  }

  for (let step = 0; step < 50; step += 1) {
    const mid = (low + high) / 2;
    if (simulate(mid) >= targetCorpus) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

function solveFeasibleRetirementAge({
  inputs,
  initialCorpus,
  currentYear,
  expenseMap,
  monthlyIncomeCap,
}: {
  inputs: FireInputs;
  initialCorpus: number;
  currentYear: number;
  expenseMap: Map<number, number>;
  monthlyIncomeCap: number;
}) {
  for (
    let candidateAge = inputs.retirementAge;
    candidateAge <= inputs.lifeExpectancy;
    candidateAge += 1
  ) {
    const candidateYears = Math.max(candidateAge - inputs.age, 1);
    const candidateTargetMonthly = round(
      inputs.targetMonthlyDrawToday *
        Math.pow(1 + inputs.inflationRate, candidateYears),
    );
    const candidateCorpus = round(
      (candidateTargetMonthly * 12) / Math.max(inputs.safeWithdrawalRate, 0.01),
    );
    const candidateSip = findRequiredImmediateSip({
      targetCorpus: candidateCorpus,
      initialCorpus,
      startAge: inputs.age,
      startYear: currentYear,
      yearsToRetire: candidateYears,
      annualReturn: inputs.preRetirementReturn,
      expenseMap,
    });

    if (candidateSip <= monthlyIncomeCap) {
      return candidateAge;
    }
  }

  return inputs.lifeExpectancy;
}

function buildStepUpSipPlan({
  targetCorpus,
  initialCorpus,
  startAge,
  startYear,
  yearsToRetire,
  annualReturn,
  expenseMap,
}: {
  targetCorpus: number;
  initialCorpus: number;
  startAge: number;
  startYear: number;
  yearsToRetire: number;
  annualReturn: number;
  expenseMap: Map<number, number>;
}) {
  const annualIncreaseRate = 0.1;
  const simulate = (yearOneSip: number) =>
    simulateAccumulation({
      initialCorpus,
      startAge,
      startYear,
      years: yearsToRetire,
      annualReturn,
      getMonthlySip: (yearOffset) =>
        yearOneSip * Math.pow(1 + annualIncreaseRate, yearOffset),
      expenseMap,
    }).endingCorpus;

  let low = 0;
  let high = 25_000;

  while (simulate(high) < targetCorpus && high < 5_000_000) {
    high *= 2;
  }

  for (let step = 0; step < 50; step += 1) {
    const mid = (low + high) / 2;
    if (simulate(mid) >= targetCorpus) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const yearOneSip = round(high);
  return {
    yearOneSip,
    annualIncreaseRate,
    yearTenSip: round(yearOneSip * Math.pow(1 + annualIncreaseRate, 9)),
    reachesTarget: simulate(yearOneSip) >= targetCorpus,
  };
}

function estimateMonthlyTakeHome(annualIncome: number) {
  const taxableIncome = Math.max(annualIncome - 75_000, 0);
  const taxWithCess = applyNewRegimeSlabs(taxableIncome) * 1.04;
  return Math.max(annualIncome - taxWithCess, 0) / 12;
}

function buildGlidepath(currentAge: number, retirementAge: number) {
  const startEquity = Math.max(100 - currentAge, 50);
  const checkpoints = [
    currentAge,
    Math.min(
      currentAge + Math.max(Math.round((retirementAge - currentAge) / 3), 1),
      retirementAge,
    ),
    Math.min(
      currentAge + Math.max(Math.round(((retirementAge - currentAge) * 2) / 3), 2),
      retirementAge,
    ),
    retirementAge,
  ];
  const uniquePoints = [...new Set(checkpoints)].filter(
    (age) => age >= currentAge && age <= retirementAge,
  );

  return uniquePoints.map((age, index) => {
    const progress =
      uniquePoints.length === 1 ? 1 : index / Math.max(uniquePoints.length - 1, 1);
    const equity = round(startEquity - (startEquity - 50) * progress);
    const debt = 100 - equity;
    return {
      age,
      ageLabel:
        age === currentAge
          ? `${age} yrs (now)`
          : age === retirementAge
            ? `${age} yrs (retire)`
            : `${age} yrs`,
      equity,
      debt,
      action:
        index === 0
          ? "Start with the current allocation"
          : age === retirementAge
            ? "Shift to retirement income mode"
            : index === 1
              ? "First rebalance checkpoint"
              : "Reduce risk gradually",
      current: age === currentAge,
    };
  });
}

function buildSipAllocation(totalSip: number, equityWeight: number) {
  const equityPortion = round(totalSip * (equityWeight / 100));
  const debtPortion = Math.max(totalSip - equityPortion, 0);
  const largeCap = round(equityPortion * 0.5);
  const midCap = round(equityPortion * 0.3);
  const smallCap = Math.max(equityPortion - largeCap - midCap, 0);
  const desiredPpf = round(debtPortion * 0.3);
  const ppf = Math.min(desiredPpf, 12_500);
  const debtLiquid = Math.max(debtPortion - ppf, 0);

  return {
    total: round(totalSip),
    equityWeight,
    debtWeight: 100 - equityWeight,
    buckets: [
      { label: "Large cap equity", amount: largeCap, tone: "purple" as const },
      { label: "Mid cap equity", amount: midCap, tone: "purple" as const },
      { label: "Small cap equity", amount: smallCap, tone: "purple" as const },
      { label: "Debt / liquid fund", amount: debtLiquid, tone: "slate" as const },
      { label: "PPF", amount: ppf, tone: "slate" as const },
    ],
  };
}

function buildMonthlyRoadmap({
  initialCorpus,
  annualReturn,
  requiredSip,
  sipAllocation,
  emergencyFundGap,
  insuranceGap,
}: {
  initialCorpus: number;
  annualReturn: number;
  requiredSip: number;
  sipAllocation: FirePlan["sipAllocation"];
  emergencyFundGap: number;
  insuranceGap: number;
}) {
  const monthlyRate = getMonthlyRate(annualReturn);
  const equitySip = round(
    sipAllocation.buckets
      .filter((bucket) => bucket.tone === "purple")
      .reduce((sum, bucket) => sum + bucket.amount, 0),
  );
  const debtSip = round(requiredSip - equitySip);
  let corpus = Math.max(initialCorpus, 0);

  return Array.from({ length: 12 }, (_, index) => {
    corpus = corpus * (1 + monthlyRate) + requiredSip;
    const month = index + 1;
    let focus = "Stay on the planned SIP split and review progress at month end.";

    if (month <= 3 && emergencyFundGap > 0) {
      focus = `Keep building the emergency fund while you close the ${inr(emergencyFundGap)} reserve gap.`;
    } else if (month <= 3 && insuranceGap > 0) {
      focus = `Close the ${inr(insuranceGap)} life-cover gap before increasing lifestyle spending.`;
    } else if (month <= 6) {
      focus = "Keep equity and debt contributions on target and avoid breaking the SIP cadence.";
    } else if (month <= 9) {
      focus = "Review whether the glidepath still matches your risk capacity and rebalance if needed.";
    } else {
      focus = "Prepare the annual review and decide whether to step up SIPs next year.";
    }

    return {
      month,
      focus,
      equitySip,
      debtSip,
      projectedCorpus: round(corpus),
    };
  });
}

function buildTaxSavingMoves(sipAllocation: FirePlan["sipAllocation"]) {
  const ppfBucket = sipAllocation.buckets.find((bucket) => bucket.label === "PPF");
  const debtBucket = sipAllocation.buckets.find(
    (bucket) => bucket.label === "Debt / liquid fund",
  );
  const annualPpfContribution = round((ppfBucket?.amount ?? 0) * 12);
  const annualPpfCap = 150_000;

  return [
    {
      title: "Use PPF inside the debt sleeve",
      detail: `Route ${inr(ppfBucket?.amount ?? 0)} per month into PPF, or about ${inr(annualPpfContribution)} per year, as the tax-efficient part of the debt allocation.`,
    },
    {
      title: "Keep the rest of debt liquid",
      detail: `Use about ${inr(debtBucket?.amount ?? 0)} per month in debt or liquid funds so the full debt sleeve still matches the required SIP.`,
    },
    {
      title: "Watch the yearly PPF cap",
      detail: `The current plan keeps the PPF leg within the ${inr(annualPpfCap)} yearly contribution limit while preserving the total SIP split.`,
    },
  ];
}

export function computeTaxPlan(inputs: TaxInputs): TaxResult {
  const grossSalary = inputs.baseSalary + inputs.hraComponent;
  const oldStandardDeduction = 50_000;
  const newStandardDeduction = 75_000;
  const hraExemption = Math.max(
    0,
    Math.min(
      inputs.hraComponent,
      inputs.annualRent - inputs.baseSalary * 0.1,
      inputs.baseSalary * (inputs.isMetro ? 0.5 : 0.4),
    ),
  );
  const oldDeductions =
    oldStandardDeduction +
    hraExemption +
    inputs.section80c +
    inputs.nps +
    inputs.homeLoanInterest +
    inputs.otherDeductions;
  const newDeductions = newStandardDeduction;

  const oldRegimeTaxableIncome = Math.max(grossSalary - oldDeductions, 0);
  const newRegimeTaxableIncome = Math.max(grossSalary - newDeductions, 0);

  const oldRegimeTax = round(applyOldRegimeSlabs(oldRegimeTaxableIncome) * 1.04);
  const newRegimeTax = round(applyNewRegimeSlabs(newRegimeTaxableIncome) * 1.04);

  const missedDeductions = [
    {
      label: "Section 80D health insurance",
      amount: 25_000,
      why: "Available if the user or parents pay health insurance premiums.",
    },
    {
      label: "Additional NPS under 80CCD(1B)",
      amount: Math.max(50_000 - inputs.nps, 0),
      why: "Can lower old-regime taxable income if room is still available.",
    },
    {
      label: "Home-loan interest optimisation",
      amount: Math.max(200_000 - inputs.homeLoanInterest, 0),
      why: "Self-occupied property interest deduction is allowed up to ₹2L in old regime.",
    },
  ].filter((item) => item.amount > 0);

  const rankedInstruments = [
    {
      name: "ELSS funds",
      liquidity: "Medium",
      risk: "Moderate-High",
      rationale: "3-year lock-in, market-linked growth, fits long-term savers who still need 80C room.",
    },
    {
      name: "PPF",
      liquidity: "Low",
      risk: "Low",
      rationale: "Long lock-in but stable sovereign-backed tax-efficient savings for conservative goals.",
    },
    {
      name: "Tax-saver FD / 5-year FD",
      liquidity: "Low",
      risk: "Low",
      rationale: "Useful when capital stability matters more than upside, but returns are fully taxable.",
    },
  ];

  return {
    oldRegimeTaxableIncome: round(oldRegimeTaxableIncome),
    newRegimeTaxableIncome: round(newRegimeTaxableIncome),
    oldRegimeTax,
    newRegimeTax,
    optimalRegime: oldRegimeTax <= newRegimeTax ? "Old" : "New",
    oldBreakdown: [
      { label: "Gross salary", amount: grossSalary },
      { label: "Standard deduction", amount: -oldStandardDeduction },
      { label: "HRA exemption", amount: -round(hraExemption), note: inputs.isMetro ? "Metro city formula applied" : "Non-metro formula applied" },
      { label: "Section 80C", amount: -inputs.section80c },
      { label: "NPS 80CCD(1B)", amount: -inputs.nps },
      { label: "Home-loan interest", amount: -inputs.homeLoanInterest },
      { label: "Other deductions", amount: -inputs.otherDeductions },
      { label: "Taxable income", amount: oldRegimeTaxableIncome },
      { label: "Tax + cess", amount: oldRegimeTax },
    ],
    newBreakdown: [
      { label: "Gross salary", amount: grossSalary },
      { label: "Standard deduction", amount: -newStandardDeduction },
      { label: "Taxable income", amount: newRegimeTaxableIncome },
      { label: "Tax + cess", amount: newRegimeTax },
    ],
    missedDeductions,
    rankedInstruments,
  };
}

function applyOldRegimeSlabs(income: number) {
  return taxBySlabs(income, [
    [250_000, 0],
    [500_000, 0.05],
    [1_000_000, 0.2],
    [Infinity, 0.3],
  ]);
}

function applyNewRegimeSlabs(income: number) {
  return taxBySlabs(income, [
    [400_000, 0],
    [800_000, 0.05],
    [1_200_000, 0.1],
    [1_600_000, 0.15],
    [2_000_000, 0.2],
    [2_400_000, 0.25],
    [Infinity, 0.3],
  ]);
}

function taxBySlabs(
  income: number,
  slabs: Array<[upperLimit: number, rate: number]>,
) {
  let tax = 0;
  let lower = 0;

  slabs.forEach(([upper, rate]) => {
    const taxable = Math.max(Math.min(income, upper) - lower, 0);
    tax += taxable * rate;
    lower = upper;
  });

  return tax;
}

export function computePortfolio(inputs: PortfolioInputs): PortfolioResult {
  const portfolioValue = inputs.funds.reduce((sum, fund) => sum + fund.value, 0);
  const xirr = xirrFromCashflows(
    [...inputs.cashflows, { date: "2026-03-28", amount: portfolioValue }],
    0.12,
  );

  const exposureMap = new Map<string, { weightedExposure: number; funds: string[] }>();
  inputs.funds.forEach((fund) => {
    const fundWeight = fund.value / portfolioValue;
    fund.holdings.forEach((holding) => {
      const current = exposureMap.get(holding.stock) ?? { weightedExposure: 0, funds: [] };
      current.weightedExposure += holding.weight * fundWeight;
      current.funds.push(fund.name);
      exposureMap.set(holding.stock, current);
    });
  });

  const overlapByStock = [...exposureMap.entries()]
    .map(([stock, data]) => ({
      stock,
      weightedExposure: data.weightedExposure * 100,
      funds: [...new Set(data.funds)],
    }))
    .filter((item) => item.funds.length >= 3)
    .sort((a, b) => b.weightedExposure - a.weightedExposure);

  const expenseDragAnnual = round(
    inputs.funds.reduce(
      (sum, fund) => sum + fund.value * ((fund.expenseRegular - fund.expenseDirect) / 100),
      0,
    ),
  );

  const overlapFund = inputs.funds.find((fund) => fund.name.includes("Bluechip"));
  const taxEfficientSource = inputs.funds.find((fund) => fund.name.includes("Large Cap"));
  const destination = inputs.funds.find((fund) => fund.name.includes("Flexi Cap"));

  const rebalanceActions =
    overlapFund && taxEfficientSource && destination
      ? [
          {
            fromFund: overlapFund.name,
            toFund: destination.name,
            amount: 250_000,
            taxNote:
              "Redeem only units held for more than 1 year to avoid short-term capital gains tax on equity funds.",
          },
          {
            fromFund: taxEfficientSource.name,
            toFund: "Bharat Bond ETF / short-duration debt",
            amount: 150_000,
            taxNote:
              "Shift mature overlap exposure into debt for near-term goals and maintain equity diversification.",
          },
        ]
      : [];

  return {
    portfolioValue: round(portfolioValue),
    xirr: Number((xirr * 100).toFixed(2)),
    overlapByStock,
    expenseDragAnnual,
    rebalanceActions,
  };
}

function xirrFromCashflows(cashflows: Cashflow[], guess: number) {
  let rate = guess;
  const dates = cashflows.map((flow) => new Date(flow.date));
  const firstDate = dates[0];

  for (let iteration = 0; iteration < 50; iteration += 1) {
    let value = 0;
    let derivative = 0;

    cashflows.forEach((flow, index) => {
      const years = (dates[index].getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      const denominator = Math.pow(1 + rate, years);
      value += flow.amount / denominator;
      derivative -= (years * flow.amount) / (denominator * (1 + rate));
    });

    const next = rate - value / derivative;
    if (Math.abs(next - rate) < 0.000001) {
      return next;
    }
    rate = next;
  }

  return rate;
}
