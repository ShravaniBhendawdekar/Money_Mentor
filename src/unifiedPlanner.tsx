import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  generateFireGuidance,
  generateMoneyHealthGuidance,
  type FireGuidanceResult,
  type MoneyHealthGuidanceResult,
} from "./ai";
import { fireDefaults, moneyHealthDefaults } from "./data";
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
import {
  computeMoneyHealthPlan,
  validateMoneyHealthInputs,
  type MoneyHealthDimension,
  type MoneyHealthInputs,
  type MoneyHealthPlan,
  type MoneyHealthValidation,
} from "./moneyHealth";

type WorkspaceFeature = "fire" | "health";
type FireResultTab = "overview" | "roadmap" | "execution";

type SharedDraftInputs = {
  age: string;
  annualIncome: string;
  monthlyExpenses: string;
  dependents: string;
  targetRetirementAge: string;
  lifeExpectancy: string;
  liquidSavings: string;
  currentLifeCover: string;
  healthInsuranceCover: string;
  equityInvestments: string;
  debtInvestments: string;
  retirementInvestments: string;
  currentMonthlySip: string;
  liabilities: string;
  monthlyEmis: string;
  highInterestDebt: string;
  annualTaxSavingInvestments: string;
  annualHealthInsurancePremium: string;
  targetMonthlyDrawToday: string;
};

type CombinedValidation = {
  errors: string[];
  warnings: string[];
  fields: Record<string, { errors: string[]; warnings: string[] }>;
};

const fireTabs: Array<{ id: FireResultTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "roadmap", label: "Roadmap" },
  { id: "execution", label: "Execution" },
];

function buildDraftFromDefaults(): SharedDraftInputs {
  return {
    age: String(fireDefaults.age),
    annualIncome: String(fireDefaults.annualIncome),
    monthlyExpenses: String(fireDefaults.monthlyExpenses),
    dependents: String(moneyHealthDefaults.dependents),
    targetRetirementAge: String(fireDefaults.retirementAge),
    lifeExpectancy: String(fireDefaults.lifeExpectancy),
    liquidSavings: String(moneyHealthDefaults.liquidSavings),
    currentLifeCover: String(fireDefaults.currentLifeCover),
    healthInsuranceCover: String(moneyHealthDefaults.healthInsuranceCover),
    equityInvestments: String(moneyHealthDefaults.equityInvestments),
    debtInvestments: String(moneyHealthDefaults.debtInvestments),
    retirementInvestments: String(moneyHealthDefaults.retirementInvestments),
    currentMonthlySip: String(fireDefaults.currentMonthlySip),
    liabilities: String(fireDefaults.liabilities),
    monthlyEmis: String(moneyHealthDefaults.monthlyEmis),
    highInterestDebt: String(moneyHealthDefaults.highInterestDebt),
    annualTaxSavingInvestments: String(moneyHealthDefaults.annualTaxSavingInvestments),
    annualHealthInsurancePremium: String(
      moneyHealthDefaults.annualHealthInsurancePremium,
    ),
    targetMonthlyDrawToday: String(fireDefaults.targetMonthlyDrawToday),
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

function toFireInputs(draft: SharedDraftInputs): FireInputs {
  return {
    age: parseNumber(draft.age, fireDefaults.age),
    retirementAge: parseNumber(draft.targetRetirementAge, fireDefaults.retirementAge),
    lifeExpectancy: parseNumber(draft.lifeExpectancy, fireDefaults.lifeExpectancy),
    annualIncome: parseNumber(draft.annualIncome, fireDefaults.annualIncome),
    monthlyExpenses: parseNumber(draft.monthlyExpenses, fireDefaults.monthlyExpenses),
    currentMfCorpus:
      parseNumber(draft.equityInvestments, 0) + parseNumber(draft.debtInvestments, 0),
    currentPpfCorpus: parseNumber(draft.retirementInvestments, fireDefaults.currentPpfCorpus),
    epfCorpus: 0,
    currentLiquidSavings: parseNumber(draft.liquidSavings, 0),
    targetMonthlyDrawToday: parseNumber(
      draft.targetMonthlyDrawToday,
      fireDefaults.targetMonthlyDrawToday,
    ),
    currentMonthlySip: parseNumber(draft.currentMonthlySip, fireDefaults.currentMonthlySip),
    annualIncomeGrowthRate: fireDefaults.annualIncomeGrowthRate,
    inflationRate: fireDefaults.inflationRate,
    preRetirementReturn: fireDefaults.preRetirementReturn,
    postRetirementReturn: fireDefaults.postRetirementReturn,
    safeWithdrawalRate: fireDefaults.safeWithdrawalRate,
    currentLifeCover: parseNumber(draft.currentLifeCover, fireDefaults.currentLifeCover),
    hasPureTermPlan: true,
    liabilities: parseNumber(draft.liabilities, fireDefaults.liabilities),
    dependents: parseNumber(draft.dependents, fireDefaults.dependents),
    plannedExpenses: [],
  };
}

function toMoneyHealthInputs(draft: SharedDraftInputs): MoneyHealthInputs {
  return {
    age: parseNumber(draft.age, moneyHealthDefaults.age),
    annualIncome: parseNumber(draft.annualIncome, moneyHealthDefaults.annualIncome),
    monthlyExpenses: parseNumber(draft.monthlyExpenses, moneyHealthDefaults.monthlyExpenses),
    dependents: parseNumber(draft.dependents, moneyHealthDefaults.dependents),
    targetRetirementAge: parseNumber(
      draft.targetRetirementAge,
      moneyHealthDefaults.targetRetirementAge,
    ),
    liquidSavings: parseNumber(draft.liquidSavings, moneyHealthDefaults.liquidSavings),
    currentLifeCover: parseNumber(draft.currentLifeCover, moneyHealthDefaults.currentLifeCover),
    healthInsuranceCover: parseNumber(
      draft.healthInsuranceCover,
      moneyHealthDefaults.healthInsuranceCover,
    ),
    equityInvestments: parseNumber(draft.equityInvestments, moneyHealthDefaults.equityInvestments),
    debtInvestments: parseNumber(draft.debtInvestments, moneyHealthDefaults.debtInvestments),
    retirementInvestments: parseNumber(
      draft.retirementInvestments,
      moneyHealthDefaults.retirementInvestments,
    ),
    currentMonthlySip: parseNumber(draft.currentMonthlySip, moneyHealthDefaults.currentMonthlySip),
    monthlyEmis: parseNumber(draft.monthlyEmis, moneyHealthDefaults.monthlyEmis),
    highInterestDebt: parseNumber(draft.highInterestDebt, moneyHealthDefaults.highInterestDebt),
    liabilities: parseNumber(draft.liabilities, moneyHealthDefaults.liabilities),
    annualTaxSavingInvestments: parseNumber(
      draft.annualTaxSavingInvestments,
      moneyHealthDefaults.annualTaxSavingInvestments,
    ),
    annualHealthInsurancePremium: parseNumber(
      draft.annualHealthInsurancePremium,
      moneyHealthDefaults.annualHealthInsurancePremium,
    ),
  };
}

function mergeValidation(
  fireValidation: FireValidation,
  healthValidation: MoneyHealthValidation,
): CombinedValidation {
  const fields = { ...fireValidation.fields } as CombinedValidation["fields"];

  Object.entries(healthValidation.fields).forEach(([key, value]) => {
    const existing = fields[key] ?? { errors: [], warnings: [] };
    fields[key] = {
      errors: [...existing.errors, ...value.errors],
      warnings: [...existing.warnings, ...value.warnings],
    };
  });

  return {
    errors: [...fireValidation.errors, ...healthValidation.errors],
    warnings: [...fireValidation.warnings, ...healthValidation.warnings],
    fields,
  };
}

function getFieldState(
  validation: CombinedValidation,
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
  if (!value.trim()) {
    return null;
  }
  return inr(parseNumber(value, 0));
}

function getFireHeadline(plan: FirePlan, inputs: FireInputs) {
  return plan.decision.message || `Retire at ${inputs.retirementAge}`;
}

export function UnifiedPlannerPage({ onGoHome }: { onGoHome: () => void }) {
  const [draftInputs, setDraftInputs] = useState<SharedDraftInputs>(() =>
    buildDraftFromDefaults(),
  );
  const [submittedDraft, setSubmittedDraft] = useState<SharedDraftInputs | null>(null);
  const [activeFeature, setActiveFeature] = useState<WorkspaceFeature>("fire");
  const [activeFireTab, setActiveFireTab] = useState<FireResultTab>("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);
  const [fireGuidance, setFireGuidance] = useState<FireGuidanceResult | null>(null);
  const [healthGuidance, setHealthGuidance] =
    useState<MoneyHealthGuidanceResult | null>(null);
  const requestIdRef = useRef(0);

  const parsedFireInputs = useMemo(() => toFireInputs(draftInputs), [draftInputs]);
  const parsedHealthInputs = useMemo(() => toMoneyHealthInputs(draftInputs), [draftInputs]);
  const validation = useMemo(
    () =>
      mergeValidation(
        validateFireInputs(parsedFireInputs),
        validateMoneyHealthInputs(parsedHealthInputs),
      ),
    [parsedFireInputs, parsedHealthInputs],
  );

  const submittedFireInputs = useMemo(
    () => (submittedDraft ? toFireInputs(submittedDraft) : null),
    [submittedDraft],
  );
  const submittedHealthInputs = useMemo(
    () => (submittedDraft ? toMoneyHealthInputs(submittedDraft) : null),
    [submittedDraft],
  );
  const firePlan = useMemo(
    () => (submittedFireInputs ? computeFirePlan(submittedFireInputs) : null),
    [submittedFireInputs],
  );
  const healthPlan = useMemo(
    () => (submittedHealthInputs ? computeMoneyHealthPlan(submittedHealthInputs) : null),
    [submittedHealthInputs],
  );

  const isFormMode = !submittedDraft || isEditing;
  const shouldShowValidation = formAttempted;

  const setFieldValue = (key: keyof SharedDraftInputs, value: string) => {
    setDraftInputs((current) => {
      const next = { ...current, [key]: value };
      if (key === "monthlyExpenses" && current.targetMonthlyDrawToday === current.monthlyExpenses) {
        next.targetMonthlyDrawToday = value;
      }
      return next;
    });
  };

  const handleUseSample = () => {
    setDraftInputs(buildDraftFromDefaults());
  };

  const handleGenerate = async () => {
    setFormAttempted(true);
    if (validation.errors.length > 0) {
      return;
    }

    const nextFire = parsedFireInputs;
    const nextHealth = parsedHealthInputs;
    const nextFirePlan = computeFirePlan(nextFire);
    const nextHealthPlan = computeMoneyHealthPlan(nextHealth);
    const requestId = ++requestIdRef.current;

    setSubmittedDraft({ ...draftInputs });
    setActiveFeature("fire");
    setActiveFireTab("overview");
    setIsEditing(false);
    setIsGenerating(true);

    try {
      const [nextFireGuidance, nextHealthGuidance] = await Promise.all([
        generateFireGuidance(nextFire, nextFirePlan),
        generateMoneyHealthGuidance(nextHealth, nextHealthPlan),
      ]);
      if (requestId === requestIdRef.current) {
        setFireGuidance(nextFireGuidance);
        setHealthGuidance(nextHealthGuidance);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsGenerating(false);
      }
    }
  };

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
            <span className="planner-tag">Unified money workspace</span>
            <button className="ghost-link" type="button" onClick={onGoHome}>
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="container unified-page-shell">
        {isFormMode ? (
          <section className="unified-intake-shell">
            <aside className="unified-sidebar-card">
              <span className="eyebrow">
                {submittedDraft ? "Update onboarding" : "Step 1 of product flow"}
              </span>
              <h1>Start once, unlock both views</h1>
              <p>
                Complete one shared onboarding. We will generate your FIRE plan
                and your Money Health Score together from the same money snapshot.
              </p>

              <div className="unified-sidebar-points">
                <div className="unified-sidebar-pill">FIRE roadmap</div>
                <div className="unified-sidebar-pill">Money health score</div>
                <div className="unified-sidebar-pill">AI action summary</div>
              </div>

              <div className="fire-sidebar-actions">
                <button className="soft-button" type="button" onClick={handleUseSample}>
                  Use sample profile
                </button>
                {submittedDraft ? (
                  <button className="ghost-link" type="button" onClick={() => setIsEditing(false)}>
                    Back to dashboard
                  </button>
                ) : null}
                <button className="button button-primary planner-button" type="button" onClick={handleGenerate}>
                  {submittedDraft ? "Refresh dashboard" : "Generate dashboard"}
                </button>
              </div>
            </aside>

            <section className="unified-form-card">
              <div className="fire-section-head">
                <span className="eyebrow">Shared onboarding</span>
                <h3>Enter the core inputs once</h3>
              </div>

              <div className="health-form-sections">
                <UnifiedFormSection title="Income, goals, and lifestyle">
                  <div className="health-field-grid">
                    <UnifiedNumericField label="Current age" value={draftInputs.age} placeholder="34" onChange={(value) => setFieldValue("age", value)} {...getFieldState(validation, "age", shouldShowValidation)} />
                    <UnifiedNumericField label="Retirement age target" value={draftInputs.targetRetirementAge} placeholder="50" helper={`${Math.max(parseNumber(draftInputs.targetRetirementAge, 0) - parseNumber(draftInputs.age, 0), 0)} years away`} onChange={(value) => setFieldValue("targetRetirementAge", value)} {...getFieldState(validation, "targetRetirementAge", shouldShowValidation)} />
                    <UnifiedNumericField label="Annual income" value={draftInputs.annualIncome} placeholder="2400000" preview={formatRupeePreview(draftInputs.annualIncome)} onChange={(value) => setFieldValue("annualIncome", value)} {...getFieldState(validation, "annualIncome", shouldShowValidation)} />
                    <UnifiedNumericField label="Monthly expenses" value={draftInputs.monthlyExpenses} placeholder="95000" preview={formatRupeePreview(draftInputs.monthlyExpenses)} onChange={(value) => setFieldValue("monthlyExpenses", value)} {...getFieldState(validation, "monthlyExpenses", shouldShowValidation)} />
                    <UnifiedNumericField label="Retirement monthly draw" value={draftInputs.targetMonthlyDrawToday} placeholder="95000" preview={formatRupeePreview(draftInputs.targetMonthlyDrawToday)} helper="Today's monthly spending target after retirement" onChange={(value) => setFieldValue("targetMonthlyDrawToday", value)} {...getFieldState(validation, "targetMonthlyDrawToday", shouldShowValidation)} />
                    <UnifiedNumericField label="Dependents" value={draftInputs.dependents} placeholder="2" onChange={(value) => setFieldValue("dependents", value)} />
                  </div>
                </UnifiedFormSection>

                <UnifiedFormSection title="Current assets and protection">
                  <div className="health-field-grid">
                    <UnifiedNumericField label="Liquid savings" value={draftInputs.liquidSavings} placeholder="300000" preview={formatRupeePreview(draftInputs.liquidSavings)} helper="Savings, FD, or liquid fund available quickly" onChange={(value) => setFieldValue("liquidSavings", value)} />
                    <UnifiedNumericField label="Life cover" value={draftInputs.currentLifeCover} placeholder="5000000" preview={formatRupeePreview(draftInputs.currentLifeCover)} onChange={(value) => setFieldValue("currentLifeCover", value)} {...getFieldState(validation, "currentLifeCover", shouldShowValidation)} />
                    <UnifiedNumericField label="Health insurance cover" value={draftInputs.healthInsuranceCover} placeholder="500000" preview={formatRupeePreview(draftInputs.healthInsuranceCover)} onChange={(value) => setFieldValue("healthInsuranceCover", value)} {...getFieldState(validation, "healthInsuranceCover", shouldShowValidation)} />
                    <UnifiedNumericField label="Life expectancy" value={draftInputs.lifeExpectancy} placeholder="90" helper="Used for longevity and retirement drawdown checks" onChange={(value) => setFieldValue("lifeExpectancy", value)} {...getFieldState(validation, "lifeExpectancy", shouldShowValidation)} />
                  </div>
                </UnifiedFormSection>

                <UnifiedFormSection title="Investing and debt">
                  <div className="health-field-grid">
                    <UnifiedNumericField label="Equity investments" value={draftInputs.equityInvestments} placeholder="1800000" preview={formatRupeePreview(draftInputs.equityInvestments)} onChange={(value) => setFieldValue("equityInvestments", value)} {...getFieldState(validation, "equityInvestments", shouldShowValidation)} />
                    <UnifiedNumericField label="Debt investments" value={draftInputs.debtInvestments} placeholder="300000" preview={formatRupeePreview(draftInputs.debtInvestments)} onChange={(value) => setFieldValue("debtInvestments", value)} />
                    <UnifiedNumericField label="Retirement-only investments" value={draftInputs.retirementInvestments} placeholder="600000" preview={formatRupeePreview(draftInputs.retirementInvestments)} onChange={(value) => setFieldValue("retirementInvestments", value)} />
                    <UnifiedNumericField label="Current monthly SIP" value={draftInputs.currentMonthlySip} placeholder="45000" preview={formatRupeePreview(draftInputs.currentMonthlySip)} onChange={(value) => setFieldValue("currentMonthlySip", value)} {...getFieldState(validation, "currentMonthlySip", shouldShowValidation)} />
                    <UnifiedNumericField label="Monthly EMIs" value={draftInputs.monthlyEmis} placeholder="18000" preview={formatRupeePreview(draftInputs.monthlyEmis)} onChange={(value) => setFieldValue("monthlyEmis", value)} {...getFieldState(validation, "monthlyEmis", shouldShowValidation)} />
                    <UnifiedNumericField label="High-interest debt" value={draftInputs.highInterestDebt} placeholder="0" preview={formatRupeePreview(draftInputs.highInterestDebt)} onChange={(value) => setFieldValue("highInterestDebt", value)} />
                    <UnifiedNumericField label="Outstanding liabilities" value={draftInputs.liabilities} placeholder="2000000" preview={formatRupeePreview(draftInputs.liabilities)} onChange={(value) => setFieldValue("liabilities", value)} {...getFieldState(validation, "liabilities", shouldShowValidation)} />
                    <UnifiedNumericField label="Tax-saving investments used" value={draftInputs.annualTaxSavingInvestments} placeholder="120000" preview={formatRupeePreview(draftInputs.annualTaxSavingInvestments)} onChange={(value) => setFieldValue("annualTaxSavingInvestments", value)} />
                    <UnifiedNumericField label="Annual health premium" value={draftInputs.annualHealthInsurancePremium} placeholder="18000" preview={formatRupeePreview(draftInputs.annualHealthInsurancePremium)} onChange={(value) => setFieldValue("annualHealthInsurancePremium", value)} />
                  </div>
                </UnifiedFormSection>
              </div>
            </section>
          </section>
        ) : isGenerating || !firePlan || !healthPlan || !submittedFireInputs || !submittedHealthInputs ? (
          <section className="fire-generating-shell">
            <div className="fire-generating-card">
              <div className="fire-generating-spinner" />
              <span className="eyebrow">Generating dashboard</span>
              <h2>Building both results together</h2>
              <p>
                We are calculating your FIRE roadmap and your Money Health Score,
                then preparing AI-backed priorities for both views.
              </p>
            </div>
          </section>
        ) : (
          <section className="workspace-dashboard-shell">
            <aside className="workspace-feature-sidebar">
              <div className="workspace-feature-sidebar-head">
                <span className="eyebrow">Workspace</span>
                <h2>Views</h2>
              </div>

              <nav className="workspace-feature-nav" aria-label="Feature views">
                <button className={`workspace-feature-tab ${activeFeature === "fire" ? "active" : ""}`} type="button" onClick={() => setActiveFeature("fire")}>
                  <strong>FIRE Planner</strong>
                  <span>{getFireHeadline(firePlan, submittedFireInputs)}</span>
                </button>

                <button className={`workspace-feature-tab ${activeFeature === "health" ? "active" : ""}`} type="button" onClick={() => setActiveFeature("health")}>
                  <strong>Money Health Score</strong>
                  <span>{healthPlan.overallScore}/100 overall wellness score</span>
                </button>
              </nav>

              <div className="workspace-sidebar-note">
                One onboarding powers both views.
              </div>

              <div className="workspace-rail-actions">
                <button className="soft-button" type="button" onClick={() => setIsEditing(true)}>
                  Edit onboarding
                </button>
              </div>
            </aside>

            <div className="workspace-main-panel">
              {activeFeature === "fire" ? (
                <FireWorkspaceView inputs={submittedFireInputs} plan={firePlan} guidance={fireGuidance} activeTab={activeFireTab} onTabChange={setActiveFireTab} />
              ) : (
                <HealthWorkspaceView plan={healthPlan} guidance={healthGuidance} />
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function UnifiedFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="health-form-section">
      <div className="health-form-section-head">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function UnifiedNumericField({
  label,
  value,
  placeholder,
  helper,
  preview,
  error,
  warning,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  helper?: string;
  preview?: string | null;
  error?: string;
  warning?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="health-input-field">
      <span className="health-input-label">{label}</span>
      <input
        className={error ? "field-error" : warning ? "field-warning" : ""}
        value={value}
        placeholder={placeholder}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="health-input-meta">
        {error ? <span className="field-message error">{error}</span> : null}
        {!error && warning ? <span className="field-message warning">{warning}</span> : null}
        {!error && !warning && helper ? <span className="health-input-helper">{helper}</span> : null}
        {!error && !warning && preview ? <span className="health-input-preview">{preview}</span> : null}
        {!error && !warning && !helper && !preview ? (
          <span className="health-input-placeholder">.</span>
        ) : null}
      </div>
    </label>
  );
}

function WorkspaceSectionCard({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
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

function MetricTile({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "primary" | "success";
}) {
  return (
    <article className={`fire-metric-tile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function FireWorkspaceView({
  inputs,
  plan,
  guidance,
  activeTab,
  onTabChange,
}: {
  inputs: FireInputs;
  plan: FirePlan;
  guidance: FireGuidanceResult | null;
  activeTab: FireResultTab;
  onTabChange: (tab: FireResultTab) => void;
}) {
  return (
    <div className="fire-panel-stack">
      <div className="fire-plan-bar compact">
        <div className="fire-plan-bar-copy">
          <span className="eyebrow">FIRE Planner</span>
          <h2>
            {plan.decision.status === "on_track"
              ? "Your retirement path is clear"
              : "Your retirement path needs adjustment"}
          </h2>
          <p>{plan.decision.message}</p>
        </div>
        <div className="fire-plan-bar-status">
          <strong>Retire at {inputs.retirementAge}</strong>
          <span>Current path is around age {plan.estimatedRetirementAgeOnCurrentPath}</span>
        </div>
      </div>

      <div className="fire-tab-strip">
        {fireTabs.map((tab) => (
          <button
            key={tab.id}
            className={`fire-tab ${activeTab === tab.id ? "active" : ""}`}
            type="button"
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="fire-panel-stack">
          <div className="fire-overview-shell">
            <div className="fire-overview-copy">
              <span className="eyebrow">Verdict</span>
              <h3>{plan.decision.message}</h3>
              <div className={`fire-decision-banner ${plan.decision.status}`}>
                {guidance?.sections.plan?.[0] ?? `Target corpus ${compactInr(plan.targetCorpus)} with ${inr(plan.requiredSip)} per month.`}
              </div>
              <div className="fire-metric-grid">
                <MetricTile label="Target corpus" value={compactInr(plan.targetCorpus)} helper={`Needs ${inr(plan.requiredSip)} per month`} tone="primary" />
                <MetricTile label="Current path" value={`Age ${plan.estimatedRetirementAgeOnCurrentPath}`} helper={`Current SIP ${inr(plan.currentSip)}`} />
                <MetricTile label="Longevity" value={`Age ${plan.longevity.lastsUntilAge}`} helper={`Life expectancy ${inputs.lifeExpectancy}`} tone={plan.longevity.status === "strong" ? "success" : "default"} />
                <MetricTile label="Required SIP load" value={formatPercent(plan.takeHomeFeasibility.requiredSipShare * 100)} helper={`${inr(plan.requiredSip)} vs ${inr(plan.takeHomeFeasibility.monthlyTakeHome)} take-home`} />
              </div>
            </div>

            <FireTrajectoryChart plan={plan} />
          </div>

          <WorkspaceSectionCard kicker="AI guidance" title="What the planner would do next">
            <div className="fire-guidance-grid">
              <div className="fire-guidance-card blue">
                <span>Plan</span>
                <ul>{(guidance?.sections.plan ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="fire-guidance-card amber">
                <span>Risks</span>
                <ul>{(guidance?.sections.risks ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="fire-guidance-card green">
                <span>Next actions</span>
                <ul>{(guidance?.sections.nextActions ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          </WorkspaceSectionCard>
        </div>
      ) : activeTab === "roadmap" ? (
        <div className="fire-panel-stack">
          <WorkspaceSectionCard kicker="Roadmap" title="Practical ways to improve the plan">
            <div className="fire-scenario-grid">
              {plan.scenarios.map((scenario) => (
                <article key={scenario.id} className="fire-scenario-card">
                  <span>{scenario.label}</span>
                  <h4>Retire at {scenario.retirementAgePossible}</h4>
                  <strong>{inr(scenario.sip)}</strong>
                  <p>{scenario.message}</p>
                </article>
              ))}
            </div>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard kicker="First 12 months" title="Month-by-month roadmap">
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
          </WorkspaceSectionCard>
        </div>
      ) : (
        <div className="fire-panel-stack">
          <WorkspaceSectionCard kicker="Execution" title="Suggested monthly allocation">
            <div className="fire-allocation-stack">
              {plan.sipAllocation.buckets.map((bucket) => (
                <div key={bucket.label} className="fire-allocation-row">
                  <span>{bucket.label}</span>
                  <div className="fire-allocation-bar">
                    <div
                      className={`fire-allocation-fill ${bucket.tone}`}
                      style={{
                        width: `${Math.max((bucket.amount / Math.max(plan.sipAllocation.total, 1)) * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <strong>{inr(bucket.amount)}</strong>
                </div>
              ))}
            </div>
            <p className="fire-footnote">
              Debt allocation sends up to ₹12,500 per month to PPF and redirects any
              extra debt sleeve into liquid funds so the total still matches {inr(plan.requiredSip)}.
            </p>
          </WorkspaceSectionCard>
        </div>
      )}
    </div>
  );
}

function HealthWorkspaceView({
  plan,
  guidance,
}: {
  plan: MoneyHealthPlan;
  guidance: MoneyHealthGuidanceResult | null;
}) {
  return (
    <div className="health-results-shell">
      <div className="health-results-top">
        <div className="health-results-copy">
          <span className="eyebrow">Money health</span>
          <h1>Your financial wellness at a glance</h1>
          <p>{guidance?.coachLine ?? plan.biggestOpportunity}</p>
        </div>
      </div>

      <section className="health-score-hero">
        <div className="health-score-ring-wrap">
          <HealthScoreRing score={plan.overallScore} />
          <div className="health-score-meta">
            <strong>{plan.grade}</strong>
            <p>{plan.biggestOpportunity}</p>
          </div>
        </div>

        <div className="health-ai-card">
          <span className="eyebrow">AI coach</span>
          <h3>What to fix first</h3>
          <div className="health-coach-list">
            {(guidance?.priorities ?? plan.actions.map((action) => action.title)).map((item) => (
              <div key={item} className="health-coach-item">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="health-dimension-grid">
        {plan.dimensions.map((dimension) => (
          <HealthDimensionCard key={dimension.id} dimension={dimension} />
        ))}
      </section>

      <section className="health-action-section">
        <div className="fire-section-head">
          <span className="eyebrow">Top actions</span>
          <h3>Highest-impact moves for the next 30 days</h3>
        </div>
        <div className="health-action-list">
          {plan.actions.map((action) => (
            <article key={action.title} className={`health-action-card ${action.tone}`}>
              <strong>{action.title}</strong>
              <p>{action.detail}</p>
              <span>{action.impact}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="health-bottom-grid">
        <div className="health-metrics-card">
          <div className="fire-section-head">
            <span className="eyebrow">Snapshot</span>
            <h3>What the score is reading underneath</h3>
          </div>
          <div className="health-snapshot-grid">
            <HealthMetricChip label="Emergency target" value={inr(plan.metrics.emergencyTarget)} helper={`${plan.metrics.emergencyMonths.toFixed(1)} months saved`} />
            <HealthMetricChip label="Life cover target" value={inr(plan.metrics.lifeCoverTarget)} helper={`Health cover target ${inr(plan.metrics.healthCoverTarget)}`} />
            <HealthMetricChip label="Retirement corpus target" value={compactInr(plan.metrics.retirementTargetCorpus)} helper={`Current path age ${plan.metrics.retirementCurrentPathAge}`} />
            <HealthMetricChip label="Required SIP" value={inr(plan.metrics.retirementRequiredSip)} helper={`Tax savings used ${inr(plan.metrics.taxSavingsUsed)}`} />
          </div>
        </div>

        <div className="health-rationale-card">
          <div className="fire-section-head">
            <span className="eyebrow">Why this score</span>
            <h3>Reasoning highlights</h3>
          </div>
          <div className="health-rationale-list">
            {(guidance?.rationale ?? plan.dimensions.slice(0, 3).map((dimension) => dimension.detail)).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function HealthScoreRing({ score }: { score: number }) {
  const radius = 84;
  const stroke = 16;
  const size = radius * 2 + stroke * 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const tone = score >= 80 ? "good" : score >= 60 ? "watch" : "alert";

  return (
    <div className={`health-score-ring ${tone}`}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} className="health-score-ring-track" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} className="health-score-ring-progress" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={dashOffset} />
      </svg>
      <div className="health-score-ring-center">
        <strong>{score}</strong>
        <span>Health score</span>
      </div>
    </div>
  );
}

function HealthDimensionCard({ dimension }: { dimension: MoneyHealthDimension }) {
  return (
    <article className={`health-dimension-card ${dimension.tone}`}>
      <div className="health-dimension-head">
        <strong>{dimension.label}</strong>
        <span>{dimension.score}/100</span>
      </div>
      <div className="health-dimension-bar">
        <div className="health-dimension-fill" style={{ width: `${Math.max(dimension.score, 6)}%` }} />
      </div>
      <p>{dimension.summary}</p>
      <small>{dimension.detail}</small>
    </article>
  );
}

function HealthMetricChip({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="health-metric-chip">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function FireTrajectoryChart({ plan }: { plan: FirePlan }) {
  const width = 920;
  const height = 360;
  const padding = { top: 26, right: 32, bottom: 48, left: 54 };
  const allPoints = [...plan.chartSeries.currentPath, ...plan.chartSeries.targetPath, ...plan.chartSeries.conservativePath];
  const maxValue = Math.max(...allPoints.map((point) => point.corpus), plan.chartSeries.goalCorpus, 1);
  const minAge = plan.chartSeries.currentPath[0]?.age ?? 0;
  const retirementAge = plan.chartSeries.retirementAge;
  const maxAge = plan.chartSeries.horizonAge;
  const pointToX = (age: number) => padding.left + ((age - minAge) / Math.max(maxAge - minAge, 1)) * (width - padding.left - padding.right);
  const pointToY = (corpus: number) => height - padding.bottom - (Math.max(corpus, 0) / maxValue) * (height - padding.top - padding.bottom);
  const buildPath = (series: FirePlan["chartSeries"]["currentPath"]) =>
    series.map((point, index) => `${index === 0 ? "M" : "L"} ${pointToX(point.age)} ${pointToY(point.corpus)}`).join(" ");
  const currentExhaustionPoint = plan.chartSeries.currentPath.find(
    (point, index) => index === plan.chartSeries.currentPath.length - 1 && point.corpus === 0,
  );

  return (
    <div className="fire-chart-card">
      <div className="fire-chart-head">
        <div>
          <span className="eyebrow">Trajectory</span>
          <h4>Current, recommended, and conservative path</h4>
        </div>
        <div className="fire-chart-legend">
          <span><i className="legend-dot recommended" /> Recommended</span>
          <span><i className="legend-dot current" /> Current</span>
          <span><i className="legend-dot conservative" /> Conservative</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="fire-chart-svg" aria-hidden="true">
        {[0, 1, 2, 3].map((line) => {
          const y = padding.top + (line * (height - padding.top - padding.bottom)) / 3;
          return <line key={line} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="fire-grid-line" />;
        })}
        <line x1={padding.left} x2={width - padding.right} y1={pointToY(plan.chartSeries.goalCorpus)} y2={pointToY(plan.chartSeries.goalCorpus)} className="fire-goal-line" />
        <line x1={pointToX(retirementAge)} x2={pointToX(retirementAge)} y1={padding.top} y2={height - padding.bottom} className="fire-vertical-guide active" />
        <text x={pointToX(retirementAge)} y={padding.top - 6} textAnchor="middle" className="fire-axis-label">Retirement starts</text>
        <path d={buildPath(plan.chartSeries.targetPath)} className="fire-line recommended" />
        <path d={buildPath(plan.chartSeries.currentPath)} className="fire-line current" />
        <path d={buildPath(plan.chartSeries.conservativePath)} className="fire-line conservative" />
        {currentExhaustionPoint ? <text x={pointToX(currentExhaustionPoint.age)} y={pointToY(currentExhaustionPoint.corpus) - 10} textAnchor="middle" className="fire-axis-label">You run out of money here</text> : null}
        {[minAge, retirementAge, plan.chartSeries.lifeExpectancy].map((age) => (
          <text key={age} x={pointToX(age)} y={height - 14} textAnchor="middle" className="fire-axis-label">
            Age {Math.round(age)}
          </text>
        ))}
      </svg>
      <div className="fire-chart-footnote">
        Growth runs before retirement, then the corpus shifts into drawdown mode after
        retirement begins so the post-retirement path declines smoothly instead of
        rising unrealistically.
      </div>
    </div>
  );
}
