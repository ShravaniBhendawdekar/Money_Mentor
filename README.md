# Firo

Firo is a modern AI-assisted personal finance web app designed to make financial planning feel clear, actionable, and less intimidating.

It currently includes two core experiences:

- **FIRE Path Planner**  
  A dynamic retirement-planning experience that turns income, expenses, savings, and life goals into a practical path to financial independence.

- **Money Health Score**  
  A guided financial wellness check that scores a user across emergency preparedness, insurance, investing, debt, tax efficiency, and retirement readiness.

## Why Firo

Most finance tools either feel too technical or too shallow. Firo is built to sit in the middle:

- clear enough for everyday users
- structured enough for product demos and hackathon judging
- practical enough to generate real next steps instead of just charts

## Features

### FIRE Path Planner

- Input-led planning flow
- Retirement corpus estimation using inflation-adjusted expenses
- SIP requirement calculation
- Current-path retirement age estimate
- Emergency fund target and gap analysis
- Insurance gap analysis
- Asset allocation glidepath
- Month-by-month roadmap
- Dynamic updates when key values change
- AI-assisted planning summary with deterministic fallback

### Money Health Score

- Quick onboarding flow
- Overall money health score and grade
- 6-dimension financial wellness assessment:
  - emergency preparedness
  - insurance coverage
  - investment diversification
  - debt health
  - tax efficiency
  - retirement readiness
- AI coach summary
- Top-priority action recommendations

## Tech Stack

- React 18
- TypeScript
- Vite
- Optional Gemini API integration

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
  styles.css             # Global styles and UI system
  main.tsx               # App entry point
```

## Requirements

See [requirements.txt](./requirements.txt).

You will typically need:

- Node.js 18+
- npm 9+
- A modern browser
- Optional Gemini API key for live AI guidance

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview the production build

```bash
npm run preview
```

## Environment Variables

If you want live AI guidance, create a local `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-2.5-flash
```

### Notes

- If no Gemini key is configured, the app still works.
- In that case, it uses deterministic fallback guidance.
- Because this is a Vite app, custom env vars must start with `VITE_`.

## Available Scripts

- `npm run dev`  
  Starts the development server.

- `npm run build`  
  Runs TypeScript checks and creates a production build.

- `npm run preview`  
  Serves the production build locally.

## Product Flow

### Landing Page

- Presents the Firo product and the two implemented features
- Lets users enter either planning flow from a product-style interface

### FIRE Path Planner

1. User enters financial inputs
2. App generates the plan
3. User sees corpus, SIP, glidepath, roadmap, and AI-backed insights
4. User can adjust values and update the plan dynamically

### Money Health Score

1. User enters a short financial profile
2. App generates the score
3. User sees overall score, dimension-level breakdown, and prioritized actions

## AI Behavior

Both implemented features use AI-assisted guidance through `src/ai.ts`.

Behavior:

- If Gemini is configured, the app requests structured guidance
- If Gemini is missing or fails, the app falls back to deterministic plan-backed content
- The app includes guardrails to distinguish AI guidance from licensed financial advice

## Guardrails

Firo is an educational planning tool.

It does **not** provide licensed financial advice. The app includes disclaimer guardrails throughout the product to distinguish AI-generated guidance from regulated investment, insurance, and tax advice.

Users should review major money decisions with a **SEBI-registered advisor** or another relevant licensed professional.

## Screenshots

<img width="1900" height="907" alt="image" src="https://github.com/user-attachments/assets/094ff59d-b9b8-48e5-9840-c26aa485526c" />

<img width="1901" height="906" alt="image" src="https://github.com/user-attachments/assets/14a03018-7f73-4b28-90b1-7f0a46babf25" />

<img width="1895" height="908" alt="image" src="https://github.com/user-attachments/assets/fdc8c445-4e48-4890-b7f7-e8d47ed6e3f3" />

<img width="1902" height="908" alt="image" src="https://github.com/user-attachments/assets/acc757b6-78bd-4253-82cb-fd99bf48b0ae" />

<img width="1895" height="907" alt="image" src="https://github.com/user-attachments/assets/59a5f830-d801-4aaf-821c-cc9a03bbcfc5" />

<img width="1897" height="907" alt="image" src="https://github.com/user-attachments/assets/7da53101-158d-414e-88b3-43fe683a663f" />

<img width="1897" height="907" alt="image" src="https://github.com/user-attachments/assets/851f330f-e06a-448f-bacd-e073b3e8d4e6" />

<img width="1893" height="915" alt="image" src="https://github.com/user-attachments/assets/77784073-f50b-475d-85f6-87a836d96679" />

<img width="1893" height="905" alt="image" src="https://github.com/user-attachments/assets/ae2e0e8a-d0e4-4733-89a4-d57b8607e529" />

<img width="1900" height="906" alt="image" src="https://github.com/user-attachments/assets/3d76e4f5-9131-4035-9311-0b8abfa31f09" />

<img width="1907" height="921" alt="image" src="https://github.com/user-attachments/assets/4ab1648e-0644-445e-a637-95ec30915d63" />


## Troubleshooting

### AI guidance is not appearing

- Check that `.env` exists in the project root
- Check that `VITE_GEMINI_API_KEY` is set
- Restart the dev server after changing env values

### Build errors

Run:

```bash
npm install
npm run build
```

### UI changes are not visible

- Refresh the browser
- Restart the dev server if needed:

```bash
npm run dev
```


