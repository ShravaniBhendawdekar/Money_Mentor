# Firo

Firo is an AI-assisted personal finance web app built for a hackathon use case. It helps users understand their money from two angles:

- `FIRE Path Planner`: builds a financial independence roadmap with retirement corpus planning, SIP guidance, glidepath shifts, insurance gaps, emergency fund targets, and dynamic scenario updates.
- `Money Health Score`: gives a quick financial wellness score across emergency preparedness, insurance coverage, investment diversification, debt health, tax efficiency, and retirement readiness.

The product is built as a modern React + TypeScript + Vite application with an optional Gemini integration for grounded AI guidance.

## What The App Does

### 1. FIRE Path Planner
- Collects the user’s financial profile, current savings, retirement target, and assumptions.
- Calculates retirement corpus using inflation-adjusted expenses and a safe withdrawal rate.
- Computes required SIP, current-path retirement age, emergency reserve target, life cover gap, and retirement longevity.
- Generates a month-by-month roadmap and fund-category allocation split.
- Updates the plan dynamically when the user changes live planning controls.
- Supports AI guidance with a deterministic fallback if Gemini is unavailable.

### 2. Money Health Score
- Runs a short onboarding flow to assess financial wellness.
- Produces an overall score and grade.
- Scores 6 dimensions:
  - Emergency preparedness
  - Insurance coverage
  - Investment diversification
  - Debt health
  - Tax efficiency
  - Retirement readiness
- Surfaces top actions and AI-backed coaching guidance.

## Tech Stack

- `React 18`
- `TypeScript`
- `Vite`
- Optional `Gemini API` for AI-generated insights

## Project Structure

```text
src/
  App.tsx                # Landing page + app shell navigation
  firePlanner.tsx        # FIRE planner UI
  finance.ts             # FIRE planning calculations and validation
  moneyHealthScore.tsx   # Money Health Score UI
  moneyHealth.ts         # Money Health scoring logic and validation
  ai.ts                  # Gemini integration + deterministic fallback guidance
  data.ts                # Default/sample input data
  styles.css             # Global styling and component visuals
  main.tsx               # App entry point
```

## Requirements

See [requirements.txt](C:\Users\Lenovo\Documents\New project\requirements.txt) for the environment/runtime requirements.

In short, you need:

- `Node.js 18+`
- `npm 9+`
- A modern browser
- An optional Gemini API key for live AI guidance

## Environment Variables

Create a local `.env` file in the project root if you want AI guidance from Gemini.

Example:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-2.5-flash
```

Notes:

- If no API key is present, the app still works.
- In that case, it uses deterministic fallback guidance instead of Gemini output.
- Because this is a Vite frontend app, `VITE_` prefixes are required.

## How To Run The Project

### 1. Install dependencies

```powershell
npm install
```

### 2. Start the development server

```powershell
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173
```

Open that in your browser.

### 3. Build for production

```powershell
npm run build
```

### 4. Preview the production build

```powershell
npm run preview
```

## Available Scripts

- `npm run dev`  
  Starts the Vite development server.

- `npm run build`  
  Runs TypeScript build checks and creates the production build.

- `npm run preview`  
  Serves the built app locally for preview.

## App Flow

### Landing page
- Premium-style home page introducing the two implemented features.
- Navigation between home, FIRE Planner, and Money Health Score.

### FIRE Planner flow
1. User fills the input form.
2. The app shows a generating state.
3. The app renders the results dashboard.
4. Users can adjust live controls and see updated planning output.

### Money Health Score flow
1. User fills the score onboarding form.
2. The app shows a scoring/loading state.
3. The app renders the score dashboard and action recommendations.

## AI Behavior

The app uses `src/ai.ts` for both FIRE and Money Health guidance.

Behavior:

- If Gemini is configured, the app requests structured guidance.
- If Gemini is missing, fails, or returns weak/generic output, the app falls back to deterministic text built from actual calculated values.
- This keeps the experience reliable during demos and hackathon judging.

## Important Notes

- This is an educational planning tool, not licensed financial advice.
- The UI is optimized for a modern product-style experience rather than a plain calculator.
- Some assumptions are intentionally configurable so the planning logic remains auditable.

## Suggested Demo Path

For a hackathon demo, a good flow is:

1. Open the Firo landing page.
2. Enter the FIRE Planner with the sample mid-career professional scenario.
3. Show dynamic input changes and updated retirement outcomes.
4. Switch to Money Health Score and show the broader financial wellness view.
5. Highlight how both features combine planning + AI guidance.

## Troubleshooting

### App runs but AI guidance does not appear
- Check that `.env` exists in the project root.
- Ensure `VITE_GEMINI_API_KEY` is present.
- Restart the Vite dev server after editing `.env`.

### Build issues
- Make sure `node_modules` is installed:

```powershell
npm install
```

- Then retry:

```powershell
npm run build
```

### Old UI still appears
- Refresh the browser.
- If needed, stop and restart the dev server:

```powershell
npm run dev
```

## License / Usage

This repository is currently project code for a hackathon-style prototype. Add your preferred license before public distribution.
