import { useEffect, useId, useMemo, useState } from "react";
import { generateFireGuidance, type FireGuidanceResult } from "./ai";
import { fireDefaults } from "./data";
import {
  compactInr,
  computeFirePlan,
  inr,
  validateFireInputs,
  type FireInputs,
} from "./finance";

type Page = "home" | "fire";
type ResultView = "insights" | "roadmap" | "execution" | "scenarios" | "inputs";
type FireField =
  | "age"
  | "retirementAge"
  | "annualIncome"
  | "monthlyExpenses"
  | "currentMfCorpus"
  | "currentPpfCorpus"
  | "targetMonthlyDrawToday"
  | "currentMonthlySip"
  | "currentLifeCover"
  | "liabilities"
  | "inflationRate"
  | "preRetirementReturn";

type FireDraftInputs = Record<FireField, string>;

const tools = [
  {
    title: "FIRE Path Planner",
    description:
      "Build a month-by-month roadmap to financial independence with contribution targets, glidepaths, and retirement timing.",
    accent: "blue",
  },
  {
    title: "Money Health Score",
    description:
      "Get a fast financial wellness check across emergency readiness, debt health, insurance, tax efficiency, and retirement.",
    accent: "green",
  },
  {
    title: "Tax Wizard",
    description:
      "Compare old vs new regime, surface missed deductions, and see step-by-step logic before acting.",
    accent: "orange",
  },
  {
    title: "MF Portfolio X-Ray",
    description:
      "Measure overlap, expense drag, and true performance, then get a cleaner rebalance plan with tax context.",
    accent: "pink",
  },
  {
    title: "Life Event Advisor",
    description:
      "Handle bonuses, marriage, relocation, inheritance, and other turning points with guided financial decisions.",
    accent: "violet",
  },
  {
    title: "Couple's Money Planner",
    description:
      "Plan goals jointly, optimize tax decisions across both incomes, and bring shared financial visibility into one flow.",
    accent: "rose",
  },
];

const stats = [
  { value: "95%", label: "Indians without a financial plan" },
  { value: "₹25K+", label: "Typical annual advisor cost" },
  { value: "6", label: "Core planning dimensions covered" },
  { value: "24/7", label: "AI guidance whenever needed" },
];

const reasonsForUsers = [
  "No high advisor fee barrier for first-time planners",
  "Personalized plans that adapt as inputs change",
  "Step-by-step calculations you can verify and understand",
];

const reasonsForTrust = [
  "Clear guidance flows for tax, FIRE, and portfolio decisions",
  "Compliance-first framing with explicit advisory disclaimer",
  "Built for actionable planning, not generic finance content",
];

const fireFieldConfig: Array<{
  key: FireField;
  label: string;
  min: number;
  max: number;
  step: number;
  percent?: boolean;
  placeholder: string;
  help?: string;
}> = [
  { key: "age", label: "Current age", min: 18, max: 70, step: 1, placeholder: "34" },
  { key: "retirementAge", label: "Retirement age", min: 30, max: 75, step: 1, placeholder: "50" },
  { key: "annualIncome", label: "Annual income", min: 300000, max: 10000000, step: 50000, placeholder: "2400000" },
  { key: "monthlyExpenses", label: "Monthly expenses", min: 10000, max: 500000, step: 5000, placeholder: "95000" },
  { key: "currentMfCorpus", label: "Existing MF corpus", min: 0, max: 50000000, step: 100000, placeholder: "1800000" },
  { key: "currentPpfCorpus", label: "Existing PPF", min: 0, max: 15000000, step: 50000, placeholder: "600000" },
  { key: "targetMonthlyDrawToday", label: "Target monthly spend after retirement", min: 25000, max: 1000000, step: 5000, placeholder: "150000", help: "Use today's rupees, not future inflated value." },
  { key: "currentMonthlySip", label: "Current monthly SIP", min: 0, max: 500000, step: 5000, placeholder: "45000" },
  { key: "currentLifeCover", label: "Current life cover", min: 0, max: 100000000, step: 500000, placeholder: "5000000", help: "Enter only pure term insurance cover, not investment-linked plans." },
  { key: "liabilities", label: "Outstanding liabilities", min: 0, max: 50000000, step: 100000, placeholder: "2000000", help: "Home loan, personal loan, education loan, and any other major debt." },
  { key: "inflationRate", label: "Inflation assumption", min: 3, max: 12, step: 0.1, percent: true, placeholder: "6", help: "How much your retirement lifestyle cost may rise each year." },
  { key: "preRetirementReturn", label: "Expected return", min: 5, max: 18, step: 0.1, percent: true, placeholder: "12", help: "Expected annual return before retirement, not guaranteed return." },
];

export default function App() {
  const [page, setPage] = useState<Page>(() =>
    window.location.hash === "#fire-planner" ? "fire" : "home",
  );

  useEffect(() => {
    const handleHashChange = () => {
      setPage(window.location.hash === "#fire-planner" ? "fire" : "home");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (nextPage: Page) => {
    window.location.hash = nextPage === "fire" ? "fire-planner" : "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(nextPage);
  };

  return page === "home" ? (
    <LandingPage onOpenFirePlanner={() => navigate("fire")} />
  ) : (
    <FirePlannerPage onGoHome={() => navigate("home")} />
  );
}

function LandingPage({ onOpenFirePlanner }: { onOpenFirePlanner: () => void }) {
  return (
    <div className="page">
      <header className="site-header">
        <div className="container nav">
          <button className="brand brand-button" type="button" onClick={onOpenFirePlanner}>
            <span className="brand-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.2 2 6.8 13h4.5l-1.1 9L17.2 11h-4.4L13.2 2Z" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-text">MoneyMentor</span>
          </button>

          <nav className="nav-links" aria-label="Primary">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#why">Solutions</a>
            <a href="#cta">Pricing</a>
          </nav>

          <button className="nav-cta" type="button" onClick={onOpenFirePlanner}>
            Get Started
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="container hero">
            <div className="hero-copy">
              <span className="eyebrow">AI-powered personal finance for India</span>
              <h1>
                Your Personal AI <span className="gradient-text">Finance Mentor</span>
              </h1>
              <p className="hero-description">
                95% of Indians lack a financial plan. Turn confusion into confidence with
                AI-powered financial guidance designed to feel as simple as a chat, but
                rigorous enough to support real decisions.
              </p>
              <div className="hero-actions">
                <button className="button button-primary" type="button" onClick={onOpenFirePlanner}>
                  Start Your FIRE Plan
                </button>
                <a className="button button-secondary" href="#why">
                  Check Money Health Score
                </a>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-card hero-card-main">
                <p>Live financial cockpit</p>
                <strong>Agentic plans that adapt to your goals</strong>
                <div className="mini-bars">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="hero-card hero-card-float">
                <span>Retirement target</span>
                <strong>On track by 55</strong>
              </div>
              <div className="hero-orb hero-orb-a" />
              <div className="hero-orb hero-orb-b" />
            </div>
          </div>

          <div className="container stats-panel">
            {stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="info-section" id="why">
          <div className="container section-intro">
            <span className="eyebrow">Why MoneyMentor</span>
            <h2>Financial planning should not be reserved for HNIs.</h2>
            <p>
              Traditional advisory is expensive and often inaccessible. MoneyMentor brings
              structured, personalized financial guidance into a product that feels
              approachable while still respecting compliance boundaries.
            </p>
          </div>

          <div className="container reason-grid">
            <article className="reason-card">
              <h3>For You</h3>
              <ul>
                {reasonsForUsers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="reason-card">
              <h3>Our Approach</h3>
              <ul>
                {reasonsForTrust.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="tools-section" id="features">
          <div className="container section-intro compact">
            <span className="eyebrow">Core tools</span>
            <h2>6 powerful workflows in one financial mentor.</h2>
          </div>

          <div className="container tools-grid">
            {tools.map((tool) => (
              <article key={tool.title} className="tool-card">
                <div className={`tool-icon ${tool.accent}`}>
                  <span />
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <button className="inline-link" type="button" onClick={onOpenFirePlanner}>
                  Try Now
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section" id="cta">
          <div className="container cta-card">
            <h2>Ready to take control of your finances?</h2>
            <p>
              Get your personalized FIRE plan, tax optimization guidance, and financial
              health score in minutes.
            </p>
            <button className="button button-light" type="button" onClick={onOpenFirePlanner}>
              Start Free Analysis
            </button>
          </div>

          <div className="container disclaimer">
            <p>
              <strong>Disclaimer:</strong> MoneyMentor provides AI-powered financial guidance
              for educational purposes only. It is not licensed financial advice. Please
              consult a SEBI-registered financial advisor before making investment decisions.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function FirePlannerPage({ onGoHome }: { onGoHome: () => void }) {
  const [inputs, setInputs] = useState<FireInputs>(fireDefaults);
  const [draftInputs, setDraftInputs] = useState<FireDraftInputs>(() => buildEmptyDraftInputs());
  const [originalSubmittedInputs, setOriginalSubmittedInputs] = useState<FireInputs | null>(null);
  const [aiGuidance, setAiGuidance] = useState<FireGuidanceResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formAttempted, setFormAttempted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isEditingInputs, setIsEditingInputs] = useState(false);
  const [resultView, setResultView] = useState<ResultView>("insights");

  const plan = useMemo(() => computeFirePlan(inputs), [inputs]);
  const validation = useMemo(() => validateFireInputs(inputs), [inputs]);
  const draftParsedInputs = useMemo(() => parseDraftInputs(draftInputs), [draftInputs]);
  const draftValidation = useMemo(() => validateFireInputs(draftParsedInputs), [draftParsedInputs]);
  const activeValidation = hasSubmitted && !isEditingInputs ? validation : draftValidation;
  const shouldShowFieldValidation =
    (!hasSubmitted && formAttempted) || isEditingInputs || hasSubmitted;
  const monthlyIncome = inputs.annualIncome / 12;
  const monthlySurplus = Math.max(monthlyIncome - inputs.monthlyExpenses, 0);
  const currentCorpus = inputs.currentMfCorpus + inputs.currentPpfCorpus;
  const corpusGap = Math.max(plan.targetCorpus - plan.projectedCorpusWithoutChanges, 0);
  const laterInputs = useMemo(
    () => ({ ...inputs, retirementAge: Math.min(inputs.retirementAge + 5, 75) }),
    [inputs],
  );
  const laterPlan = useMemo(() => computeFirePlan(laterInputs), [laterInputs]);
  const leanerInputs = useMemo(
    () => ({
      ...inputs,
      targetMonthlyDrawToday: Math.max(Math.round(inputs.targetMonthlyDrawToday * 0.9), 25_000),
    }),
    [inputs],
  );
  const leanerPlan = useMemo(() => computeFirePlan(leanerInputs), [leanerInputs]);

  const sipMix = useMemo(() => {
    const equityWeight = plan.monthByMonth[0]?.equityWeight ?? 70;
    const debtWeight = 100 - equityWeight;
    const totalSip = plan.requiredSip;
    const equitySip = totalSip * (equityWeight / 100);
    const debtSip = totalSip * (debtWeight / 100);

    return [
      { label: "Large cap equity", amount: equitySip * 0.42, tone: "purple" },
      { label: "Mid cap equity", amount: equitySip * 0.3, tone: "purple" },
      { label: "Small cap equity", amount: equitySip * 0.18, tone: "purple" },
      { label: "Debt / liquid", amount: debtSip * 0.7, tone: "slate" },
      { label: "PPF annualized", amount: debtSip * 0.3, tone: "slate" },
    ];
  }, [plan]);

  useEffect(() => {
    if (hasSubmitted) {
      setAiGuidance(null);
    }
  }, [inputs, hasSubmitted]);

  const generatePlan = async () => {
    if (validation.errors.length) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateFireGuidance(inputs, plan);
      setAiGuidance(result);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPlanSnapshot = async (
    nextInputs: FireInputs,
    options?: {
      captureAsOriginal?: boolean;
      scrollToTop?: boolean;
      keepEditingOpen?: boolean;
      nextView?: ResultView;
    },
  ) => {
    setInputs(nextInputs);
    setDraftInputs(buildDraftFromInputs(nextInputs));
    setHasSubmitted(true);
    setIsEditingInputs(options?.keepEditingOpen ?? false);
    if (options?.nextView) {
      setResultView(options.nextView);
    }

    if (options?.captureAsOriginal && originalSubmittedInputs === null) {
      setOriginalSubmittedInputs(nextInputs);
    }

    setIsGenerating(true);
    try {
      const computedPlan = computeFirePlan(nextInputs);
      const result = await generateFireGuidance(nextInputs, computedPlan);
      setAiGuidance(result);

      if (options?.scrollToTop) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInitialSubmit = async () => {
    setFormAttempted(true);
    if (draftValidation.errors.length) {
      setInputs(draftParsedInputs);
      return;
    }

    await applyPlanSnapshot(draftParsedInputs, {
      captureAsOriginal: originalSubmittedInputs === null,
      scrollToTop: true,
      keepEditingOpen: false,
      nextView: "insights",
    });
  };

  const handleResetToOriginal = async () => {
    if (!originalSubmittedInputs) {
      return;
    }

    await applyPlanSnapshot(originalSubmittedInputs, {
      keepEditingOpen: isEditingInputs,
    });
  };

  const strategyCards = [
    {
      title: "Emergency fund target",
      value: inr(plan.emergencyFundTarget),
      detail: `Build this before stretching further on risk. Current gap: ${inr(plan.emergencyFundGap)}.`,
      tone: "amber",
    },
    {
      title: "Insurance gap",
      value: inr(plan.lifeCoverGap),
      detail: `Recommended cover is ${inr(plan.lifeCoverTarget)} based on expenses and liabilities.`,
      tone: "rose",
    },
    {
      title: "Tax-saving move",
      value: "Use 80C + NPS",
      detail: "Route part of the debt allocation to PPF / EPF / ELSS and keep NPS as an optional long-term retirement bucket.",
      tone: "green",
    },
  ] as const;

  const monthlyPlan = plan.monthByMonth.slice(0, 12).map((row) => ({
    month: row.month,
    focus:
      row.month <= 3
        ? "Stabilize reserve and insurance"
        : row.month <= 6
          ? "Build SIP discipline"
          : row.month <= 9
            ? "Review allocation and rebalance"
            : "Lock annual review and tax proofing",
    equitySip: row.equitySip,
    debtSip: row.debtSip,
    corpus: row.projectedCorpus,
  }));

  const roadmapPhases = [
    {
      title: "Month 1 to 3",
      detail: "Protect the basics",
      description:
        "Close the emergency fund and insurance gap before stretching into more aggressive investing.",
    },
    {
      title: "Month 4 to 6",
      detail: "Lock the monthly habit",
      description: `Move toward a monthly SIP of ${inr(plan.requiredSip)} and keep the split disciplined across equity and debt.`,
    },
    {
      title: "Month 7 to 12",
      detail: "Review and rebalance",
      description:
        "Check whether income, expenses, and target age have changed, then refresh the plan instead of guessing.",
    },
  ];

  const resultTabs: Array<{ id: ResultView; label: string; helper: string }> = [
    { id: "insights", label: "Insights", helper: "What the plan says" },
    { id: "roadmap", label: "Roadmap", helper: "Actions and tradeoffs" },
    { id: "execution", label: "Execution", helper: "How to invest and rebalance" },
    { id: "inputs", label: "Inputs", helper: "Review or edit your numbers" },
  ];

  const planSuggestions = [
    {
      title: "Raise monthly investing",
      value:
        plan.requiredSip > inputs.currentMonthlySip
          ? `Add ${inr(plan.requiredSip - inputs.currentMonthlySip)}/mo`
          : "Already on target",
      detail:
        plan.requiredSip > inputs.currentMonthlySip
          ? `You currently invest ${inr(inputs.currentMonthlySip)} per month. The plan needs about ${inr(plan.requiredSip)}.`
          : "Your current SIP already matches or exceeds the estimated monthly requirement.",
      tone: plan.requiredSip > inputs.currentMonthlySip ? "rose" : "green",
    },
    {
      title: "Retire a little later",
      value: `${Math.max(0, Math.round(((plan.requiredSip - laterPlan.requiredSip) / Math.max(plan.requiredSip, 1)) * 100))}% lower SIP`,
      detail: `Moving the target from age ${inputs.retirementAge} to ${laterInputs.retirementAge} lowers the required SIP to about ${inr(laterPlan.requiredSip)}.`,
      tone: "green",
    },
    {
      title: "Trim retirement lifestyle target",
      value: inr(leanerPlan.requiredSip),
      detail: `If retirement spending is reduced by 10%, the required SIP falls from ${inr(plan.requiredSip)} to about ${inr(leanerPlan.requiredSip)}.`,
      tone: "amber",
    },
  ] as const;

  const planHeadline =
    plan.requiredSip > inputs.currentMonthlySip
      ? `Raise your SIP by ${inr(plan.requiredSip - inputs.currentMonthlySip)} to stay on track for age ${inputs.retirementAge}.`
      : `Your current investing pace is aligned with retiring around age ${inputs.retirementAge}.`;

  const handleDownloadPlan = () => {
    const lines = [
      "MoneyMentor FIRE Plan",
      "",
      "Profile",
      `- Current age: ${inputs.age}`,
      `- Target retirement age: ${inputs.retirementAge}`,
      `- Annual income: ${inr(inputs.annualIncome)}`,
      `- Monthly expenses: ${inr(inputs.monthlyExpenses)}`,
      `- Current SIP: ${inr(inputs.currentMonthlySip)}`,
      `- Existing mutual fund corpus: ${inr(inputs.currentMfCorpus)}`,
      `- Existing PPF corpus: ${inr(inputs.currentPpfCorpus)}`,
      "",
      "Headline",
      `- ${planHeadline}`,
      "",
      "Key numbers",
      `- Monthly SIP needed: ${inr(plan.requiredSip)}`,
      `- Target corpus: ${compactInr(plan.targetCorpus)}`,
      `- Current-path retirement age: ${plan.estimatedRetirementAgeOnCurrentPath}`,
      `- Emergency fund target: ${inr(plan.emergencyFundTarget)}`,
      `- Insurance gap: ${inr(plan.lifeCoverGap)}`,
      "",
      "Improvement levers",
      ...planSuggestions.map((card) => `- ${card.title}: ${card.value}. ${card.detail}`),
      "",
      "Roadmap",
      ...roadmapPhases.map((phase) => `- ${phase.title}: ${phase.detail}. ${phase.description}`),
      "",
      "First 12 months",
      ...monthlyPlan.map(
        (row) =>
          `- Month ${row.month}: ${row.focus}. Equity ${inr(row.equitySip)}, Debt ${inr(row.debtSip)}, Projected corpus ${inr(row.corpus)}.`,
      ),
    ];

    if (aiGuidance) {
      lines.push(
        "",
        "AI insights",
        ...aiGuidance.sections.plan.map((item) => `- Plan: ${item}`),
        ...aiGuidance.sections.risks.map((item) => `- Risk: ${item}`),
        ...aiGuidance.sections.nextActions.map((item) => `- Action: ${item}`),
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fire-plan-age-${inputs.age}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            <span className="planner-tag">FIRE Planner</span>
            <button className="ghost-link" type="button" onClick={onGoHome}>
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="container planner-layout">
        <section className={`planner-hero ${hasSubmitted ? "compact" : "expanded"}`}>
          <div className="planner-hero-copy">
            <span className="eyebrow">FIRE planner</span>
            <h1>{hasSubmitted ? "Your FIRE plan is ready" : "Build your FIRE plan"}</h1>
            <p>
              {hasSubmitted
                ? "Review the plan, compare trade-offs, and export a copy when you’re ready."
                : "Enter your current income, savings, and retirement goal to get a practical roadmap."}
            </p>
          </div>

          {hasSubmitted ? (
            <div className="planner-hero-actions">
              <button className="soft-button" type="button" onClick={handleDownloadPlan}>
                Download plan
              </button>
              <button
                className="soft-button"
                type="button"
                onClick={handleResetToOriginal}
                disabled={!originalSubmittedInputs}
              >
                Reset
              </button>
              <button
                className="soft-button"
                type="button"
                onClick={() => {
                  setDraftInputs(buildDraftFromInputs(inputs));
                  setIsEditingInputs(true);
                  setResultView("inputs");
                }}
              >
                Edit inputs
              </button>
            </div>
          ) : (
            <div className="planner-hero-note">
              You’ll get a clear verdict, improvement levers, a cleaner roadmap, and an exportable plan.
            </div>
          )}
        </section>

        {!hasSubmitted ? (
          <section className="planner-intake-card">
            <div className="planner-panel-head">
              <div>
                <span className="eyebrow">Intake form</span>
                <h2>Tell us about your financial goals</h2>
              </div>
              <button className="soft-button" type="button" onClick={() => setDraftInputs(buildDraftFromInputs(fireDefaults))}>
                Use scenario defaults
              </button>
            </div>

            <div className="planner-form-section">
              <h3>Your details</h3>
              <div className="planner-intake-grid two-up">
                {renderFields(["age", "retirementAge"], draftInputs, setDraftInputs, activeValidation.fields, shouldShowFieldValidation)}
              </div>
            </div>

            <div className="planner-form-section">
              <h3>Income and expenses</h3>
              <div className="planner-intake-grid">
                {renderFields(["annualIncome", "monthlyExpenses", "currentMonthlySip"], draftInputs, setDraftInputs, activeValidation.fields, shouldShowFieldValidation)}
              </div>
            </div>

            <div className="planner-form-section">
              <h3>Current assets</h3>
              <div className="planner-intake-grid">
                {renderFields(["currentMfCorpus", "currentPpfCorpus"], draftInputs, setDraftInputs, activeValidation.fields, shouldShowFieldValidation)}
              </div>
            </div>

            <div className="planner-form-section">
              <h3>Retirement goal</h3>
              <div className="planner-intake-grid">
                {renderFields(["targetMonthlyDrawToday"], draftInputs, setDraftInputs, activeValidation.fields, shouldShowFieldValidation)}
              </div>
            </div>

            <button className="advanced-toggle" type="button" onClick={() => setShowAdvanced((current) => !current)}>
              {showAdvanced ? "Hide advanced settings" : "Advanced settings"}
            </button>

            {showAdvanced ? (
              <div className="planner-form-section advanced">
                <h3>Advanced settings</h3>
                <div className="planner-intake-grid">
                  {renderFields(["currentLifeCover", "liabilities", "preRetirementReturn", "inflationRate"], draftInputs, setDraftInputs, activeValidation.fields, shouldShowFieldValidation)}
                </div>
              </div>
            ) : null}

            <div className="planner-intake-actions">
              <div className="planner-intake-note">
                First generate your plan. After that, you can edit the inputs without starting over.
              </div>
              <button className="button button-primary planner-button" type="button" onClick={handleInitialSubmit}>
                Generate FIRE roadmap
              </button>
            </div>
          </section>
        ) : isGenerating ? (
          <section className="planner-loading-card">
            <div className="planner-loading-spinner" />
            <h2>Building your FIRE roadmap</h2>
            <p>
              Calculating your target corpus, SIP requirement, glidepath, insurance gap, and
              personalized AI explanation.
            </p>
          </section>
        ) : (
        <>
        <section className="planner-results-overview">
          <div className="planner-results-copy">
            <span className="eyebrow">Your FIRE overview</span>
            <h2>{planHeadline}</h2>
            <p>
              Current path reaches the goal closer to age {plan.estimatedRetirementAgeOnCurrentPath}.
              The corpus gap to close is {compactInr(corpusGap)}.
            </p>

            <div className="planner-results-metrics">
              <MetricSummaryCard label="Monthly SIP needed" value={inr(plan.requiredSip)} helper="per month" emphasis="primary" />
              <MetricSummaryCard label="Corpus needed" value={compactInr(plan.targetCorpus)} helper="at retirement" />
              <MetricSummaryCard label="Current path" value={`Age ${plan.estimatedRetirementAgeOnCurrentPath}`} helper="if nothing changes" emphasis="success" />
            </div>
          </div>

          <div className="planner-results-visual">
            <ProjectionChart target={plan.targetCorpus} current={plan.projectedCorpusWithoutChanges} yearsToRetire={plan.yearsToRetire} />
          </div>
        </section>

        <section className="planner-dashboard">
          <aside className="planner-result-sidebar">
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Plan summary</span>
                  <h2>Where you stand</h2>
                </div>
                <button
                  className="soft-button"
                  type="button"
                  onClick={() => {
                    setDraftInputs(buildDraftFromInputs(inputs));
                    setIsEditingInputs(true);
                    setResultView("inputs");
                  }}
                >
                  Edit inputs
                </button>
              </div>

              <div className="submitted-inputs-grid compact">
                <SnapshotTile label="Age" value={`${inputs.age} yrs`} />
                <SnapshotTile label="Retirement" value={`${inputs.retirementAge} yrs`} />
                <SnapshotTile label="Income" value={inr(inputs.annualIncome)} />
                <SnapshotTile label="Expenses" value={inr(inputs.monthlyExpenses)} />
              </div>
            </section>

            <section className="planner-kpi-stack">
              <MetricSummaryCard label="Monthly SIP needed" value={inr(plan.requiredSip)} helper="per month" emphasis="primary" />
              <MetricSummaryCard label="Corpus needed" value={compactInr(plan.targetCorpus)} helper="at retirement" />
              <MetricSummaryCard label="Years to FIRE" value={`${plan.yearsToRetire} yrs`} helper={`retire around age ${inputs.retirementAge}`} emphasis="success" />
            </section>

            <nav className="planner-section-nav" aria-label="Planner sections">
              {resultTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`planner-section-tab ${resultView === tab.id ? "active" : ""}`}
                  type="button"
                  onClick={() => setResultView(tab.id)}
                >
                  <strong>{tab.label}</strong>
                  <span>{tab.helper}</span>
                </button>
              ))}
            </nav>

            {resultView === "roadmap" ? (
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Summary</span>
                  <h2>Current snapshot</h2>
                </div>
              </div>

              <div className="snapshot-list">
                <SnapshotRow label="Monthly income" value={inr(monthlyIncome)} />
                <SnapshotRow label="Monthly expenses" value={inr(inputs.monthlyExpenses)} />
                <SnapshotRow label="Visible monthly surplus" value={inr(monthlySurplus)} />
                <SnapshotRow label="Existing investable corpus" value={inr(currentCorpus)} />
              </div>
            </section>
            ) : null}

            {resultView === "roadmap" ? (
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Insurance gap</span>
                  <h2>Protection first</h2>
                </div>
              </div>

              <div className="gap-stack">
                <GapCard
                  tone={plan.lifeCoverGap > 0 ? "critical" : "safe"}
                  title="Term life cover"
                  status={plan.lifeCoverGap > 0 ? "Critical gap" : "Covered"}
                  detail={`Need ${inr(plan.lifeCoverTarget)} · Have ${inr(inputs.currentLifeCover)}`}
                />
                <GapCard
                  tone={plan.emergencyFundGap > 0 ? "partial" : "safe"}
                  title="Emergency fund"
                  status={plan.emergencyFundGap > 0 ? "Partial" : "Ready"}
                  detail={`Need ${inr(plan.emergencyFundTarget)} · Gap ${inr(plan.emergencyFundGap)}`}
                />
              </div>
            </section>
            ) : null}
          </aside>

          <div className="planner-main-column">
            <nav className="planner-top-tabs" aria-label="Planner tabs">
              {resultTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`planner-top-tab ${resultView === tab.id ? "active" : ""}`}
                  type="button"
                  onClick={() => setResultView(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {resultView === "execution" ? (
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Overview</span>
                  <h2>Your FIRE path at a glance</h2>
                </div>
              </div>

              <ProjectionChart target={plan.targetCorpus} current={plan.projectedCorpusWithoutChanges} yearsToRetire={plan.yearsToRetire} />

              <div className="trajectory-summary">
                <TrajectoryStat label="Target corpus" value={compactInr(plan.targetCorpus)} tone="purple" />
                <TrajectoryStat label="Gap to close" value={compactInr(corpusGap)} tone="neutral" />
                <TrajectoryStat label="Current path corpus" value={compactInr(plan.projectedCorpusWithoutChanges)} tone="amber" />
              </div>
            </section>
            ) : null}

            {resultView === "insights" ? (
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Insights</span>
                  <h2>What your plan says</h2>
                </div>
                <button className="soft-button" type="button" onClick={generatePlan}>
                  Refresh
                </button>
              </div>

              <div className="ai-analysis-card">
                {aiGuidance ? (
                  <div className="ai-sections-grid">
                    <AiSectionCard title="Plan" items={aiGuidance.sections.plan} tone="blue" />
                    <AiSectionCard title="Risks" items={aiGuidance.sections.risks} tone="amber" />
                    <AiSectionCard title="Next actions" items={aiGuidance.sections.nextActions} tone="green" />
                    <div className="ai-disclaimer-box">
                      <strong>Guidance only</strong>
                      <p>{aiGuidance.sections.disclaimer}</p>
                    </div>
                  </div>
                ) : (
                  <div className="ai-empty-state">
                    <strong>Insights unavailable right now</strong>
                    <p>Please refresh the plan.</p>
                  </div>
                )}
              </div>
            </section>
            ) : null}

            {resultView === "insights" ? (
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Best ways to improve this plan</span>
                  <h2>Clear levers you can use</h2>
                </div>
              </div>

              <div className="strategy-grid">
                {planSuggestions.map((card) => (
                  <StrategyCard key={card.title} {...card} />
                ))}
              </div>

              <div className="strategy-grid secondary">
                {strategyCards.map((card) => (
                  <StrategyCard key={card.title} {...card} />
                ))}
              </div>
            </section>
            ) : null}

            {resultView === "execution" ? (
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Execution</span>
                  <h2>Suggested monthly allocation</h2>
                </div>
              </div>

              <div className="sip-breakdown">
                {sipMix.map((item) => (
                  <AllocationRow
                    key={item.label}
                    label={item.label}
                    amount={item.amount}
                    total={plan.requiredSip}
                    tone={item.tone}
                  />
                ))}
              </div>

              <div className="sip-total">
                <strong>Total monthly SIP</strong>
                <span>{inr(plan.requiredSip)}</span>
              </div>
              <p className="planner-footnote">
                {Math.round(plan.monthByMonth[0]?.equityWeight ?? 0)}% equity and{" "}
                {Math.round(plan.monthByMonth[0]?.debtWeight ?? 0)}% debt based on the current glidepath.
              </p>
              <div className="glidepath-inline-head">
                <span className="eyebrow">Allocation path</span>
                <h3>How the mix shifts over time</h3>
              </div>
              <div className="glidepath-list compact">
                {buildGlidepathRows(inputs.age, inputs.retirementAge).map((row) => (
                  <GlidepathRow key={row.ageLabel} row={row} />
                ))}
              </div>
            </section>
            ) : null}

            {resultView === "roadmap" ? (
            <section className="planner-panel planner-split-panel">
              <div>
                <div className="planner-panel-head">
                  <div>
                    <span className="eyebrow">Scenarios</span>
                    <h2>Ways to ease the plan</h2>
                  </div>
                </div>

                <div className="scenario-cards">
                  <ScenarioCard
                    label="Current plan"
                    title={`Retire at ${inputs.retirementAge}`}
                    sip={plan.requiredSip}
                    corpus={plan.targetCorpus}
                    surplus={monthlySurplus}
                    active
                  />
                  <ScenarioCard
                    label="Retire 5 yrs later"
                    title={`Retire at ${laterInputs.retirementAge}`}
                    sip={laterPlan.requiredSip}
                    corpus={laterPlan.targetCorpus}
                    surplus={monthlySurplus}
                  />
                </div>
                <p className="planner-footnote">
                  Retiring 5 years later reduces your SIP burden by{" "}
                  {Math.max(
                    0,
                    Math.round(((plan.requiredSip - laterPlan.requiredSip) / Math.max(plan.requiredSip, 1)) * 100),
                  )}
                  % and changes the target corpus because spending is inflated for a longer period.
                </p>
              </div>

              <div>
                <div className="planner-panel-head">
                  <div>
                    <span className="eyebrow">Roadmap</span>
                    <h2>First-year action plan</h2>
                  </div>
                </div>
                <div className="roadmap-phase-grid">
                  {roadmapPhases.map((phase) => (
                    <article key={phase.title} className="roadmap-phase-card">
                      <span>{phase.title}</span>
                      <strong>{phase.detail}</strong>
                      <p>{phase.description}</p>
                    </article>
                  ))}
                </div>
                <div className="roadmap-list">
                  {monthlyPlan.map((row) => (
                    <article key={row.month} className="roadmap-list-item">
                      <div className="roadmap-list-head">
                        <div className="roadmap-list-month">Month {row.month}</div>
                        <div className="roadmap-list-main">
                          <strong>{row.focus}</strong>
                          <p>Stay consistent with the planned split and review progress at month end.</p>
                        </div>
                      </div>

                      <div className="roadmap-list-metrics">
                        <div className="roadmap-list-values">
                          <span>Equity SIP</span>
                          <strong>{inr(row.equitySip)}</strong>
                        </div>
                        <div className="roadmap-list-values">
                          <span>Debt SIP</span>
                          <strong>{inr(row.debtSip)}</strong>
                        </div>
                        <div className="roadmap-list-values emphasis">
                          <span>Projected corpus</span>
                          <strong>{inr(row.corpus)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
            ) : null}

            {resultView === "inputs" ? (
            <section className="planner-panel">
              <div className="planner-panel-head">
                <div>
                  <span className="eyebrow">Inputs</span>
                  <h2>Review or edit your numbers</h2>
                </div>
                <button
                  className="soft-button"
                  type="button"
                  onClick={() => setIsEditingInputs((current) => !current)}
                >
                  {isEditingInputs ? "Close editor" : "Edit inputs"}
                </button>
              </div>

              <div className="submitted-inputs-grid">
                <SnapshotTile label="Age" value={`${inputs.age} yrs`} />
                <SnapshotTile label="Retirement" value={`${inputs.retirementAge} yrs`} />
                <SnapshotTile label="Income" value={inr(inputs.annualIncome)} />
                <SnapshotTile label="Expenses" value={inr(inputs.monthlyExpenses)} />
                <SnapshotTile label="MF corpus" value={inr(inputs.currentMfCorpus)} />
                <SnapshotTile label="PPF" value={inr(inputs.currentPpfCorpus)} />
                <SnapshotTile label="Retirement spend" value={inr(inputs.targetMonthlyDrawToday)} />
                <SnapshotTile label="Current SIP" value={inr(inputs.currentMonthlySip)} />
              </div>

              {isEditingInputs ? (
                <div className="edit-inputs-panel">
                  <div className="planner-form-section">
                    <h3>Edit your numbers</h3>
                    <div className="planner-intake-grid">
                      {renderFields(
                        [
                          "age",
                          "retirementAge",
                          "annualIncome",
                          "monthlyExpenses",
                          "currentMonthlySip",
                          "currentMfCorpus",
                          "currentPpfCorpus",
                          "targetMonthlyDrawToday",
                          "currentLifeCover",
                          "liabilities",
                          "preRetirementReturn",
                          "inflationRate",
                        ],
                        draftInputs,
                        setDraftInputs,
                        draftValidation.fields,
                        true,
                      )}
                    </div>
                  </div>
                  <div className="planner-intake-actions compact">
                    <div className="planner-intake-note">
                      Save changes to refresh the plan.
                    </div>
                    <button className="button button-primary planner-button" type="button" onClick={handleInitialSubmit}>
                      Save and refresh
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
            ) : null}

          </div>
        </section>
        </>
        )}

        <section className="planner-disclaimer">
          Guidance only. This planner is educational and should not be treated as licensed
          investment advice. Review important decisions with a SEBI-registered advisor.
        </section>
      </main>
    </div>
  );
}

function MetricSummaryCard({
  label,
  value,
  helper,
  emphasis,
}: {
  label: string;
  value: string;
  helper: string;
  emphasis?: "primary" | "success";
}) {
  return (
    <article className={`metric-summary-card ${emphasis ?? ""}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function GapCard({
  tone,
  title,
  status,
  detail,
}: {
  tone: "critical" | "partial" | "safe";
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <article className={`gap-card ${tone}`}>
      <span>{title}</span>
      <strong>{status}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ProjectionChart({
  target,
  current,
  yearsToRetire,
}: {
  target: number;
  current: number;
  yearsToRetire: number;
}) {
  const width = 720;
  const height = 320;
  const chartId = useId().replace(/:/g, "");
  const paddingX = 52;
  const paddingTop = 26;
  const paddingBottom = 44;
  const steps = 7;
  const maxValue = Math.max(target, current, 1);

  const buildSeries = (value: number, curve: number) =>
    Array.from({ length: steps }, (_, index) => {
      const progress = index / (steps - 1);
      const x = paddingX + (index * (width - paddingX * 2)) / (steps - 1);
      const projected = value * Math.pow(progress, curve);
      const y =
        height -
        paddingBottom -
        (projected / maxValue) * (height - paddingTop - paddingBottom);
      return { x, y };
    });

  const recommendedSeries = buildSeries(target, 1.55);
  const currentSeries = buildSeries(current, 1.12);

  const linePath = (points: Array<{ x: number; y: number }>) =>
    points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

  const areaPath = (points: Array<{ x: number; y: number }>) =>
    `${linePath(points)} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const xLabels = ["Now", `${Math.max(1, Math.round(yearsToRetire / 3))} yrs`, `${Math.max(2, Math.round((yearsToRetire * 2) / 3))} yrs`, `Goal`];
  const yLabels = [maxValue, maxValue * 0.66, maxValue * 0.33].map((value) => compactInr(value));

  return (
    <div className="projection-card modern">
      <div className="projection-header">
        <div>
          <span className="projection-kicker">Corpus projection</span>
          <strong>{compactInr(target)} target</strong>
        </div>
        <div className="projection-chip">Current path {compactInr(current)}</div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="projection-svg" aria-hidden="true">
        <defs>
          <linearGradient id={`recommendedFill-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(21, 146, 222, 0.18)" />
            <stop offset="100%" stopColor="rgba(111, 53, 255, 0)" />
          </linearGradient>
          <linearGradient id={`currentFill-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.16)" />
            <stop offset="100%" stopColor="rgba(255, 156, 18, 0)" />
          </linearGradient>
        </defs>

        {[0, 1, 2].map((line) => {
          const y = paddingTop + (line * (height - paddingTop - paddingBottom)) / 2;
          return <line key={line} x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="projection-grid-line" />;
        })}

        <path d={areaPath(currentSeries)} className="projection-area current" style={{ fill: `url(#currentFill-${chartId})` }} />
        <path d={areaPath(recommendedSeries)} className="projection-area recommended" style={{ fill: `url(#recommendedFill-${chartId})` }} />
        <path d={linePath(currentSeries)} className="projection-line current subtle" />
        <path d={linePath(recommendedSeries)} className="projection-line recommended subtle" />

        {recommendedSeries.map((point, index) =>
          index === 0 || index === recommendedSeries.length - 1 ? (
            <circle key={`recommended-${point.x}`} cx={point.x} cy={point.y} r="5" className="projection-dot recommended" />
          ) : null,
        )}
        {currentSeries.map((point, index) =>
          index === currentSeries.length - 1 ? (
            <circle key={`current-${point.x}`} cx={point.x} cy={point.y} r="5" className="projection-dot current" />
          ) : null,
        )}

        {yLabels.map((label, index) => {
          const y = paddingTop + (index * (height - paddingTop - paddingBottom)) / 2;
          return (
            <text key={label} x={10} y={y + 4} className="projection-axis-label">
              {label}
            </text>
          );
        })}

        {[0, 2, 4, 6].map((index, labelIndex) => (
          <text
            key={index}
            x={recommendedSeries[index].x}
            y={height - 14}
            textAnchor="middle"
            className="projection-axis-label"
          >
            {xLabels[labelIndex]}
          </text>
        ))}
      </svg>

      <div className="projection-legend">
        <div><span className="legend-dot recommended" /> Recommended path</div>
        <div><span className="legend-dot current" /> Current path</div>
      </div>
    </div>
  );
}

function TrajectoryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "purple" | "neutral" | "amber";
}) {
  return (
    <div className={`trajectory-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AllocationRow({
  label,
  amount,
  total,
  tone,
}: {
  label: string;
  amount: number;
  total: number;
  tone: string;
}) {
  const width = `${Math.max((amount / Math.max(total, 1)) * 100, 4)}%`;
  return (
    <div className="allocation-row">
      <span>{label}</span>
      <div className="allocation-bar">
        <div className={`allocation-fill ${tone}`} style={{ width }} />
      </div>
      <strong>{inr(amount)}</strong>
    </div>
  );
}

function GlidepathRow({
  row,
}: {
  row: { ageLabel: string; equity: number; debt: number; action: string; current?: boolean };
}) {
  return (
    <div className={`glidepath-row ${row.current ? "current" : ""}`}>
      <span>{row.ageLabel}</span>
      <strong>{row.equity}%</strong>
      <strong>{row.debt}%</strong>
      <div className="mini-allocation-pill">
        <span style={{ width: `${row.equity}%` }} />
      </div>
      <p>{row.action}</p>
    </div>
  );
}

function ScenarioCard({
  label,
  title,
  sip,
  corpus,
  surplus,
  active,
}: {
  label: string;
  title: string;
  sip: number;
  corpus: number;
  surplus: number;
  active?: boolean;
}) {
  return (
    <article className={`scenario-card ${active ? "active" : ""}`}>
      <span>{label}</span>
      <h3>{title}</h3>
      <p>SIP needed</p>
      <strong>{inr(sip)}/mo</strong>
      <p>Corpus at retirement</p>
      <strong>{compactInr(corpus)}</strong>
      <p>Monthly surplus now</p>
      <strong>{inr(Math.max(surplus, 0))}</strong>
    </article>
  );
}

function FormField({
  label,
  step,
  value,
  placeholder,
  percent,
  help,
  error,
  warning,
  onChange,
}: {
  label: string;
  step: number;
  value: string;
  placeholder: string;
  percent?: boolean;
  help?: string;
  error?: string;
  warning?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="planner-form-field">
      <div className="planner-form-label">
        <span>{label}</span>
        {help ? <InfoHint text={help} /> : null}
      </div>
      <input
        className={error ? "field-error" : warning ? "field-warning" : ""}
        type="text"
        inputMode={percent ? "decimal" : "numeric"}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <small className="field-message error">{error}</small>
      ) : warning ? (
        <small className="field-message warning">{warning}</small>
      ) : (
        <small>{percent ? "Enter percent without the % sign" : "Numbers only, no commas needed"}</small>
      )}
    </label>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <span className="info-hint" tabIndex={0}>
      i
      <span className="info-tooltip">{text}</span>
    </span>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="snapshot-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SnapshotTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="snapshot-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StrategyCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "amber" | "rose" | "green";
}) {
  return (
    <article className={`strategy-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function AiSectionCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "blue" | "amber" | "green";
}) {
  return (
    <section className={`ai-section-card ${tone}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function buildGlidepathRows(currentAge: number, retirementAge: number) {
  const points = [
    currentAge,
    Math.min(currentAge + 6, retirementAge - 5),
    Math.min(currentAge + 11, retirementAge - 1),
    retirementAge,
  ];
  const uniquePoints = [...new Set(points)].filter((age) => age >= currentAge && age <= retirementAge);

  return uniquePoints.map((age, index) => {
    const progress = uniquePoints.length === 1 ? 1 : index / (uniquePoints.length - 1);
    const equity = Math.round(Math.max(50, 66 - progress * 16));
    const debt = 100 - equity;
    const action =
      index === 0
        ? "Start SIPs"
        : age === retirementAge
          ? "Switch to SWP"
          : index === 1
            ? "First rebalance"
            : "Shift toward hybrid";

    return {
      ageLabel: age === currentAge ? `${age} yrs (now)` : age === retirementAge ? `${age} yrs (retire)` : `${age} yrs`,
      equity,
      debt,
      action,
      current: age === currentAge,
    };
  });
}

function buildEmptyDraftInputs(): FireDraftInputs {
  return {
    age: "",
    retirementAge: "",
    annualIncome: "",
    monthlyExpenses: "",
    currentMfCorpus: "",
    currentPpfCorpus: "",
    targetMonthlyDrawToday: "",
    currentMonthlySip: "",
    currentLifeCover: "",
    liabilities: "",
    inflationRate: "",
    preRetirementReturn: "",
  };
}

function buildDraftFromInputs(inputs: FireInputs): FireDraftInputs {
  return {
    age: String(inputs.age),
    retirementAge: String(inputs.retirementAge),
    annualIncome: String(inputs.annualIncome),
    monthlyExpenses: String(inputs.monthlyExpenses),
    currentMfCorpus: String(inputs.currentMfCorpus),
    currentPpfCorpus: String(inputs.currentPpfCorpus),
    targetMonthlyDrawToday: String(inputs.targetMonthlyDrawToday),
    currentMonthlySip: String(inputs.currentMonthlySip),
    currentLifeCover: String(inputs.currentLifeCover),
    liabilities: String(inputs.liabilities),
    inflationRate: String(inputs.inflationRate * 100),
    preRetirementReturn: String(inputs.preRetirementReturn * 100),
  };
}

function parseDraftInputs(draft: FireDraftInputs): FireInputs {
  const getNumber = (key: FireField, fallback: number) => {
    const raw = draft[key].replace(/,/g, "").trim();
    if (!raw) {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    ...fireDefaults,
    age: getNumber("age", 0),
    retirementAge: getNumber("retirementAge", 0),
    annualIncome: getNumber("annualIncome", 0),
    monthlyExpenses: getNumber("monthlyExpenses", 0),
    currentMfCorpus: getNumber("currentMfCorpus", 0),
    currentPpfCorpus: getNumber("currentPpfCorpus", 0),
    targetMonthlyDrawToday: getNumber("targetMonthlyDrawToday", 0),
    currentMonthlySip: getNumber("currentMonthlySip", 0),
    currentLifeCover: getNumber("currentLifeCover", 0),
    liabilities: getNumber("liabilities", 0),
    inflationRate: getNumber("inflationRate", fireDefaults.inflationRate * 100) / 100,
    preRetirementReturn: getNumber("preRetirementReturn", fireDefaults.preRetirementReturn * 100) / 100,
  };
}

function renderFields(
  keys: FireField[],
  draftInputs: FireDraftInputs,
  setDraftInputs: React.Dispatch<React.SetStateAction<FireDraftInputs>>,
  fieldValidation: Partial<
    Record<
      keyof FireInputs,
      {
        errors: string[];
        warnings: string[];
      }
    >
  >,
  showValidation: boolean,
) {
  return keys.map((key) => {
    const field = fireFieldConfig.find((item) => item.key === key)!;
    const messages = showValidation ? fieldValidation[key] : undefined;
    return (
      <FormField
        key={field.key}
        label={field.label}
        step={field.step}
        value={draftInputs[field.key]}
        placeholder={field.placeholder}
        percent={field.percent}
        help={field.help}
        error={messages?.errors[0]}
        warning={messages?.warnings[0]}
        onChange={(value) => setDraftInputs((current) => ({ ...current, [field.key]: value }))}
      />
    );
  });
}
