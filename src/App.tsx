import { useEffect, useState } from "react";
import { FirePlannerPage } from "./firePlanner";
import { MoneyHealthScorePage } from "./moneyHealthScore";

type Page = "home" | "fire" | "health";

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
];

const stats = [
  { value: "95%", label: "Indians without a financial plan" },
  { value: "₹25K+", label: "Typical annual advisor cost" },
  { value: "5", label: "Core planning dimensions covered" },
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

export default function App() {
  const [page, setPage] = useState<Page>(() =>
    window.location.hash === "#fire-planner"
      ? "fire"
      : window.location.hash === "#money-health-score"
        ? "health"
        : "home",
  );

  useEffect(() => {
    const handleHashChange = () => {
      setPage(
        window.location.hash === "#fire-planner"
          ? "fire"
          : window.location.hash === "#money-health-score"
            ? "health"
            : "home",
      );
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (nextPage: Page) => {
    window.location.hash =
      nextPage === "fire"
        ? "fire-planner"
        : nextPage === "health"
          ? "money-health-score"
          : "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(nextPage);
  };

  return page === "home" ? (
    <LandingPage
      onOpenFirePlanner={() => navigate("fire")}
      onOpenMoneyHealth={() => navigate("health")}
    />
  ) : page === "fire" ? (
    <FirePlannerPage onGoHome={() => navigate("home")} />
  ) : (
    <MoneyHealthScorePage onGoHome={() => navigate("home")} />
  );
}

function LandingPage({
  onOpenFirePlanner,
  onOpenMoneyHealth,
}: {
  onOpenFirePlanner: () => void;
  onOpenMoneyHealth: () => void;
}) {
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
                <button className="button button-secondary" type="button" onClick={onOpenMoneyHealth}>
                  Check Money Health Score
                </button>
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
            <h2>Personal finance planning without the old barriers</h2>
            <p>
              Traditional advice is expensive, fragmented, and often inaccessible until
              your wealth is already large. MoneyMentor is built to bring structured
              planning to working professionals much earlier.
            </p>
          </div>

          <div className="container why-grid">
            <article className="why-card">
              <h3>For You</h3>
              <ul>
                {reasonsForUsers.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </article>

            <article className="why-card">
              <h3>Our Technology</h3>
              <ul>
                {reasonsForTrust.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="tools-section" id="features">
          <div className="container section-intro">
            <span className="eyebrow">Platform</span>
            <h2>6 powerful planning tools</h2>
            <p>
              Start with FIRE planning and expand into tax, portfolio decisions, and
              life-event planning as your financial picture evolves.
            </p>
          </div>

          <div className="container tools-grid">
            {tools.map((tool) => (
              <article key={tool.title} className={`tool-card ${tool.accent}`}>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <button
                  className="inline-link"
                  type="button"
                  onClick={
                    tool.title === "Money Health Score"
                      ? onOpenMoneyHealth
                      : onOpenFirePlanner
                  }
                >
                  Try Now
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section" id="cta">
          <div className="container cta-panel">
            <div>
              <span className="eyebrow light">Ready when you are</span>
              <h2>Start with a FIRE plan that is transparent, practical, and adjustable.</h2>
              <p>
                Build your roadmap, review the assumptions, and keep updating the plan
                as your salary, goals, and life changes.
              </p>
            </div>
            <button className="button button-light" type="button" onClick={onOpenFirePlanner}>
              Start Free Analysis
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
