export type FireInputs = {
  age: number;
  retirementAge: number;
  annualIncome: number;
  monthlyExpenses: number;
  currentMfCorpus: number;
  currentPpfCorpus: number;
  targetMonthlyDrawToday: number;
  currentMonthlySip: number;
  inflationRate: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  safeWithdrawalRate: number;
  currentLifeCover: number;
  healthCover: number;
  liabilities: number;
};

export type FirePlan = {
  yearsToRetire: number;
  targetMonthlyAtRetirement: number;
  targetCorpus: number;
  projectedCorpusWithoutChanges: number;
  requiredSip: number;
  estimatedRetirementAgeOnCurrentPath: number;
  emergencyFundTarget: number;
  emergencyFundGap: number;
  lifeCoverTarget: number;
  lifeCoverGap: number;
  monthByMonth: Array<{
    month: number;
    age: number;
    equitySip: number;
    debtSip: number;
    equityWeight: number;
    debtWeight: number;
    projectedCorpus: number;
  }>;
};

export type FireValidation = {
  errors: string[];
  warnings: string[];
  fields: Partial<
    Record<
      keyof FireInputs,
      {
        errors: string[];
        warnings: string[];
      }
    >
  >;
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
  const monthlyIncome = inputs.annualIncome / 12;
  const pushFieldMessage = (
    key: keyof FireInputs,
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

  if (inputs.retirementAge <= inputs.age) {
    const message = "Retirement age must be greater than current age.";
    errors.push(message);
    pushFieldMessage("retirementAge", "errors", message);
  }

  if (inputs.retirementAge > 75) {
    const message = "Retirement age above 75 is unusual for a FIRE plan. Double-check the target.";
    warnings.push(message);
    pushFieldMessage("retirementAge", "warnings", message);
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
    const message = "Monthly expenses are at or above monthly income, so the current surplus is very tight.";
    warnings.push(message);
    pushFieldMessage("monthlyExpenses", "warnings", message);
  }

  if (inputs.currentMonthlySip > monthlyIncome) {
    const message = "Current SIP cannot realistically exceed your full monthly income.";
    errors.push(message);
    pushFieldMessage("currentMonthlySip", "errors", message);
  }

  if (inputs.currentMonthlySip > Math.max(monthlyIncome - inputs.monthlyExpenses, 0) * 1.6) {
    const message = "Current SIP is much higher than the visible monthly surplus. Verify income, expenses, or SIP value.";
    warnings.push(message);
    pushFieldMessage("currentMonthlySip", "warnings", message);
  }

  if (inputs.targetMonthlyDrawToday < inputs.monthlyExpenses * 0.6) {
    const message = "Target retirement spending is much lower than current monthly expenses. Check whether lifestyle costs are understated.";
    warnings.push(message);
    pushFieldMessage("targetMonthlyDrawToday", "warnings", message);
  }

  if (inputs.preRetirementReturn <= inputs.inflationRate) {
    const message = "Expected return is at or below inflation, which makes the plan unusually conservative.";
    warnings.push(message);
    pushFieldMessage("preRetirementReturn", "warnings", message);
  }

  if (inputs.safeWithdrawalRate < 0.025 || inputs.safeWithdrawalRate > 0.06) {
    warnings.push("Safe withdrawal rate is outside the typical 2.5% to 6% range.");
  }

  if (inputs.currentLifeCover < inputs.liabilities * 0.25) {
    const message = "Current life cover looks low relative to liabilities and family protection needs.";
    warnings.push(message);
    pushFieldMessage("currentLifeCover", "warnings", message);
  }

  return { errors, warnings, fields };
}

export function computeFirePlan(inputs: FireInputs): FirePlan {
  const yearsToRetire = Math.max(inputs.retirementAge - inputs.age, 1);
  const monthsToRetire = yearsToRetire * 12;
  const monthlyInflation = inputs.inflationRate / 12;
  const monthlyGrowth = inputs.preRetirementReturn / 12;
  const targetMonthlyAtRetirement =
    inputs.targetMonthlyDrawToday * Math.pow(1 + monthlyInflation, monthsToRetire);
  const targetCorpus =
    (targetMonthlyAtRetirement * 12) / Math.max(inputs.safeWithdrawalRate, 0.01);
  const currentCorpus = inputs.currentMfCorpus + inputs.currentPpfCorpus;
  const projectedCorpusWithoutChanges =
    currentCorpus * Math.pow(1 + monthlyGrowth, monthsToRetire) +
    inputs.currentMonthlySip *
      ((Math.pow(1 + monthlyGrowth, monthsToRetire) - 1) / Math.max(monthlyGrowth, 0.0001));

  const growthFactor = Math.pow(1 + monthlyGrowth, monthsToRetire);
  const sipFactor = (growthFactor - 1) / Math.max(monthlyGrowth, 0.0001);
  const requiredSip = Math.max((targetCorpus - currentCorpus * growthFactor) / sipFactor, 0);

  const monthsToTargetOnCurrentPath = solveMonthsToTarget(
    currentCorpus,
    inputs.currentMonthlySip,
    monthlyGrowth,
    targetCorpus,
  );
  const estimatedRetirementAgeOnCurrentPath = inputs.age + monthsToTargetOnCurrentPath / 12;

  const emergencyFundTarget = inputs.monthlyExpenses * 6;
  const emergencyFundGap = Math.max(emergencyFundTarget - inputs.currentPpfCorpus * 0.35, 0);
  const lifeCoverTarget = inputs.monthlyExpenses * 12 * 20 + inputs.liabilities;
  const lifeCoverGap = Math.max(lifeCoverTarget - inputs.currentLifeCover, 0);

  const monthByMonth = Array.from({ length: monthsToRetire }, (_, index) => {
    const month = index + 1;
    const glide = index / Math.max(monthsToRetire - 1, 1);
    const equityWeight = Math.max(0.55, 0.8 - glide * 0.2);
    const debtWeight = 1 - equityWeight;
    const runningCorpus =
      currentCorpus * Math.pow(1 + monthlyGrowth, month) +
      requiredSip * ((Math.pow(1 + monthlyGrowth, month) - 1) / Math.max(monthlyGrowth, 0.0001));

    return {
      month,
      age: Number((inputs.age + month / 12).toFixed(1)),
      equitySip: round(requiredSip * equityWeight),
      debtSip: round(requiredSip * debtWeight),
      equityWeight: equityWeight * 100,
      debtWeight: debtWeight * 100,
      projectedCorpus: round(runningCorpus),
    };
  });

  return {
    yearsToRetire,
    targetMonthlyAtRetirement: round(targetMonthlyAtRetirement),
    targetCorpus: round(targetCorpus),
    projectedCorpusWithoutChanges: round(projectedCorpusWithoutChanges),
    requiredSip: round(requiredSip),
    estimatedRetirementAgeOnCurrentPath: Number(estimatedRetirementAgeOnCurrentPath.toFixed(1)),
    emergencyFundTarget: round(emergencyFundTarget),
    emergencyFundGap: round(emergencyFundGap),
    lifeCoverTarget: round(lifeCoverTarget),
    lifeCoverGap: round(lifeCoverGap),
    monthByMonth,
  };
}

function solveMonthsToTarget(
  currentCorpus: number,
  monthlySip: number,
  monthlyGrowth: number,
  targetCorpus: number,
) {
  for (let month = 1; month <= 600; month += 1) {
    const projected =
      currentCorpus * Math.pow(1 + monthlyGrowth, month) +
      monthlySip * ((Math.pow(1 + monthlyGrowth, month) - 1) / Math.max(monthlyGrowth, 0.0001));
    if (projected >= targetCorpus) {
      return month;
    }
  }
  return 600;
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
