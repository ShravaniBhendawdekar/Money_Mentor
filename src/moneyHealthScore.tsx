import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  generateMoneyHealthGuidance,
  type MoneyHealthGuidanceResult,
} from "./ai";
import { moneyHealthDefaults } from "./data";
import { compactInr, inr } from "./finance";
import {
  computeMoneyHealthPlan,
  validateMoneyHealthInputs,
  type MoneyHealthDimension,
  type MoneyHealthInputs,
  type MoneyHealthValidation,
} from "./moneyHealth";

type MoneyHealthDraftInputs = {
  age: string;
  annualIncome: string;
  monthlyExpenses: string;
  dependents: string;
  targetRetirementAge: string;
  liquidSavings: string;
  currentLifeCover: string;
  healthInsuranceCover: string;
  equityInvestments: string;
  debtInvestments: string;
  retirementInvestments: string;
  currentMonthlySip: string;
  monthlyEmis: string;
  highInterestDebt: string;
  liabilities: string;
  annualTaxSavingInvestments: string;
  annualHealthInsurancePremium: string;
};

function buildDraftFromInputs(inputs: MoneyHealthInputs): MoneyHealthDraftInputs {
  return {
    age: String(inputs.age),
    annualIncome: String(inputs.annualIncome),
    monthlyExpenses: String(inputs.monthlyExpenses),
    dependents: String(inputs.dependents),
    targetRetirementAge: String(inputs.targetRetirementAge),
    liquidSavings: String(inputs.liquidSavings),
    currentLifeCover: String(inputs.currentLifeCover),
    healthInsuranceCover: String(inputs.healthInsuranceCover),
    equityInvestments: String(inputs.equityInvestments),
    debtInvestments: String(inputs.debtInvestments),
    retirementInvestments: String(inputs.retirementInvestments),
    currentMonthlySip: String(inputs.currentMonthlySip),
    monthlyEmis: String(inputs.monthlyEmis),
    highInterestDebt: String(inputs.highInterestDebt),
    liabilities: String(inputs.liabilities),
    annualTaxSavingInvestments: String(inputs.annualTaxSavingInvestments),
    annualHealthInsurancePremium: String(inputs.annualHealthInsurancePremium),
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

function parseDraftInputs(draft: MoneyHealthDraftInputs): MoneyHealthInputs {
  return {
    age: parseNumber(draft.age, moneyHealthDefaults.age),
    annualIncome: parseNumber(draft.annualIncome, moneyHealthDefaults.annualIncome),
    monthlyExpenses: parseNumber(
      draft.monthlyExpenses,
      moneyHealthDefaults.monthlyExpenses,
    ),
    dependents: parseNumber(draft.dependents, moneyHealthDefaults.dependents),
    targetRetirementAge: parseNumber(
      draft.targetRetirementAge,
      moneyHealthDefaults.targetRetirementAge,
    ),
    liquidSavings: parseNumber(
      draft.liquidSavings,
      moneyHealthDefaults.liquidSavings,
    ),
    currentLifeCover: parseNumber(
      draft.currentLifeCover,
      moneyHealthDefaults.currentLifeCover,
    ),
    healthInsuranceCover: parseNumber(
      draft.healthInsuranceCover,
      moneyHealthDefaults.healthInsuranceCover,
    ),
    equityInvestments: parseNumber(
      draft.equityInvestments,
      moneyHealthDefaults.equityInvestments,
    ),
    debtInvestments: parseNumber(
      draft.debtInvestments,
      moneyHealthDefaults.debtInvestments,
    ),
    retirementInvestments: parseNumber(
      draft.retirementInvestments,
      moneyHealthDefaults.retirementInvestments,
    ),
    currentMonthlySip: parseNumber(
      draft.currentMonthlySip,
      moneyHealthDefaults.currentMonthlySip,
    ),
    monthlyEmis: parseNumber(draft.monthlyEmis, moneyHealthDefaults.monthlyEmis),
    highInterestDebt: parseNumber(
      draft.highInterestDebt,
      moneyHealthDefaults.highInterestDebt,
    ),
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

function getFieldState(
  validation: MoneyHealthValidation,
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

function getScoreTone(score: number) {
  if (score >= 80) {
    return "good";
  }
  if (score >= 60) {
    return "watch";
  }
  return "alert";
}

export function MoneyHealthScorePage({
  onGoHome,
}: {
  onGoHome: () => void;
}) {
  const [draftInputs, setDraftInputs] = useState<MoneyHealthDraftInputs>(() =>
    buildDraftFromInputs(moneyHealthDefaults),
  );
  const [submittedInputs, setSubmittedInputs] =
    useState<MoneyHealthInputs | null>(null);
  const [guidance, setGuidance] = useState<MoneyHealthGuidanceResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const requestIdRef = useRef(0);

  const parsedInputs = useMemo(() => parseDraftInputs(draftInputs), [draftInputs]);
  const validation = useMemo(
    () => validateMoneyHealthInputs(parsedInputs),
    [parsedInputs],
  );
  const plan = useMemo(
    () => (submittedInputs ? computeMoneyHealthPlan(submittedInputs) : null),
    [submittedInputs],
  );
  const shouldShowValidation = formAttempted;
  const isFormMode = !submittedInputs || isEditing;

  const setFieldValue = (key: keyof MoneyHealthDraftInputs, value: string) => {
    setDraftInputs((current) => ({ ...current, [key]: value }));
  };

  const handleUseDefaults = () => {
    setDraftInputs(buildDraftFromInputs(moneyHealthDefaults));
  };

  const handleGenerate = async () => {
    setFormAttempted(true);
    if (validation.errors.length > 0) {
      return;
    }

    const nextInputs = parsedInputs;
    const nextPlan = computeMoneyHealthPlan(nextInputs);
    const requestId = ++requestIdRef.current;
    setSubmittedInputs(nextInputs);
    setIsEditing(false);
    setIsGenerating(true);

    try {
      const result = await generateMoneyHealthGuidance(nextInputs, nextPlan);
      if (requestId === requestIdRef.current) {
        setGuidance(result);
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
            <span className="brand-text">MoneyMentor</span>
          </button>

          <div className="planner-nav-actions">
            <span className="planner-tag">Money Health Score</span>
            <button className="ghost-link" type="button" onClick={onGoHome}>
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="container health-page-shell">
        {isFormMode ? (
          <section className="health-intake-shell">
            <aside className="health-sidebar-card">
              <span className="eyebrow">
                {submittedInputs ? "Refresh your score" : "5-minute onboarding"}
              </span>
              <h1>Money health score</h1>
              <p>
                Answer a few practical questions and get one clear wellness score
                across emergency readiness, protection, investments, debt, tax,
                and retirement.
              </p>

              <div className="health-sidebar-points">
                <div className="health-sidebar-pill">6 dimensions</div>
                <div className="health-sidebar-pill">AI coach summary</div>
                <div className="health-sidebar-pill">Top actions in priority order</div>
              </div>

              <div className="fire-sidebar-actions">
                <button className="soft-button" type="button" onClick={handleUseDefaults}>
                  Use sample profile
                </button>
                {submittedInputs ? (
                  <button
                    className="ghost-link"
                    type="button"
                    onClick={() => setIsEditing(false)}
                  >
                    Back to score
                  </button>
                ) : null}
                <button
                  className="button button-primary planner-button"
                  type="button"
                  onClick={handleGenerate}
                >
                  {submittedInputs ? "Refresh score" : "Generate score"}
                </button>
              </div>
            </aside>

            <section className="health-form-card">
              <div className="fire-section-head">
                <span className="eyebrow">Intake form</span>
                <h3>Tell us where your money stands right now</h3>
              </div>

              <div className="health-form-sections">
                <HealthFormSection title="You and your household">
                  <div className="health-field-grid">
                    <HealthNumericField
                      label="Current age"
                      value={draftInputs.age}
                      placeholder="34"
                      onChange={(value) => setFieldValue("age", value)}
                      {...getFieldState(validation, "age", shouldShowValidation)}
                    />
                    <HealthNumericField
                      label="Retirement target age"
                      value={draftInputs.targetRetirementAge}
                      placeholder="50"
                      helper={`${Math.max(
                        parseNumber(draftInputs.targetRetirementAge, 0) -
                          parseNumber(draftInputs.age, 0),
                        0,
                      )} years away`}
                      onChange={(value) => setFieldValue("targetRetirementAge", value)}
                      {...getFieldState(
                        validation,
                        "targetRetirementAge",
                        shouldShowValidation,
                      )}
                    />
                    <HealthNumericField
                      label="Annual income"
                      value={draftInputs.annualIncome}
                      placeholder="2400000"
                      preview={formatRupeePreview(draftInputs.annualIncome)}
                      onChange={(value) => setFieldValue("annualIncome", value)}
                      {...getFieldState(validation, "annualIncome", shouldShowValidation)}
                    />
                    <HealthNumericField
                      label="Monthly expenses"
                      value={draftInputs.monthlyExpenses}
                      placeholder="95000"
                      preview={formatRupeePreview(draftInputs.monthlyExpenses)}
                      onChange={(value) => setFieldValue("monthlyExpenses", value)}
                      {...getFieldState(validation, "monthlyExpenses", shouldShowValidation)}
                    />
                    <HealthNumericField
                      label="Dependents"
                      value={draftInputs.dependents}
                      placeholder="2"
                      helper="Spouse, children, or parents who depend on your income"
                      onChange={(value) => setFieldValue("dependents", value)}
                    />
                  </div>
                </HealthFormSection>

                <HealthFormSection title="Safety net and protection">
                  <div className="health-field-grid">
                    <HealthNumericField
                      label="Liquid savings"
                      value={draftInputs.liquidSavings}
                      placeholder="300000"
                      preview={formatRupeePreview(draftInputs.liquidSavings)}
                      helper="Savings, FD, or liquid fund you can access quickly"
                      onChange={(value) => setFieldValue("liquidSavings", value)}
                    />
                    <HealthNumericField
                      label="Life cover"
                      value={draftInputs.currentLifeCover}
                      placeholder="5000000"
                      preview={formatRupeePreview(draftInputs.currentLifeCover)}
                      onChange={(value) => setFieldValue("currentLifeCover", value)}
                      {...getFieldState(
                        validation,
                        "currentLifeCover",
                        shouldShowValidation,
                      )}
                    />
                    <HealthNumericField
                      label="Health insurance cover"
                      value={draftInputs.healthInsuranceCover}
                      placeholder="500000"
                      preview={formatRupeePreview(draftInputs.healthInsuranceCover)}
                      onChange={(value) => setFieldValue("healthInsuranceCover", value)}
                      {...getFieldState(
                        validation,
                        "healthInsuranceCover",
                        shouldShowValidation,
                      )}
                    />
                    <HealthNumericField
                      label="Annual health premium"
                      value={draftInputs.annualHealthInsurancePremium}
                      placeholder="18000"
                      preview={formatRupeePreview(draftInputs.annualHealthInsurancePremium)}
                      onChange={(value) =>
                        setFieldValue("annualHealthInsurancePremium", value)
                      }
                    />
                  </div>
                </HealthFormSection>

                <HealthFormSection title="Investing and retirement">
                  <div className="health-field-grid">
                    <HealthNumericField
                      label="Equity investments"
                      value={draftInputs.equityInvestments}
                      placeholder="1800000"
                      preview={formatRupeePreview(draftInputs.equityInvestments)}
                      onChange={(value) => setFieldValue("equityInvestments", value)}
                      {...getFieldState(
                        validation,
                        "equityInvestments",
                        shouldShowValidation,
                      )}
                    />
                    <HealthNumericField
                      label="Debt investments"
                      value={draftInputs.debtInvestments}
                      placeholder="300000"
                      preview={formatRupeePreview(draftInputs.debtInvestments)}
                      onChange={(value) => setFieldValue("debtInvestments", value)}
                    />
                    <HealthNumericField
                      label="Retirement investments"
                      value={draftInputs.retirementInvestments}
                      placeholder="600000"
                      preview={formatRupeePreview(draftInputs.retirementInvestments)}
                      helper="PPF, EPF, NPS, or other retirement-only corpus"
                      onChange={(value) => setFieldValue("retirementInvestments", value)}
                    />
                    <HealthNumericField
                      label="Current monthly SIP"
                      value={draftInputs.currentMonthlySip}
                      placeholder="45000"
                      preview={formatRupeePreview(draftInputs.currentMonthlySip)}
                      onChange={(value) => setFieldValue("currentMonthlySip", value)}
                    />
                  </div>
                </HealthFormSection>

                <HealthFormSection title="Debt and tax hygiene">
                  <div className="health-field-grid">
                    <HealthNumericField
                      label="Monthly EMIs"
                      value={draftInputs.monthlyEmis}
                      placeholder="18000"
                      preview={formatRupeePreview(draftInputs.monthlyEmis)}
                      onChange={(value) => setFieldValue("monthlyEmis", value)}
                      {...getFieldState(validation, "monthlyEmis", shouldShowValidation)}
                    />
                    <HealthNumericField
                      label="High-interest debt"
                      value={draftInputs.highInterestDebt}
                      placeholder="0"
                      preview={formatRupeePreview(draftInputs.highInterestDebt)}
                      helper="Credit card, personal loan, or any debt above about 12%"
                      onChange={(value) => setFieldValue("highInterestDebt", value)}
                    />
                    <HealthNumericField
                      label="Outstanding liabilities"
                      value={draftInputs.liabilities}
                      placeholder="2000000"
                      preview={formatRupeePreview(draftInputs.liabilities)}
                      onChange={(value) => setFieldValue("liabilities", value)}
                    />
                    <HealthNumericField
                      label="Tax-saving investments used"
                      value={draftInputs.annualTaxSavingInvestments}
                      placeholder="120000"
                      preview={formatRupeePreview(draftInputs.annualTaxSavingInvestments)}
                      helper="80C-style investments already used this year"
                      onChange={(value) =>
                        setFieldValue("annualTaxSavingInvestments", value)
                      }
                    />
                  </div>
                </HealthFormSection>
              </div>
            </section>
          </section>
        ) : isGenerating || !plan ? (
          <section className="fire-generating-shell">
            <div className="fire-generating-card">
              <div className="fire-generating-spinner" />
              <span className="eyebrow">Scoring in progress</span>
              <h2>Building your money health score</h2>
              <p>
                We are scoring all 6 dimensions, ranking the biggest gaps, and
                preparing an AI coach summary with the most practical next steps.
              </p>
            </div>
          </section>
        ) : (
          <section className="health-results-shell">
            <div className="health-results-top">
              <div className="health-results-copy">
                <span className="eyebrow">Money health</span>
                <h1>Your financial wellness at a glance</h1>
                <p>
                  {guidance?.coachLine ?? plan.biggestOpportunity}
                </p>
              </div>

              <div className="health-results-actions">
                <button className="soft-button" type="button" onClick={() => setIsEditing(true)}>
                  Edit inputs
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => {
                    handleUseDefaults();
                    setIsEditing(true);
                  }}
                >
                  Load sample
                </button>
              </div>
            </div>

            <section className="health-score-hero">
              <div className="health-score-ring-wrap">
                <ScoreRing score={plan.overallScore} />
                <div className="health-score-meta">
                  <strong>{plan.grade}</strong>
                  <p>{plan.biggestOpportunity}</p>
                </div>
              </div>

              <div className="health-ai-card">
                <span className="eyebrow">AI coach</span>
                <h3>What to fix first</h3>
                <div className="health-coach-list">
                  {(guidance?.priorities ?? plan.actions.map((action) => action.title)).map(
                    (item) => (
                      <div key={item} className="health-coach-item">
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </section>

            <section className="health-dimension-grid">
              {plan.dimensions.map((dimension) => (
                <DimensionCard key={dimension.id} dimension={dimension} />
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
                  <MetricChip
                    label="Emergency target"
                    value={inr(plan.metrics.emergencyTarget)}
                    helper={`${plan.metrics.emergencyMonths.toFixed(1)} months saved`}
                  />
                  <MetricChip
                    label="Life cover target"
                    value={inr(plan.metrics.lifeCoverTarget)}
                    helper={`Current ${inr(parsedInputs.currentLifeCover)}`}
                  />
                  <MetricChip
                    label="Retirement corpus target"
                    value={compactInr(plan.metrics.retirementTargetCorpus)}
                    helper={`Current path age ${plan.metrics.retirementCurrentPathAge}`}
                  />
                  <MetricChip
                    label="Required SIP"
                    value={inr(plan.metrics.retirementRequiredSip)}
                    helper={`Current SIP ${inr(parsedInputs.currentMonthlySip)}`}
                  />
                </div>
              </div>

              <div className="health-rationale-card">
                <div className="fire-section-head">
                  <span className="eyebrow">Why this score</span>
                  <h3>Reasoning highlights</h3>
                </div>
                <div className="health-rationale-list">
                  {(guidance?.rationale ??
                    plan.dimensions.slice(0, 3).map((dimension) => dimension.detail)).map(
                    (item) => (
                      <p key={item}>{item}</p>
                    ),
                  )}
                </div>
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

function HealthFormSection({
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

function HealthNumericField({
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
        {!error && warning ? (
          <span className="field-message warning">{warning}</span>
        ) : null}
        {!error && !warning && helper ? (
          <span className="health-input-helper">{helper}</span>
        ) : null}
        {!error && !warning && preview ? (
          <span className="health-input-preview">{preview}</span>
        ) : null}
        {!error && !warning && !helper && !preview ? (
          <span className="health-input-placeholder">.</span>
        ) : null}
      </div>
    </label>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 84;
  const stroke = 16;
  const size = radius * 2 + stroke * 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const tone = getScoreTone(score);

  return (
    <div className={`health-score-ring ${tone}`}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="health-score-ring-track"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="health-score-ring-progress"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="health-score-ring-center">
        <strong>{score}</strong>
        <span>Health score</span>
      </div>
    </div>
  );
}

function DimensionCard({ dimension }: { dimension: MoneyHealthDimension }) {
  return (
    <article className={`health-dimension-card ${dimension.tone}`}>
      <div className="health-dimension-head">
        <strong>{dimension.label}</strong>
        <span>{dimension.score}/100</span>
      </div>
      <div className="health-dimension-bar">
        <div
          className="health-dimension-fill"
          style={{ width: `${Math.max(dimension.score, 6)}%` }}
        />
      </div>
      <p>{dimension.summary}</p>
      <small>{dimension.detail}</small>
    </article>
  );
}

function MetricChip({
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
