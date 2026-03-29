import { useEffect, useState } from "react";
import { FirePlannerPage } from "./firePlanner";
import { MoneyHealthScorePage } from "./moneyHealthScore";

type Page = "home" | "fire" | "health";

const features = [
  {
    title: "FIRE Path Planner",
    description:
      "Turn retirement ambition into a living plan with goal-based SIPs, retirement timing, protection checks, and a roadmap that evolves as your numbers change.",
    accent: "blue",
    eyebrow: "Long-range planning",
    points: [
      "See the retirement age your current path supports",
      "Adjust inputs and watch the plan respond instantly",
      "Translate a big goal into month-by-month decisions",
    ],
  },
  {
    title: "Money Health Score",
    description:
      "Get a clean read on your financial foundation across savings, protection, investing, debt, tax, and retirement readiness in one guided check-up.",
    accent: "green",
    eyebrow: "5-minute check-in",
    points: [
      "Spot the weakest part of your money system quickly",
      "Understand what to improve first and why it matters",
      "Get practical actions instead of a vague score alone",
    ],
  },
];

const highlights = [
  {
    title: "Start without jargon",
    body: "You do not need to think like an advisor to begin. Firo turns messy inputs into a plan that feels understandable from the first screen.",
  },
  {
    title: "See what matters now",
    body: "Instead of flooding you with charts, it highlights the few actions that will change your position fastest this month.",
  },
  {
    title: "Move with more confidence",
    body: "Whether you are planning early retirement or tightening your money basics, you leave with a direction, not just a dashboard.",
  },
];

export default function App() {
  const [page, setPage] = useState<Page>(() =>
    window.location.hash === "#money-health-score"
      ? "health"
      : window.location.hash === "#fire-planner"
        ? "fire"
        : "home",
  );
  const [fireVisited, setFireVisited] = useState(false);
  const [healthVisited, setHealthVisited] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(
        window.location.hash === "#money-health-score"
          ? "health"
          : window.location.hash === "#fire-planner"
            ? "fire"
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
      onGetStarted={() => navigate("fire")}
      onOpenFire={() => navigate("fire")}
      onOpenHealth={() => navigate("health")}
    />
  ) : page === "fire" ? (
    <>
      <div style={{ display: "block" }}>
        <FirePlannerPage
          onGoHome={() => navigate("home")}
          onOpenFirePlanner={() => navigate("fire")}
          onOpenMoneyHealth={() => navigate("health")}
          onMount={() => setFireVisited(true)}
        />
      </div>
      {healthVisited ? (
        <div style={{ display: "none" }}>
          <MoneyHealthScorePage
            onGoHome={() => navigate("home")}
            onOpenFirePlanner={() => navigate("fire")}
            onOpenMoneyHealth={() => navigate("health")}
            onMount={() => setHealthVisited(true)}
          />
        </div>
      ) : null}
    </>
  ) : (
    <>
      {fireVisited ? (
        <div style={{ display: "none" }}>
          <FirePlannerPage
            onGoHome={() => navigate("home")}
            onOpenFirePlanner={() => navigate("fire")}
            onOpenMoneyHealth={() => navigate("health")}
            onMount={() => setFireVisited(true)}
          />
        </div>
      ) : null}
      <div style={{ display: "block" }}>
        <MoneyHealthScorePage
          onGoHome={() => navigate("home")}
          onOpenFirePlanner={() => navigate("fire")}
          onOpenMoneyHealth={() => navigate("health")}
          onMount={() => setHealthVisited(true)}
        />
      </div>
    </>
  );
}

function LandingPage({
  onGetStarted,
  onOpenFire,
  onOpenHealth,
}: {
  onGetStarted: () => void;
  onOpenFire: () => void;
  onOpenHealth: () => void;
}) {
  return (
    <div className="page">
      <header className="site-header">
        <div className="container nav">
          <button className="brand brand-button" type="button" onClick={onGetStarted}>
            <span className="brand-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.2 2 6.8 13h4.5l-1.1 9L17.2 11h-4.4L13.2 2Z" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-text">Firo</span>
          </button>

          <nav className="nav-links" aria-label="Primary">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </nav>

          <button className="nav-cta" type="button" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="container hero">
            <div className="hero-copy">
              <span className="eyebrow">Personal finance, made decisively clear</span>
              <h1>
                Your money, <span className="gradient-text">finally in focus</span>
              </h1>
              <p className="hero-description">
                Firo brings planning, financial health, and next-step guidance
                into one calm workspace. Understand where you stand, what needs
                attention, and what to do next without the usual finance clutter.
              </p>
              <div className="hero-actions">
                <button className="button button-primary" type="button" onClick={onGetStarted}>
                  Get Started
                </button>
                <button className="button button-secondary" type="button" onClick={onOpenHealth}>
                  Explore Money Health
                </button>
              </div>
            </div>

            <div className="hero-visual hero-visual-compact" aria-hidden="true">
              <div className="hero-stage-layer hero-stage-back" />
              <div className="hero-stage-layer hero-stage-mid" />
              <div className="hero-card hero-card-main hero-card-dashboard">
                <div className="hero-card-topline">
                  <span>Firo workspace</span>
                  <span>Live planning</span>
                </div>
                <strong>See your future plan and present health in one place</strong>
                <div className="hero-dashboard-grid">
                  <div className="hero-dashboard-stat">
                    <span>Money health</span>
                    <strong>82/100</strong>
                  </div>
                  <div className="hero-dashboard-stat small">
                    <span>FIRE path</span>
                    <strong>Age 50</strong>
                  </div>
                  <div className="hero-dashboard-chart">
                    <div className="hero-dashboard-bars">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="hero-dashboard-note">
                    <span>Top action</span>
                    <strong>Boost your emergency reserve before raising SIPs</strong>
                  </div>
                </div>
              </div>
              <div className="hero-card hero-card-float hero-card-float-right">
                <span>Money health</span>
                <strong>Tax efficiency is your easiest unlock</strong>
              </div>
              <div className="hero-card hero-card-float hero-card-float-left">
                <span>FIRE roadmap</span>
                <strong>2 clear moves this month</strong>
              </div>
              <div className="hero-orb hero-orb-a" />
              <div className="hero-orb hero-orb-b" />
            </div>
          </div>
        </section>

        <section className="tools-section" id="features">
          <div className="container section-intro">
            <span className="eyebrow">What you can do</span>
            <h2>One platform, two ways to get financially sharper</h2>
            <p>
              Firo is built around the two questions that matter most:
              &quot;Am I on track for the future?&quot; and &quot;What should I improve right now?&quot;
            </p>
          </div>

          <div className="container tools-grid tools-grid-duo">
            {features.map((feature) => (
              <article key={feature.title} className={`tool-card ${feature.accent}`}>
                <span className="tool-eyebrow">{feature.eyebrow}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul className="tool-points">
                  {feature.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <button
                  className="inline-link"
                  type="button"
                  onClick={feature.title === "Money Health Score" ? onOpenHealth : onOpenFire}
                >
                  Explore
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="info-section" id="how-it-works">
          <div className="container section-intro compact">
            <span className="eyebrow">Why people use it</span>
            <h2>Finance feels lighter when the next step is obvious</h2>
          </div>

          <div className="container reason-grid">
            {highlights.map((item) => (
              <article key={item.title} className="reason-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="reason-card-accent" />
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-card">
            <span className="eyebrow light">Start with clarity</span>
            <h2>Build more confidence into every money decision.</h2>
            <p>
              Whether you want to map financial independence or pressure-test your
              current money habits, Firo helps you move from uncertainty to action.
            </p>
            <button className="button button-light" type="button" onClick={onGetStarted}>
              Get Started
            </button>
          </div>
        </section>

        <footer className="site-footer">
          <div className="container site-footer-grid">
            <div className="site-footer-brand">
              <div className="brand">
                <span className="brand-badge">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.2 2 6.8 13h4.5l-1.1 9L17.2 11h-4.4L13.2 2Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="brand-text">Firo</span>
              </div>
              <p>
                A modern finance workspace for people who want clarity, direction,
                and calmer money decisions.
              </p>
            </div>

            <div className="site-footer-links">
              <strong>Product</strong>
              <button type="button" onClick={onOpenFire}>FIRE Planner</button>
              <button type="button" onClick={onOpenHealth}>Money Health Score</button>
            </div>

            <div className="site-footer-links">
              <strong>Explore</strong>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
            </div>

            <div className="site-footer-links">
              <strong>Start</strong>
              <button type="button" onClick={onGetStarted}>Get Started</button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
