# PMF Insights — Frontend

Next.js frontend for the PMF Insights diagnostic tool. Founders answer 5 targeted questions and receive an AI-generated, data-backed PMF report with scores, risk signals, and a Sprint 0 action plan.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, tw-animate-css
- **Animations:** Framer Motion
- **Charts:** Recharts (radar, area, funnel)
- **UI Libraries:** Aceternity UI, Magic UI, shadcn/ui (Radix primitives)
- **Analytics:** PostHog (explicit events only, autocapture off)
- **Testing:** Jest + React Testing Library

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL and optionally NEXT_PUBLIC_POSTHOG_KEY

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key (analytics disabled if empty) |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog host (defaults to `https://us.i.posthog.com`) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout + PostHog init
│   ├── page.tsx            # Landing page (hero, how-it-works, testimonials, CTA)
│   └── PostHogInit.tsx     # Client-side PostHog initialization
├── components/
│   ├── chat/               # Assessment flow components
│   │   ├── AssessmentWizard.tsx   # Main wizard orchestrator (question → analysis → preview → report)
│   │   ├── AnalysisLoader.tsx     # Pipeline loading animation
│   │   ├── PreviewCards.tsx       # Email gate with report preview
│   │   └── Report.tsx            # Full 9-section report dashboard
│   ├── landing/
│   │   └── HeroSection.tsx       # Landing page hero
│   └── ui/                 # Reusable UI components
│       ├── aceternity/     # Aceternity UI (spotlight, sparkles, floating navbar, etc.)
│       └── magicui/        # Magic UI (shimmer button, magic card, number ticker)
├── hooks/
│   └── useAssessment.ts    # Core assessment state machine + API integration
├── lib/
│   ├── api.ts              # Backend API client
│   ├── constants.ts        # Questions, report sections, config
│   ├── posthog.ts          # PostHog SDK wrapper (track, identify, reset)
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions (cn, etc.)
```

## User Flow

1. **Landing** — Hero with CTA, how-it-works cards, testimonials
2. **Assessment** — 5 questions (4 textarea + 1 select) with real-time micro-insights
3. **Analysis** — AI pipeline runs (classification → research → scoring → report generation)
4. **Email Gate** — Preview cards shown, full report unlocked after email submission
5. **Report** — Interactive dashboard with PMF score gauge, radar chart, dimension bars, AARRR funnel, growth trajectory, and 9 insight cards

## Analytics Events

13 PostHog events track the full funnel. Privacy-safe: no PII, only email domain, answer length (not text), autocapture disabled.

| Event | Funnel Stage |
|-------|-------------|
| `cta_clicked` | Landing |
| `assessment_started` | Assessment |
| `question_viewed` | Assessment |
| `question_answered` | Assessment |
| `insight_displayed` | Assessment |
| `analysis_started` | Pipeline |
| `analysis_completed` | Pipeline |
| `analysis_failed` | Pipeline |
| `email_submitted` | Conversion |
| `report_unlocked` | Conversion |
| `report_viewed` | Report |
| `report_section_viewed` | Report |
| `report_pdf_emailed` | Report |

## Scripts

```bash
npm run dev       # Development server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npm test          # Jest tests
```
