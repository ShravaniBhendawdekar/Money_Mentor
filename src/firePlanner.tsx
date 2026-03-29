import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AI_FINANCIAL_GUARDRAIL,
  generateFireGuidance,
  type FireGuidanceResult,
} from "./ai";
import { fireDefaults } from "./data";
import {
  compactInr,
  computeFirePlan,
  formatPercent,
  inr,
  validateFireInputs,
  type FireInputs,
  type FirePlan,
  type FireValidation,
} from "./finance";

type ResultView = "overview" | "roadmap" | "execution";

type FireDraftExpense = {
  amountToday: string;
  year: string;
};

type FireDraftInputs = {
  age: string;
  retirementAge: string;
  lifeExpectancy: string;
  annualIncome: string;
  monthlyExpenses: string;
  currentMfCorpus: string;
  currentPpfCorpus: string;
  epfCorpus: string;
  currentLiquidSavings: string;
  targetMonthlyDrawToday: string;
  currentMonthlySip: string;
  annualIncomeGrowthRate: string;
  inflationRate: string;
  preRetirementReturn: string;
  postRetirementReturn: string;
  safeWithdrawalRate: string;
  currentLifeCover: string;
  liabilities: string;
  dependents: string;
  hasPureTermPlan: boolean;
  plannedExpenses: FireDraftExpense[];
};

const resultTabs: Array<{ id: ResultView; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "roadmap", label: "Roadmap" },
  { id: "execution", label: "Execution" },
];

function buildBlankExpense(): FireDraftExpense {
  return { amountToday: "", year: "" };
}

function buildDraftFromInputs(
  inputs: FireInputs,
  rowCount = Math.max(inputs.plannedExpenses.length, 1),
): FireDraftInputs {
  return {
    age: String(inputs.age),
    retirementAge: String(inputs.retirementAge),
    lifeExpectancy: String(inputs.lifeExpectancy),
    annualIncome: String(inputs.annualIncome),
    monthlyExpenses: String(inputs.monthlyExpenses),
    currentMfCorpus: String(inputs.currentMfCorpus),
    currentPpfCorpus: String(inputs.currentPpfCorpus),
    epfCorpus: String(inputs.epfCorpus),
    currentLiquidSavings: String(inputs.currentLiquidSavings),
    targetMonthlyDrawToday: String(inputs.targetMonthlyDrawToday),
    currentMonthlySip: String(inputs.currentMonthlySip),
    annualIncomeGrowthRate: String(inputs.annualIncomeGrowthRate * 100),
    inflationRate: String(inputs.inflationRate * 100),
    preRetirementReturn: String(inputs.preRetirementReturn * 100),
    postRetirementReturn: String(inputs.postRetirementReturn * 100),
    safeWithdrawalRate: String(inputs.safeWithdrawalRate * 100),
    currentLifeCover: String(inputs.currentLifeCover),
    liabilities: String(inputs.liabilities),
    dependents: String(inputs.dependents),
    hasPureTermPlan: inputs.hasPureTermPlan,
    plannedExpenses: Array.from({ length: rowCount }, (_, index) => {
      const existing = inputs.plannedExpenses[index];
      return existing
        ? {
            amountToday: String(existing.amountToday),
            year: String(existing.year),
          }
        : buildBlankExpense();
    }),
  };
}

function cloneDraftInputs(draft: FireDraftInputs): FireDraftInputs {
  return {
    ...draft,
    plannedExpenses: draft.plannedExpenses.map((expense) => ({ ...expense })),
  };
}

function parseNumber(raw: string, fallback = 0) {
  const normalized = raw.replace(/,/g, "").trim();
  if (!normalized) {
    return fallback;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDraftInputs(draft: FireDraftInputs): FireInputs {
  return {
    ...fireDefaults,
    age: parseNumber(draft.age, fireDefaults.age),
    retirementAge: parseNumber(draft.retirementAge, fireDefaults.retirementAge),
    lifeExpectancy: parseNumber(draft.lifeExpectancy, fireDefaults.lifeExpectancy),
    annualIncome: parseNumber(draft.annualIncome, fireDefaults.annualIncome),
    monthlyExpenses: parseNumber(draft.monthlyExpenses, fireDefaults.monthlyExpenses),
    currentMfCorpus: parseNumber(draft.currentMfCorpus, fireDefaults.currentMfCorpus),
    currentPpfCorpus: parseNumber(draft.currentPpfCorpus, fireDefaults.currentPpfCorpus),
    epfCorpus: parseNumber(draft.epfCorpus, fireDefaults.epfCorpus),
    currentLiquidSavings: parseNumber(
      draft.currentLiquidSavings,
      fireDefaults.currentLiquidSavings,
    ),
    targetMonthlyDrawToday: parseNumber(
      draft.targetMonthlyDrawToday,
      fireDefaults.targetMonthlyDrawToday,
    ),
    currentMonthlySip: parseNumber(
      draft.currentMonthlySip,
      fireDefaults.currentMonthlySip,
    ),
    annualIncomeGrowthRate:
      parseNumber(
        draft.annualIncomeGrowthRate,
        fireDefaults.annualIncomeGrowthRate * 100,
      ) / 100,
    inflationRate:
      parseNumber(draft.inflationRate, fireDefaults.inflationRate * 100) / 100,
    preRetirementReturn:
      parseNumber(
        draft.preRetirementReturn,
        fireDefaults.preRetirementReturn * 100,
      ) / 100,
    postRetirementReturn:
      parseNumber(
        draft.postRetirementReturn,
        fireDefaults.postRetirementReturn * 100,
      ) / 100,
    safeWithdrawalRate:
      parseNumber(
        draft.safeWithdrawalRate,
        fireDefaults.safeWithdrawalRate * 100,
      ) / 100,
    currentLifeCover: parseNumber(
      draft.currentLifeCover,
      fireDefaults.currentLifeCover,
    ),
    liabilities: parseNumber(draft.liabilities, fireDefaults.liabilities),
    dependents: parseNumber(draft.dependents, fireDefaults.dependents),
    hasPureTermPlan: draft.hasPureTermPlan,
    plannedExpenses: draft.plannedExpenses.map((expense) => ({
      amountToday: parseNumber(expense.amountToday, 0),
      year: parseNumber(expense.year, 0),
    })),
  };
}

function getFieldState(
  validation: FireValidation,
  key: string,
  shouldShow: boolean,
) {
  if (!shouldShow) {
    return {};
  }

  const field = validation.fields[key];
  return {
    error: field?.errors[0],
    warning: field?.warnings[0],
  };
}

function formatRupeePreview(value: string) {
  const amount = parseNumber(value, 0);
  if (!value.trim()) {
    return null;
  }
  return inr(amount);
}

function sameInputs(left: FireInputs, right: FireInputs) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildVerdict(plan: FirePlan, inputs: FireInputs) {
  if (plan.requiredSip > plan.currentSip) {
    return `Add ${inr(plan.requiredSip - plan.currentSip)} per month to stay on track for age ${inputs.retirementAge}.`;
  }

  return `Your current pace is aligned with retiring around age ${inputs.retirementAge}.`;
}

function getYearsAwayLabel(age: string, retirementAge: string) {
  const current = parseNumber(age, fireDefaults.age);
  const target = parseNumber(retirementAge, fireDefaults.retirementAge);
  const yearsAway = Math.max(target - current, 0);
  return `${yearsAway} years away`;
}

function getPrintableHtml(
  inputs: FireInputs,
  plan: FirePlan,
  aiGuidance: FireGuidanceResult | null,
) {
  const sections = aiGuidance?.sections;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Firo FIRE Plan</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #10223a; }
      h1, h2, h3 { margin-bottom: 8px; }
      h1 { font-size: 28px; }
      h2 { margin-top: 24px; font-size: 18px; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .card { border: 1px solid #d5e4f2; border-radius: 16px; padding: 16px; }
      .metric { font-size: 24px; font-weight: 700; margin-top: 4px; }
      ul { padding-left: 18px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border-bottom: 1px solid #d5e4f2; padding: 10px 8px; text-align: left; }
      th { color: #4b6280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
      .muted { color: #58708d; }
    </style>
  </head>
  <body>
    <h1>Firo FIRE Plan</h1>
    <p class="muted">Prepared for age ${inputs.age}, retirement target ${inputs.retirementAge}.</p>

    <div class="grid">
      <div class="card">
        <div class="muted">Target corpus</div>
        <div class="metric">${compactInr(plan.targetCorpus)}</div>
      </div>
      <div class="card">
        <div class="muted">Required SIP</div>
        <div class="metric">${inr(plan.requiredSip)}</div>
      </div>
      <div class="card">
        <div class="muted">Current-path retirement age</div>
        <div class="metric">${plan.estimatedRetirementAgeOnCurrentPath}</div>
      </div>
      <div class="card">
        <div class="muted">Corpus lasts until age</div>
        <div class="metric">${plan.longevity.lastsUntilAge}</div>
      </div>
    </div>

    <h2>Assumptions</h2>
    <ul>
      <li>Pre-retirement return: ${formatPercent(
        plan.assumptions.preRetirementReturn * 100,
      )}</li>
      <li>Post-retirement return: ${formatPercent(
        plan.assumptions.postRetirementReturn * 100,
      )}</li>
      <li>Inflation: ${formatPercent(plan.assumptions.inflationRate * 100)}</li>
      <li>Safe withdrawal rate: ${formatPercent(
        plan.assumptions.safeWithdrawalRate * 100,
      )}</li>
      <li>Income growth: ${formatPercent(plan.assumptions.incomeGrowthRate * 100)}</li>
      <li>Retirement draw today: ${inr(plan.assumptions.retirementDrawToday)}</li>
      <li>Retirement draw at retirement: ${inr(
        plan.assumptions.retirementDrawAtRetirement,
      )}</li>
    </ul>

    <h2>Protection and Feasibility</h2>
    <ul>
      <li>Emergency fund target: ${inr(plan.emergencyFund.target)}</li>
      <li>Emergency fund gap: ${inr(plan.emergencyFund.gap)}</li>
      <li>Primary cover target: ${inr(plan.insurance.primaryTarget)}</li>
      <li>Primary cover gap: ${inr(plan.insurance.primaryGap)}</li>
      <li>Required SIP share of take-home: ${formatPercent(
        plan.takeHomeFeasibility.requiredSipShare * 100,
      )}</li>
    </ul>

    <h2>Guidance</h2>
    <h3>Plan</h3>
    <ul>${(sections?.plan ?? []).map((item) => `<li>${item}</li>`).join("")}</ul>
    <h3>Risks</h3>
    <ul>${(sections?.risks ?? []).map((item) => `<li>${item}</li>`).join("")}</ul>
    <h3>Next actions</h3>
    <ul>${(sections?.nextActions ?? []).map((item) => `<li>${item}</li>`).join("")}</ul>

    <h2>Execution</h2>
    <table>
      <thead>
        <tr><th>Bucket</th><th>Monthly amount</th></tr>
      </thead>
      <tbody>
        ${plan.sipAllocation.buckets
          .map(
            (bucket) =>
              `<tr><td>${bucket.label}</td><td>${inr(bucket.amount)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </body>
</html>`;
}

export function FirePlannerPage({
  onGoHome,
  onOpenFirePlanner,
  onOpenMoneyHealth,
  onMount,
}: {
  onGoHome: () => void;
  onOpenFirePlanner?: () => void;
  onOpenMoneyHealth?: () => void;
  onMount?: () => void;
}) {
  const [inputs, setInputs] = useState<FireInputs>(fireDefaults);
  const [draftInputs, setDraftInputs] = useState<FireDraftInputs>(() =>
    buildDraftFromInputs(fireDefaults),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultView>("overview");
  const [aiGuidance, setAiGuidance] = useState<FireGuidanceResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetirementDrawCustomized, setIsRetirementDrawCustomized] = useState(
    fireDefaults.targetMonthlyDrawToday !== fireDefaults.monthlyExpenses,
  );
  const [originalSubmittedInputs, setOriginalSubmittedInputs] =
    useState<FireInputs | null>(null);
  const [originalSubmittedDraft, setOriginalSubmittedDraft] =
    useState<FireDraftInputs | null>(null);
  const [originalRetirementDrawCustomized, setOriginalRetirementDrawCustomized] =
    useState<boolean | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  const draftParsedInputs = useMemo(
    () => parseDraftInputs(draftInputs),
    [draftInputs],
  );
  const draftValidation = useMemo(
    () => validateFireInputs(draftParsedInputs),
    [draftParsedInputs],
  );
  const plan = useMemo(() => computeFirePlan(inputs), [inputs]);
  const shouldShowValidation = hasSubmitted || formAttempted;
  const headline = buildVerdict(plan, inputs);

  const runGuidance = async (nextInputs: FireInputs, captureOriginal = false) => {
    const nextPlan = computeFirePlan(nextInputs);
    const requestId = ++requestIdRef.current;

    setInputs(nextInputs);
    setHasSubmitted(true);
    setIsEditing(false);
    setIsGenerating(true);

    if (captureOriginal && originalSubmittedInputs === null) {
      setOriginalSubmittedInputs(nextInputs);
      setOriginalSubmittedDraft(cloneDraftInputs(draftInputs));
      setOriginalRetirementDrawCustomized(isRetirementDrawCustomized);
    }

    try {
      const guidance = await generateFireGuidance(nextInputs, nextPlan);
      if (requestId === requestIdRef.current) {
        setAiGuidance(guidance);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    if (!hasSubmitted || isEditing || draftValidation.errors.length > 0) {
      return;
    }

    if (sameInputs(inputs, draftParsedInputs)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void runGuidance(draftParsedInputs);
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [
    draftParsedInputs,
    draftValidation.errors.length,
    hasSubmitted,
    inputs,
    isEditing,
  ]);

  const handleGenerate = async () => {
    setFormAttempted(true);
    if (draftValidation.errors.length > 0) {
      return;
    }
    setActiveTab("overview");
    await runGuidance(draftParsedInputs, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = async () => {
    if (!originalSubmittedInputs || !originalSubmittedDraft) {
      return;
    }

    setDraftInputs(cloneDraftInputs(originalSubmittedDraft));
    setIsRetirementDrawCustomized(Boolean(originalRetirementDrawCustomized));
    setActiveTab("overview");
    await runGuidance(originalSubmittedInputs);
  };

  const handleUseDefaults = () => {
    setDraftInputs(buildDraftFromInputs(fireDefaults));
    setIsRetirementDrawCustomized(false);
  };

  const handleDownloadPlan = () => {
    const win = window.open("", "_blank");
    if (!win) {
      return;
    }

    win.document.write(getPrintableHtml(inputs, plan, aiGuidance));
    win.document.close();
    win.focus();
    win.print();
  };

  const setFieldValue = (key: keyof FireDraftInputs, value: string | boolean) => {
    setDraftInputs((current) => {
      const next = { ...current, [key]: value } as FireDraftInputs;

      if (
        key === "monthlyExpenses" &&
        !isRetirementDrawCustomized &&
        typeof value === "string"
      ) {
        next.targetMonthlyDrawToday = value;
      }

      return next;
    });

    if (key === "targetMonthlyDrawToday") {
      setIsRetirementDrawCustomized(true);
    }

    if (key === "monthlyExpenses" && !isRetirementDrawCustomized) {
      setIsRetirementDrawCustomized(false);
    }
  };

  const setExpenseValue = (
    index: number,
    key: keyof FireDraftExpense,
    value: string,
  ) => {
    setDraftInputs((current) => ({
      ...current,
      plannedExpenses: current.plannedExpenses.map((expense, expenseIndex) =>
        expenseIndex === index ? { ...expense, [key]: value } : expense,
      ),
    }));
  };

  const addExpenseRow = () => {
    setDraftInputs((current) =>
      current.plannedExpenses.length >= 3
        ? current
        : {
            ...current,
            plannedExpenses: [...current.plannedExpenses, buildBlankExpense()],
          },
    );
  };

  const removeExpenseRow = (index: number) => {
    setDraftInputs((current) => ({
      ...current,
      plannedExpenses:
        current.plannedExpenses.length === 1
          ? [buildBlankExpense()]
          : current.plannedExpenses.filter((_, expenseIndex) => expenseIndex !== index),
    }));
  };

  const isFormMode = !hasSubmitted || isEditing;

  return (
    <div className="planner-page">
      <header className="planner-header">
        <div className="container planner-nav">
          <button className="brand brand-button" type="button" onClick={onGoHome}>
            <span className="brand-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.2 2 6.8 13h4.5l-1.1 9L17.2 11h-4.4L13.2 2Z" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-text">Firo</span>
          </button>

          <div className="planner-nav-actions">
            <span className="planner-tag">FIRE Planner</span>
            <div className="feature-switcher" role="tablist" aria-label="Feature navigation">
              <button
                className="feature-switcher-tab active"
                type="button"
                onClick={onOpenFirePlanner ?? (() => {})}
              >
                FIRE Planner
              </button>
              <button
                className="feature-switcher-tab"
                type="button"
                onClick={onOpenMoneyHealth}
              >
                Money Health Score
              </button>
            </div>
            <button className="ghost-link" type="button" onClick={onGoHome}>
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main
        className={`container fire-workspace ${
          isFormMode ? "fire-workspace-form-first" : "fire-workspace-results-only"
        }`}
      >
        {isFormMode ? <aside className="fire-sidebar-shell">
          <div className="fire-sidebar-card">
            <div className="fire-sidebar-copy">
              <span className="eyebrow">
                {hasSubmitted ? "Edit inputs" : "Step 1 of product flow"}
              </span>
              <h1>FIRE planner</h1>
              <p>
                First complete the intake form. Once submitted, the planner
                generates your retirement strategy, roadmap, and action plan.
              </p>
            </div>

            <div className="fire-sidebar-actions">
              <button className="soft-button" type="button" onClick={handleUseDefaults}>
                Use scenario defaults
              </button>
              {hasSubmitted ? (
                <button
                  className="ghost-link"
                  type="button"
                  onClick={() => setIsEditing(false)}
                >
                  Back to plan
                </button>
              ) : null}
            </div>

            <div className="guardrail-note compact">
              <strong>Disclaimer</strong>
              <p>{AI_FINANCIAL_GUARDRAIL}</p>
            </div>

            <div className="fire-form-sections">
              <InputSection title="Your details">
                <div className="fire-field-grid two-up">
                  <NumericField
                    label="Current age"
                    value={draftInputs.age}
                    placeholder="34"
                    inputMode="numeric"
                    onChange={(value) => setFieldValue("age", value)}
                    {...getFieldState(draftValidation, "age", shouldShowValidation)}
                  />
                  <NumericField
                    label="Retirement age"
                    value={draftInputs.retirementAge}
                    placeholder="50"
                    inputMode="numeric"
                    helper={getYearsAwayLabel(draftInputs.age, draftInputs.retirementAge)}
                    onChange={(value) => setFieldValue("retirementAge", value)}
                    {...getFieldState(
                      draftValidation,
                      "retirementAge",
                      shouldShowValidation,
                    )}
                  />
                </div>
                <div className="fire-field-grid two-up">
                  <NumericField
                    label="Life expectancy"
                    value={draftInputs.lifeExpectancy}
                    placeholder="90"
                    inputMode="numeric"
                    helper="Plan till at least age 85 to 90 to account for longevity risk."
                    onChange={(value) => setFieldValue("lifeExpectancy", value)}
                    {...getFieldState(
                      draftValidation,
                      "lifeExpectancy",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Dependents"
                    value={draftInputs.dependents}
                    placeholder="0"
                    inputMode="numeric"
                    info="Include children or parents who rely on your income."
                    onChange={(value) => setFieldValue("dependents", value)}
                    {...getFieldState(draftValidation, "dependents", shouldShowValidation)}
                  />
                </div>
              </InputSection>

              <InputSection title="Income and expenses">
                <div className="fire-field-grid">
                  <NumericField
                    label="Annual income"
                    value={draftInputs.annualIncome}
                    placeholder="2400000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.annualIncome)}
                    onChange={(value) => setFieldValue("annualIncome", value)}
                    {...getFieldState(draftValidation, "annualIncome", shouldShowValidation)}
                  />
                  <NumericField
                    label="Monthly expenses"
                    value={draftInputs.monthlyExpenses}
                    placeholder="95000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.monthlyExpenses)}
                    onChange={(value) => setFieldValue("monthlyExpenses", value)}
                    {...getFieldState(
                      draftValidation,
                      "monthlyExpenses",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Retirement spending target"
                    value={draftInputs.targetMonthlyDrawToday}
                    placeholder="95000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.targetMonthlyDrawToday)}
                    helper="Adjust if your retirement lifestyle differs."
                    info="Use today's rupees, not future inflated value."
                    onChange={(value) => setFieldValue("targetMonthlyDrawToday", value)}
                    {...getFieldState(
                      draftValidation,
                      "targetMonthlyDrawToday",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Current monthly SIP"
                    value={draftInputs.currentMonthlySip}
                    placeholder="45000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.currentMonthlySip)}
                    onChange={(value) => setFieldValue("currentMonthlySip", value)}
                    {...getFieldState(
                      draftValidation,
                      "currentMonthlySip",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Annual income growth rate"
                    value={draftInputs.annualIncomeGrowthRate}
                    placeholder="8"
                    inputMode="decimal"
                    helper="Use 7 to 10 for most salaried professionals."
                    info="Your expected salary growth per year."
                    onChange={(value) => setFieldValue("annualIncomeGrowthRate", value)}
                  />
                </div>
              </InputSection>

              <InputSection title="Current assets and protection">
                <div className="fire-field-grid">
                  <NumericField
                    label="Existing MF corpus"
                    value={draftInputs.currentMfCorpus}
                    placeholder="1800000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.currentMfCorpus)}
                    onChange={(value) => setFieldValue("currentMfCorpus", value)}
                    {...getFieldState(
                      draftValidation,
                      "currentMfCorpus",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Existing PPF corpus"
                    value={draftInputs.currentPpfCorpus}
                    placeholder="600000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.currentPpfCorpus)}
                    onChange={(value) => setFieldValue("currentPpfCorpus", value)}
                    {...getFieldState(
                      draftValidation,
                      "currentPpfCorpus",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="EPF / gratuity corpus"
                    value={draftInputs.epfCorpus}
                    placeholder="0"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.epfCorpus)}
                    info="Your current EPF balance. Leave 0 if self-employed."
                    onChange={(value) => setFieldValue("epfCorpus", value)}
                  />
                  <NumericField
                    label="Liquid savings already held"
                    value={draftInputs.currentLiquidSavings}
                    placeholder="0"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.currentLiquidSavings)}
                    info="Money you can access within a week from savings, FD, or liquid funds."
                    onChange={(value) => setFieldValue("currentLiquidSavings", value)}
                  />
                  <NumericField
                    label="Current life cover"
                    value={draftInputs.currentLifeCover}
                    placeholder="5000000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.currentLifeCover)}
                    info="Only count pure term insurance."
                    onChange={(value) => setFieldValue("currentLifeCover", value)}
                    {...getFieldState(
                      draftValidation,
                      "currentLifeCover",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Outstanding liabilities"
                    value={draftInputs.liabilities}
                    placeholder="2000000"
                    inputMode="numeric"
                    preview={formatRupeePreview(draftInputs.liabilities)}
                    onChange={(value) => setFieldValue("liabilities", value)}
                    {...getFieldState(
                      draftValidation,
                      "liabilities",
                      shouldShowValidation,
                    )}
                  />
                </div>

                <CheckboxField
                  label="Yes, this is a pure term plan"
                  checked={draftInputs.hasPureTermPlan}
                  description="Do not include endowment, money-back, or ULIP plans in FIRE life cover."
                  onChange={(checked) => setFieldValue("hasPureTermPlan", checked)}
                  {...getFieldState(
                    draftValidation,
                    "hasPureTermPlan",
                    shouldShowValidation,
                  )}
                />
              </InputSection>

              <InputSection title="Assumptions">
                <div className="fire-field-grid two-up">
                  <NumericField
                    label="Expected return"
                    value={draftInputs.preRetirementReturn}
                    placeholder="12"
                    inputMode="decimal"
                    helper="Historically 10–12% for diversified equity mutual funds. Use 10% to stay conservative."
                    onChange={(value) => setFieldValue("preRetirementReturn", value)}
                    {...getFieldState(
                      draftValidation,
                      "preRetirementReturn",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Post-retirement return"
                    value={draftInputs.postRetirementReturn}
                    placeholder="7"
                    inputMode="decimal"
                    helper="Expected return once allocation becomes more conservative in retirement."
                    info="Used for corpus longevity after retirement."
                    onChange={(value) => setFieldValue("postRetirementReturn", value)}
                  />
                  <NumericField
                    label="Inflation assumption"
                    value={draftInputs.inflationRate}
                    placeholder="6"
                    inputMode="decimal"
                    helper="RBI targets 4%, but long-term Indian inflation is closer to 6%."
                    onChange={(value) => setFieldValue("inflationRate", value)}
                    {...getFieldState(
                      draftValidation,
                      "inflationRate",
                      shouldShowValidation,
                    )}
                  />
                  <NumericField
                    label="Safe withdrawal rate"
                    value={draftInputs.safeWithdrawalRate}
                    placeholder="4"
                    inputMode="decimal"
                    helper="Use 4 for the classic 25x retirement corpus rule."
                    onChange={(value) => setFieldValue("safeWithdrawalRate", value)}
                    {...getFieldState(
                      draftValidation,
                      "safeWithdrawalRate",
                      shouldShowValidation,
                    )}
                  />
                </div>
              </InputSection>

              <InputSection title="Planned large expenses">
                <div className="planned-expense-head">
                  <p>
                    Add one-time future costs like education, a wedding, or a property
                    down payment. Amounts are in today's rupees.
                  </p>
                  <button
                    className="soft-button"
                    type="button"
                    onClick={addExpenseRow}
                    disabled={draftInputs.plannedExpenses.length >= 3}
                  >
                    Add row
                  </button>
                </div>

                <div className="planned-expense-stack">
                  {draftInputs.plannedExpenses.map((expense, index) => (
                    <div key={`${index}-${expense.year}-${expense.amountToday}`} className="planned-expense-row">
                      <NumericField
                        label={`Expense ${index + 1} amount`}
                        value={expense.amountToday}
                        placeholder="2000000"
                        inputMode="numeric"
                        preview={formatRupeePreview(expense.amountToday)}
                        onChange={(value) => setExpenseValue(index, "amountToday", value)}
                        {...getFieldState(
                          draftValidation,
                          `plannedExpenses.${index}.amountToday`,
                          shouldShowValidation,
                        )}
                      />
                      <NumericField
                        label="Year"
                        value={expense.year}
                        placeholder="2031"
                        inputMode="numeric"
                        onChange={(value) => setExpenseValue(index, "year", value)}
                        {...getFieldState(
                          draftValidation,
                          `plannedExpenses.${index}.year`,
                          shouldShowValidation,
                        )}
                      />
                      <button
                        className="ghost-icon-button"
                        type="button"
                        onClick={() => removeExpenseRow(index)}
                        disabled={draftInputs.plannedExpenses.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </InputSection>
            </div>

            <div className="fire-form-submit">
              <button
                className="button button-primary planner-button"
                type="button"
                onClick={handleGenerate}
              >
                {hasSubmitted ? "Update FIRE plan" : "Generate FIRE plan"}
              </button>
            </div>
          </div>
        </aside> : null}

        {!isFormMode ? (
        <section className="fire-stage-shell">
          {isGenerating ? (
            <GeneratingState />
          ) : (
            <>
              <div className="fire-plan-bar compact">
                <div>
                  <span className="eyebrow">Generated plan</span>
                  <h2>{headline}</h2>
                  <p>
                    Your plan is ready. Review the strategy first, then reopen the
                    form only if you want to change the inputs.
                  </p>
                </div>
                <div className="fire-plan-bar-actions">
                  <button
                    className="soft-button"
                    type="button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit inputs
                  </button>
                  <button
                    className="soft-button"
                    type="button"
                    onClick={handleReset}
                    disabled={!originalSubmittedInputs}
                  >
                    Reset
                  </button>
                  <button className="button button-secondary" type="button" onClick={handleDownloadPlan}>
                    Download plan
                  </button>
                </div>
              </div>

              <LiveTuningPanel
                draftInputs={draftInputs}
                draftValidation={draftValidation}
                shouldShowValidation={hasSubmitted}
                setFieldValue={setFieldValue}
                isGenerating={isGenerating}
              />

              <nav className="fire-tab-strip" aria-label="Planner sections">
                {resultTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`fire-tab ${activeTab === tab.id ? "active" : ""}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {activeTab === "overview" ? (
                <div className="fire-tab-panel">
                  <OverviewHero plan={plan} inputs={inputs} />
                  <AssumptionsPanel plan={plan} />
                  <GuidancePanel aiGuidance={aiGuidance} plan={plan} />
                </div>
              ) : null}

              {activeTab === "roadmap" ? (
                <div className="fire-tab-panel">
                <RoadmapPanel
                  inputs={inputs}
                  plan={plan}
                />
                </div>
              ) : null}

              {activeTab === "execution" ? (
                <div className="fire-tab-panel">
                  <ExecutionPanel plan={plan} />
                </div>
              ) : null}
            </>
          )}
        </section>
        ) : null}
      </main>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="fire-generating-shell">
      <div className="fire-generating-card">
        <div className="fire-generating-spinner" aria-hidden="true" />
        <span className="eyebrow">Generating plan</span>
        <h2>Building your FIRE roadmap</h2>
        <p>
          We are checking your target corpus, SIP path, protection gaps, and
          practical next actions before showing the final plan.
        </p>
      </div>
    </div>
  );
}

function InputSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="fire-input-section">
      <div className="fire-input-section-head">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function NumericField({
  label,
  value,
  placeholder,
  inputMode,
  helper,
  info,
  preview,
  error,
  warning,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  inputMode: "numeric" | "decimal";
  helper?: string;
  info?: string;
  preview?: string | null;
  error?: string;
  warning?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="fire-input-field">
      <div className="fire-input-label">
        <span>{label}</span>
        {info ? <InfoDot text={info} /> : null}
      </div>
      <input
        className={error ? "field-error" : warning ? "field-warning" : ""}
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="fire-input-meta">
        {preview ? <div className="fire-input-preview">{preview}</div> : <div aria-hidden="true" />}
        {error ? <small className="field-message error">{error}</small> : null}
        {!error && warning ? <small className="field-message warning">{warning}</small> : null}
        {!error && !warning && helper ? <small>{helper}</small> : null}
        {!error && !warning && !helper ? <small className="fire-input-meta-placeholder"> </small> : null}
      </div>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  description,
  error,
  warning,
  onChange,
}: {
  label: string;
  checked: boolean;
  description: string;
  error?: string;
  warning?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="fire-checkbox-field">
      <div className="fire-checkbox-row">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </div>
      <small>{description}</small>
      {error ? <small className="field-message error">{error}</small> : null}
      {!error && warning ? <small className="field-message warning">{warning}</small> : null}
    </label>
  );
}

function InfoDot({ text }: { text: string }) {
  return (
    <span className="fire-info-dot" tabIndex={0}>
      i
      <span className="fire-info-tooltip">{text}</span>
    </span>
  );
}

function MetricTile({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "primary" | "success" | "default";
}) {
  return (
    <article className={`fire-metric-tile ${tone ?? "default"}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function SectionCard({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <section className="fire-section-card">
      <div className="fire-section-head">
        <span className="eyebrow">{kicker}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function OverviewHero({ plan, inputs }: { plan: FirePlan; inputs: FireInputs }) {
  return (
    <div className="fire-overview-shell">
      <section className="fire-overview-copy">
        <span className="eyebrow">FIRE snapshot</span>
        <h3>{buildVerdict(plan, inputs)}</h3>
        <p>
          Retiring at {inputs.retirementAge} means turning{" "}
          {inr(plan.assumptions.retirementDrawToday)} today into{" "}
          {inr(plan.assumptions.retirementDrawAtRetirement)} per month at retirement
          and building about {compactInr(plan.targetCorpus)}.
        </p>
        <div className={`fire-decision-banner ${plan.decision.status}`}>
          {plan.decision.message}
        </div>

        <div className="fire-metric-grid">
          <MetricTile
            label="Target corpus"
            value={compactInr(plan.targetCorpus)}
            helper="Needed at retirement"
            tone="primary"
          />
          <MetricTile
            label="Required SIP"
            value={inr(plan.requiredSip)}
            helper="Monthly amount needed"
          />
          <MetricTile
            label="Current path"
            value={`Age ${plan.estimatedRetirementAgeOnCurrentPath}`}
            helper="If you stay on the current contribution path"
            tone="success"
          />
          <MetricTile
            label="Corpus lasts until"
            value={`Age ${plan.longevity.lastsUntilAge}`}
            helper="Using the post-retirement return assumption"
          />
          <MetricTile
            label="Income load"
            value={formatPercent(plan.takeHomeFeasibility.requiredSipShareOfIncome * 100)}
            helper={`${inr(plan.requiredSip)} out of ${inr(plan.takeHomeFeasibility.grossMonthlyIncome)} monthly income`}
          />
        </div>
      </section>

      <section className="fire-overview-chart">
        <FireTrajectoryChart plan={plan} />
      </section>
    </div>
  );
}

function AssumptionsPanel({ plan }: { plan: FirePlan }) {
  return (
    <SectionCard title="Assumptions used in the plan" kicker="Audit trail">
      <div className="fire-assumption-grid">
        <AssumptionChip label="Pre-retirement return" value={formatPercent(plan.assumptions.preRetirementReturn * 100)} />
        <AssumptionChip label="Post-retirement return" value={formatPercent(plan.assumptions.postRetirementReturn * 100)} />
        <AssumptionChip label="Inflation" value={formatPercent(plan.assumptions.inflationRate * 100)} />
        <AssumptionChip label="Safe withdrawal rate" value={formatPercent(plan.assumptions.safeWithdrawalRate * 100)} />
        <AssumptionChip label="Income growth rate" value={formatPercent(plan.assumptions.incomeGrowthRate * 100)} />
        <AssumptionChip label="Retirement draw today" value={inr(plan.assumptions.retirementDrawToday)} />
        <AssumptionChip label="Inflated draw at retirement" value={inr(plan.assumptions.retirementDrawAtRetirement)} />
      </div>
    </SectionCard>
  );
}

function AssumptionChip({ label, value }: { label: string; value: string }) {
  return (
    <article className="fire-assumption-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function GuidancePanel({
  aiGuidance,
  plan,
}: {
  aiGuidance: FireGuidanceResult | null;
  plan: FirePlan;
}) {
  const guidance = aiGuidance;

  return (
    <SectionCard title="Grounded insights" kicker="What the plan says">
      <div className="fire-guidance-grid">
        <GuidanceCard
          title="Plan"
          tone="blue"
          items={guidance?.sections.plan ?? []}
        />
        <GuidanceCard
          title="Risks"
          tone="amber"
          items={guidance?.sections.risks ?? []}
        />
        <GuidanceCard
          title="Next actions"
          tone="green"
          items={guidance?.sections.nextActions ?? []}
        />
      </div>
      <div className="fire-confidence-note">
        If pre-retirement returns average {formatPercent(plan.sensitivity.lowerReturnAssumption * 100)} instead of{" "}
        {formatPercent(plan.assumptions.preRetirementReturn * 100)}, the current path
        shifts retirement to about age {plan.sensitivity.lowerReturnRetirementAge}.
      </div>
      <div className="guardrail-note">
        <strong>Disclaimer</strong>
        <p>{guidance?.sections.disclaimer ?? AI_FINANCIAL_GUARDRAIL}</p>
      </div>
    </SectionCard>
  );
}

function GuidanceCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "blue" | "amber" | "green";
}) {
  return (
    <section className={`fire-guidance-card ${tone}`}>
      <h4>{title}</h4>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="fire-empty-card">Refreshing this section with the latest plan facts.</p>
      )}
    </section>
  );
}

function LiveTuningPanel({
  draftInputs,
  draftValidation,
  shouldShowValidation,
  setFieldValue,
  isGenerating,
}: {
  draftInputs: FireDraftInputs;
  draftValidation: FireValidation;
  shouldShowValidation: boolean;
  setFieldValue: (key: keyof FireDraftInputs, value: string | boolean) => void;
  isGenerating: boolean;
}) {
  return (
    <SectionCard title="Live planning controls" kicker="Dynamic updates">
      <div className="fire-live-tuning-head">
        <p>
          Change one input here and the roadmap updates automatically. This is the
          live planning layer judges expect to see in the FIRE demo.
        </p>
        <span className={`live-refresh-pill ${isGenerating ? "busy" : ""}`}>
          {isGenerating ? "Updating plan..." : "Dynamic updates on"}
        </span>
      </div>
      <div className="fire-field-grid">
        <NumericField
          label="Retirement age"
          value={draftInputs.retirementAge}
          placeholder="50"
          inputMode="numeric"
          helper={getYearsAwayLabel(draftInputs.age, draftInputs.retirementAge)}
          onChange={(value) => setFieldValue("retirementAge", value)}
          {...getFieldState(draftValidation, "retirementAge", shouldShowValidation)}
        />
        <NumericField
          label="Monthly expenses"
          value={draftInputs.monthlyExpenses}
          placeholder="95000"
          inputMode="numeric"
          preview={formatRupeePreview(draftInputs.monthlyExpenses)}
          onChange={(value) => setFieldValue("monthlyExpenses", value)}
          {...getFieldState(draftValidation, "monthlyExpenses", shouldShowValidation)}
        />
        <NumericField
          label="Retirement spending target"
          value={draftInputs.targetMonthlyDrawToday}
          placeholder="150000"
          inputMode="numeric"
          preview={formatRupeePreview(draftInputs.targetMonthlyDrawToday)}
          onChange={(value) => setFieldValue("targetMonthlyDrawToday", value)}
          {...getFieldState(
            draftValidation,
            "targetMonthlyDrawToday",
            shouldShowValidation,
          )}
        />
        <NumericField
          label="Current monthly SIP"
          value={draftInputs.currentMonthlySip}
          placeholder="45000"
          inputMode="numeric"
          preview={formatRupeePreview(draftInputs.currentMonthlySip)}
          onChange={(value) => setFieldValue("currentMonthlySip", value)}
          {...getFieldState(draftValidation, "currentMonthlySip", shouldShowValidation)}
        />
        <NumericField
          label="Annual income"
          value={draftInputs.annualIncome}
          placeholder="2400000"
          inputMode="numeric"
          preview={formatRupeePreview(draftInputs.annualIncome)}
          onChange={(value) => setFieldValue("annualIncome", value)}
          {...getFieldState(draftValidation, "annualIncome", shouldShowValidation)}
        />
        <NumericField
          label="Life expectancy"
          value={draftInputs.lifeExpectancy}
          placeholder="90"
          inputMode="numeric"
          onChange={(value) => setFieldValue("lifeExpectancy", value)}
          {...getFieldState(draftValidation, "lifeExpectancy", shouldShowValidation)}
        />
        <NumericField
          label="Existing MF corpus"
          value={draftInputs.currentMfCorpus}
          placeholder="1800000"
          inputMode="numeric"
          preview={formatRupeePreview(draftInputs.currentMfCorpus)}
          onChange={(value) => setFieldValue("currentMfCorpus", value)}
          {...getFieldState(draftValidation, "currentMfCorpus", shouldShowValidation)}
        />
      </div>
    </SectionCard>
  );
}

function RoadmapPanel({
  inputs,
  plan,
}: {
  inputs: FireInputs;
  plan: FirePlan;
}) {
  const phases = [
    {
      title: "Phase 1",
      detail: "Protect the basics",
      description: `Move the emergency reserve toward ${inr(plan.emergencyFund.target)} and close the ${inr(plan.insurance.primaryGap)} life-cover gap first.`,
    },
    {
      title: "Phase 2",
      detail: "Lock the investing path",
      description: `Push SIP from ${inr(plan.currentSip)} toward ${inr(plan.requiredSip)}, or start the 10% step-up path at ${inr(plan.stepUpSipPlan.yearOneSip)}.`,
    },
    {
      title: "Phase 3",
      detail: "Review the plan yearly",
      description: `Recheck the draw assumption of ${inr(inputs.targetMonthlyDrawToday)} and the retirement target of age ${inputs.retirementAge} whenever income or expenses change.`,
    },
  ];

  return (
    <div className="fire-panel-stack">
      <SectionCard title="Practical ways to improve the plan" kicker="Roadmap">
        <div className="fire-scenario-grid">
          {plan.scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              label={scenario.label}
              title={`Retirement age ${scenario.retirementAgePossible}`}
              highlight={inr(scenario.sip)}
              helper={scenario.message}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Three-phase action plan" kicker="What to do next">
        <div className="fire-phase-grid">
          {phases.map((phase) => (
            <article key={phase.title} className="fire-phase-card">
              <span>{phase.title}</span>
              <strong>{phase.detail}</strong>
              <p>{phase.description}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="fire-roadmap-two-up">
        <SectionCard title="Step-up SIP alternative" kicker="More manageable path">
          <div className="fire-stepup-card">
            <MetricTile
              label="Year 1 SIP"
              value={inr(plan.stepUpSipPlan.yearOneSip)}
              helper="Starting monthly SIP"
            />
            <MetricTile
              label="Annual increase"
              value={formatPercent(plan.stepUpSipPlan.annualIncreaseRate * 100)}
              helper="Automatic yearly SIP step-up"
            />
            <MetricTile
              label="Year 10 SIP"
              value={inr(plan.stepUpSipPlan.yearTenSip)}
              helper="Target monthly SIP by year 10"
            />
          </div>
        </SectionCard>

        <SectionCard title="Planned expense schedule" kicker="Known future costs">
          {plan.plannedExpenseSchedule.length > 0 ? (
            <div className="fire-expense-list">
              {plan.plannedExpenseSchedule.map((expense) => (
                <div key={`${expense.year}-${expense.amountToday}`} className="fire-expense-item">
                  <div>
                    <strong>{expense.year}</strong>
                    <p>
                      {expense.phase === "accumulation"
                        ? "Deducted before retirement"
                        : "Deducted from post-retirement corpus"}
                    </p>
                  </div>
                  <span>{inr(expense.inflatedAmount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="fire-empty-card">
              No future one-time expenses are recorded in this plan yet.
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Month-by-month roadmap" kicker="First 12 months">
        <div className="fire-roadmap-table-wrap">
          <table className="fire-roadmap-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Focus</th>
                <th>Equity SIP</th>
                <th>Debt SIP</th>
                <th>Projected corpus</th>
              </tr>
            </thead>
            <tbody>
              {plan.monthlyRoadmap.map((row) => (
                <tr key={row.month}>
                  <td>{`Month ${row.month}`}</td>
                  <td>{row.focus}</td>
                  <td>{inr(row.equitySip)}</td>
                  <td>{inr(row.debtSip)}</td>
                  <td>{inr(row.projectedCorpus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function ScenarioCard({
  label,
  title,
  highlight,
  helper,
}: {
  label: string;
  title: string;
  highlight: string;
  helper: string;
}) {
  return (
    <article className="fire-scenario-card">
      <span>{label}</span>
      <h4>{title}</h4>
      <strong>{highlight}</strong>
      <p>{helper}</p>
    </article>
  );
}

function ExecutionPanel({ plan }: { plan: FirePlan }) {
  return (
    <div className="fire-panel-stack">
      <SectionCard title="Suggested monthly allocation" kicker="Execution">
        <div className="fire-allocation-stack">
          {plan.sipAllocation.buckets.map((bucket) => (
            <div key={bucket.label} className="fire-allocation-row">
              <span>{bucket.label}</span>
              <div className="fire-allocation-bar">
                <div
                  className={`fire-allocation-fill ${bucket.tone}`}
                  style={{
                    width: `${Math.max(
                      (bucket.amount / Math.max(plan.sipAllocation.total, 1)) * 100,
                      4,
                    )}%`,
                  }}
                />
              </div>
              <strong>{inr(bucket.amount)}</strong>
            </div>
          ))}
        </div>
        <p className="fire-footnote">
          Debt allocation sends up to ₹12,500 per month to PPF and moves any excess
          into debt or liquid funds so the total still matches {inr(plan.requiredSip)}.
        </p>
      </SectionCard>

      <div className="fire-roadmap-two-up">
        <SectionCard title="Glidepath" kicker="Allocation shifts">
          <div className="fire-glidepath-list">
            {plan.glidepath.map((row) => (
              <div key={row.ageLabel} className={`fire-glidepath-row ${row.current ? "current" : ""}`}>
                <div className="fire-glidepath-age-block">
                  <span>{row.ageLabel}</span>
                </div>
                <div className="fire-glidepath-stat">
                  <strong>{row.equity}% equity</strong>
                </div>
                <div className="fire-glidepath-stat">
                  <strong>{row.debt}% debt</strong>
                </div>
                <p>{row.action}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Protection and feasibility" kicker="Reality check">
          <div className="fire-protection-grid">
            <MetricTile
              label="Emergency gap"
              value={inr(plan.emergencyFund.gap)}
              helper={`Target ${inr(plan.emergencyFund.target)}`}
            />
            <MetricTile
              label="Primary cover gap"
              value={inr(plan.insurance.primaryGap)}
              helper={`Target ${inr(plan.insurance.primaryTarget)}`}
            />
            <MetricTile
              label="Take-home load"
              value={formatPercent(plan.takeHomeFeasibility.requiredSipShare * 100)}
              helper={`${inr(plan.requiredSip)} vs ${inr(plan.takeHomeFeasibility.monthlyTakeHome)} estimated take-home`}
            />
            <MetricTile
              label="Longevity"
              value={`Age ${plan.longevity.lastsUntilAge}`}
              helper={`Post-retirement return ${formatPercent(
                plan.assumptions.postRetirementReturn * 100,
              )}`}
              tone={plan.longevity.status === "strong" ? "success" : "default"}
            />
          </div>
          <p className="fire-footnote">
            Using {formatPercent(plan.sensitivity.lowerReturnAssumption * 100)} returns
            instead of {formatPercent(plan.assumptions.preRetirementReturn * 100)} moves
            the current path to about age {plan.sensitivity.lowerReturnRetirementAge}.
          </p>
          <p className="fire-footnote">
            With income growing at {formatPercent(plan.assumptions.incomeGrowthRate * 100)},
            the same {inr(plan.requiredSip)} falls from{" "}
            {formatPercent(plan.takeHomeFeasibility.requiredSipShare * 100)} of take-home
            today to about {formatPercent(plan.takeHomeFeasibility.projectedSipShareInYear5 * 100)} by year 5.
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Tax-aware moves" kicker="Execution details">
        <div className="fire-tax-move-list">
          {plan.taxSavingMoves.map((move) => (
            <article key={move.title} className="fire-tax-move-card">
              <strong>{move.title}</strong>
              <p>{move.detail}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function FireTrajectoryChart({ plan }: { plan: FirePlan }) {
  const width = 920;
  const height = 360;
  const padding = { top: 26, right: 32, bottom: 48, left: 54 };
  const allPoints = [
    ...plan.chartSeries.currentPath,
    ...plan.chartSeries.targetPath,
    ...plan.chartSeries.conservativePath,
  ];
  const maxValue = Math.max(
    ...allPoints.map((point) => point.corpus),
    plan.chartSeries.goalCorpus,
    1,
  );
  const minAge = plan.chartSeries.currentPath[0]?.age ?? 0;
  const retirementAge = plan.chartSeries.retirementAge;
  const maxAge = plan.chartSeries.horizonAge;

  const pointToX = (age: number) =>
    padding.left +
    ((age - minAge) / Math.max(maxAge - minAge, 1)) *
      (width - padding.left - padding.right);
  const pointToY = (corpus: number) =>
    height -
    padding.bottom -
    (Math.max(corpus, 0) / maxValue) * (height - padding.top - padding.bottom);

  const buildPath = (series: FirePlan["chartSeries"]["currentPath"]) =>
    series
      .map((point, index) => {
        const x = pointToX(point.age);
        const y = pointToY(point.corpus);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const currentPath = buildPath(plan.chartSeries.currentPath);
  const targetPath = buildPath(plan.chartSeries.targetPath);
  const conservativePath = buildPath(plan.chartSeries.conservativePath);
  const yLabels = [1, 0.66, 0.33, 0].map((ratio) => compactInr(maxValue * ratio));
  const currentExhaustionPoint = plan.chartSeries.currentPath.find(
    (point, index) =>
      index === plan.chartSeries.currentPath.length - 1 && point.corpus === 0,
  );
  const targetExhaustionPoint = plan.chartSeries.targetPath.find(
    (point, index) =>
      index === plan.chartSeries.targetPath.length - 1 && point.corpus === 0,
  );
  const conservativeExhaustionPoint = plan.chartSeries.conservativePath.find(
    (point, index) =>
      index === plan.chartSeries.conservativePath.length - 1 && point.corpus === 0,
  );

  return (
    <div className="fire-chart-card">
      <div className="fire-chart-head">
        <div>
          <span className="eyebrow">Trajectory</span>
          <h4>Current, recommended, and conservative path</h4>
        </div>
        <div className="fire-chart-legend">
          <span><i className="legend-dot recommended" /> Recommended path</span>
          <span><i className="legend-dot current" /> Current path</span>
          <span><i className="legend-dot conservative" /> Conservative path</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="fire-chart-svg" aria-hidden="true">
        <defs>
          <linearGradient id="fireTargetFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(21, 146, 222, 0.12)" />
            <stop offset="100%" stopColor="rgba(21, 146, 222, 0)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((line) => {
          const y =
            padding.top + (line * (height - padding.top - padding.bottom)) / 3;
          return (
            <line
              key={line}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              className="fire-grid-line"
            />
          );
        })}

        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={pointToY(plan.chartSeries.goalCorpus)}
          y2={pointToY(plan.chartSeries.goalCorpus)}
          className="fire-goal-line"
        />
        <text
          x={width - padding.right}
          y={pointToY(plan.chartSeries.goalCorpus) - 8}
          textAnchor="end"
          className="fire-axis-label"
        >
          Goal corpus
        </text>

        <line
          x1={pointToX(plan.chartSeries.currentPath[0]?.age ?? 0)}
          x2={pointToX(plan.chartSeries.currentPath[0]?.age ?? 0)}
          y1={padding.top}
          y2={height - padding.bottom}
          className="fire-vertical-guide"
        />
        <line
          x1={pointToX(retirementAge)}
          x2={pointToX(retirementAge)}
          y1={padding.top}
          y2={height - padding.bottom}
          className="fire-vertical-guide active"
        />
        <text
          x={pointToX(retirementAge)}
          y={padding.top - 6}
          textAnchor="middle"
          className="fire-axis-label"
        >
          Retirement starts
        </text>

        <path d={targetPath} className="fire-line recommended" />
        <path d={currentPath} className="fire-line current" />
        <path d={conservativePath} className="fire-line conservative" />

        {plan.chartSeries.expenseMarkers.map((marker) => (
          marker.age <= plan.chartSeries.horizonAge ? (
            <g key={`${marker.year}-${marker.label}`}>
              <line
                x1={pointToX(marker.age)}
                x2={pointToX(marker.age)}
                y1={height - padding.bottom}
                y2={height - padding.bottom + 10}
                className="fire-expense-marker"
              />
            </g>
          ) : null
        ))}

        {plan.chartSeries.currentPath.map((point, index) =>
          index === 0 || index === plan.chartSeries.currentPath.length - 1 ? (
            <circle
              key={`current-${point.age}`}
              cx={pointToX(point.age)}
              cy={pointToY(point.corpus)}
              r="4.5"
              className="fire-dot current"
            />
          ) : null,
        )}
        {plan.chartSeries.targetPath.map((point, index) =>
          index === 0 || index === plan.chartSeries.targetPath.length - 1 ? (
            <circle
              key={`target-${point.age}`}
              cx={pointToX(point.age)}
              cy={pointToY(point.corpus)}
              r="4.5"
              className="fire-dot recommended"
            />
          ) : null,
        )}

        {currentExhaustionPoint ? (
          <text
            x={pointToX(currentExhaustionPoint.age)}
            y={pointToY(currentExhaustionPoint.corpus) - 10}
            textAnchor="middle"
            className="fire-axis-label"
          >
            Current path ends at age {Math.round(currentExhaustionPoint.age)}
          </text>
        ) : null}
        {targetExhaustionPoint ? (
          <text
            x={pointToX(targetExhaustionPoint.age)}
            y={pointToY(targetExhaustionPoint.corpus) - 24}
            textAnchor="middle"
            className="fire-axis-label"
          >
            Goal path ends at age {Math.round(targetExhaustionPoint.age)}
          </text>
        ) : null}
        {conservativeExhaustionPoint ? (
          <text
            x={pointToX(conservativeExhaustionPoint.age)}
            y={pointToY(conservativeExhaustionPoint.corpus) - 38}
            textAnchor="middle"
            className="fire-axis-label"
          >
            Conservative path ends at age {Math.round(conservativeExhaustionPoint.age)}
          </text>
        ) : null}

        {plan.chartSeries.currentExhaustionAge &&
        plan.chartSeries.currentExhaustionAge < plan.chartSeries.lifeExpectancy ? (
          <text
            x={pointToX(plan.chartSeries.currentExhaustionAge)}
            y={height - padding.bottom + 26}
            textAnchor="middle"
            className="fire-axis-label"
          >
            You run out of money here
          </text>
        ) : null}

        {yLabels.map((label, index) => (
          <text
            key={label}
            x={10}
            y={
              padding.top +
              (index * (height - padding.top - padding.bottom)) / 3 +
              5
            }
            className="fire-axis-label"
          >
            {label}
          </text>
        ))}

        {[minAge, retirementAge, plan.chartSeries.lifeExpectancy].map((age) => (
          <text
            key={age}
            x={pointToX(age)}
            y={height - 14}
            textAnchor="middle"
            className="fire-axis-label"
          >
            Age {Math.round(age)}
          </text>
        ))}
      </svg>

      <div className="fire-chart-footnote">
        Planned expenses are inflated to their year of occurrence and deducted from the
        corpus before growth resumes. Post-retirement drawdown uses a real-return view
        so the corpus declines smoothly after retirement begins.
      </div>
    </div>
  );
}
