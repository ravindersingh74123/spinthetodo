# 🎯 Spin the Wheel Todo

> A focus and momentum game for daily personal productivity. Add today's tasks, watch them populate equal slices of a hand-crafted SVG wheel, spin the wheel of fortune, and beat the derived timer. Earn points, maintain streaks, manage penalties, and build momentum with no zero days.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+ recommended
- **npm** (or pnpm / yarn)

### Installation
```bash
# Clone and enter the project directory
cd spinthetodo

# Install dependencies
npm install --legacy-peer-deps
```

### Running Locally
```bash
# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
```bash
# Execute unit and component tests (Vitest)
npm test
```
*Current test suite: 15 suites, 98 tests passing across pure logic, persistence, and UI components.*

### Linting & Production Build
```bash
# Run ESLint
npm run lint

# Compile optimized Next.js production build with static prerendering
npm run build
```

---

## 🎨 Design System & Source of Truth

The visual and interaction design strictly adheres to [design_todo.md](./design/design_todo.md) (`spinthetodo/design/design_todo.md`):
- **Aesthetic**: Flat editorial poster aesthetic with solid high-contrast borders and zero drop shadows or soft gradients.
- **Palette**:
  - **Carbon Black** (`#000000`) for structural borders (1px) and primary typography.
  - **Paper White** (`#FFFFFF`) for card backgrounds.
  - **Concrete Gray** (`#E1E4EA`) & **Soft Mist** (`#F2F4F8`) for neutral backgrounds.
  - **Sky Wash** (`#DCEEFF`) for hero backdrops.
  - **Accents**: Mint Pop (`#55DB9C`), Sunburst (`#FFD731`), Ember (`#FB4903`), Lavender (`#E9CCFF`), Voltage Violet (`#5C4ADE`), Electric Blue (`#4DA2FF`).
- **Typography**:
  - **Display / Headers**: Antonio (crushed line height, uppercase, tight tracking matching *Lateral*).
  - **Body / UI**: Inter (clean, geometric grotesque matching *Aeonik Pro*).
- **Component Geometry**: 20px card border radii (`rounded-[20px]`), 30px hero containers, and full pill navigation buttons (`rounded-full`).

---

## 📐 Product Rules & Domain Architecture

All business logic is **pure**, isolated under `lib/`, and completely decoupled from React and `localStorage` to allow 100% deterministic unit testing.

### 1. Task Lifecycle & The 2-Attempt Rule
- Tasks exist for **today only** (`YYYY-MM-DD` local calendar string). Unfinished tasks do **not** roll over to the next day.
- **Lifecycle Flow**:
  $$\text{pending} \longrightarrow \text{active} \longrightarrow \begin{cases} \text{done} & (\text{Early completion or 'Yes' on timer end}) \\ \text{retry} & (\text{1st incomplete: returns to wheel as pending, attempts = 1}) \\ \text{failed} & (\text{2nd incomplete: attempts = 2, removed from wheel}) \end{cases}$$
- Tasks can only be deleted while in `pending` status.
- Tasks land with an automatic result animation, immediately becoming active.

### 2. Time is Derived, Not Counted
- Timers are computed as:
  $$\text{Remaining Time} = \text{durationMin} \times 60,000 - (\text{now} - \text{startedAt})$$
- The 1-second interval only triggers re-renders; closing the tab, navigating to another page, or refreshing mid-countdown preserves the true remaining duration.
- If the browser is reopened after the timer has elapsed, the **"Did you complete it?"** dialog immediately prompts the user.

### 3. Points Ledger & Next-Day Penalties
- Total points are calculated as the immutable sum of ledger entries ($\sum \Delta$):
  - **Task Completed**: Adds `+task.points` dated **today**.
  - **Task Failed** (2nd incomplete attempt): Adds `-task.points` dated **tomorrow** (penalties are charged against the next day's total to fuel morning redemption).
  - **Negative Totals**: Fully supported (no floor).
  - **Perfect Day Bonus**: When all tasks for a day are done (with at least 1 task), a one-time `+50` bonus entry is awarded dated that day.

### 4. Derived Streaks
- A day counts toward the streak if $\ge 1$ task was completed on that date.
- **Current Streak**: Number of consecutive days ending today. If today has no completions yet but yesterday counted, the streak remains **alive** (it only resets when a full calendar day closes with 0 completions).
- **Longest Streak**: Historical max consecutive run.
- Penalties **never** break streaks; only task completions count.

### 5. Local Dates Centralization
- Local dates are generated as `YYYY-MM-DD` via `lib/date.ts`, safeguarding against UTC midnight drift.
- Midnight transitions automatically refresh today's focus list and calendar activity.

---

## 📂 Project Structure

```
spinthetodo/
├── app/
│   ├── calendar/
│   │   └── page.tsx           # History & calendar month inspector
│   ├── globals.css            # Tailwind theme tokens & design CSS variables
│   ├── layout.tsx             # Root layout with fonts, marquee banner, and header
│   └── page.tsx               # Main app screen (Tasks, Wheel, Focus Timer, Stats)
├── components/
│   ├── ActiveTask.tsx         # Focus timer, Done Early button, Did-you-complete modal
│   ├── Calendar.tsx           # Month view grid, indicators, streak continuity
│   ├── DayDetail.tsx          # Read-only historical day audit & points breakdown
│   ├── Header.tsx             # Brand mark, pill nav, active task indicator
│   ├── MarqueeBanner.tsx      # Infinite looping editorial ribbon
│   ├── StatsBar.tsx           # Points total, streak flame, pending penalty alert
│   ├── TaskForm.tsx           # Task creation form with inline validation
│   ├── TaskList.tsx           # Today's tasks with status badges and deletion
│   └── Wheel.tsx              # Hand-built SVG wheel with deceleration physics
├── design/
│   └── design_todo.md         # Visual design source of truth
├── lib/
│   ├── date.ts                # Local date calculation and formatting helpers
│   ├── ledger.ts              # Points ledger entries, totals, and bonus detection
│   ├── storage.ts             # Versioned, resilient localStorage wrapper
│   ├── streak.ts              # Derived current and longest streak calculations
│   ├── tasks.ts               # Pure task lifecycle state machine & validators
│   ├── types.ts               # TypeScript domain interfaces and constants
│   └── wheel.ts               # Polar slice geometry and rotation angle math
├── store/
│   └── useAppState.tsx        # React 19 / Next.js SSR-safe external store
└── tests/
    ├── edge_cases.test.ts     # Edge cases: 0 pts, long names, storage recovery
    └── setup.ts               # Vitest environment setup and mocks
```

---

## ♿ Accessibility & Motion

- **Keyboard Operation**:
  - Full keyboard accessibility for task creation, preset chips, and the Spin button.
  - Focus modal on expiry traps focus and binds `[Y]` (or `Enter`) to complete and `[N]` to abandon. Pressing `[Esc]` cancels the abandon prompt.
- **Motion Preferences**:
  - Respects `prefers-reduced-motion: reduce`. When active, animations (wheel spin and marquee) collapse to instant or minimal durations without disorienting movement.
- **High Contrast**:
  - Dark Carbon (`#000000`) typography on bright pastel backgrounds guarantees crisp readability meeting WCAG AA standards.

---

## 🔮 Known Limitations & v2 Roadmap

While version 1.0 delivers a complete, rock-solid single-device experience, future iterations can introduce:
1. **Streak Freezes & Rest Days**: Bankable "shield" tokens earned by completing 5 consecutive Perfect Days to protect streaks during planned days off.
2. **Point Multipliers**: Bonus multipliers ($1.25\times$, $1.5\times$) for tasks completed within the first half of the allocated timer.
3. **Weighted Slices**: Proportional wheel slice angles based on task point value or priority.
4. **Cross-Device Sync**: Optional encrypted peer-to-peer or lightweight cloud sync (e.g., Supabase / WebSync) to sync tasks across desktop and mobile browsers.
5. **Sound & Haptics**: Subtle mechanical click sounds during wheel deceleration and a celebratory audio chime on task completion.
