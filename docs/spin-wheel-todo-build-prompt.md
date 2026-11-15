# Build Prompt: Spin-the-Wheel Todo (Phase-wise)

You are helping me build a personal productivity app called **Spin the Wheel Todo**. I add today's tasks, they appear as equal slices on a wheel, I spin it, and whatever it lands on I have to do, against a timer. Points, penalties, and streaks make it a game.

Read this whole document first. Then build **one phase at a time**. After each phase, stop, summarize what you built, list how I can verify it, and wait for my go-ahead before starting the next phase.

---

## Ground rules

1. **Design source of truth: `design_todo.md`.** Every visual decision (colors, typography, spacing, radius, component look, wheel palette, motion style, layout, empty states, icons) comes from `design_todo.md`. Read it before Phase 0 and again before each UI phase. Do not invent colors, fonts, or layout. If `design_todo.md` is missing something you need, or is ambiguous, ask me instead of guessing. Put the design tokens it defines into the Tailwind config / CSS variables in Phase 0 so later phases reference tokens, never hard-coded values.
2. **Stack:** Next.js (App Router) + TypeScript (strict) + Tailwind CSS. No backend. Persistence is `localStorage` only (personal use). No UI or wheel libraries; the wheel is hand-built SVG.
3. **Minimal patches after each phase.** Once a phase is accepted, later phases extend it with targeted changes. Do not rewrite or reorganize earlier code unless I ask. If an earlier phase has a bug, show the smallest fix.
4. **Business logic is pure and separate from UI.** All rules (lifecycle, points, streaks, dates) live in plain TypeScript functions under `lib/` with no React and no `localStorage` calls, so they can be unit tested.
5. **Dates are local.** A "day" is the user's local calendar date as a `YYYY-MM-DD` string, never UTC. Centralize this in one `lib/date.ts` helper.
6. **Time is derived, not counted.** Timers are computed from a stored `startedAt` timestamp. Never rely on an in-memory countdown, because a refresh or closed tab must not reset the timer.
7. **Keep it simple.** No features beyond this document. If you think something is missing, suggest it at the end of a phase instead of building it.

---

## Product rules (the spec)

### Tasks
- Fields: `id`, `name`, `durationMin`, `points`, `date` (local `YYYY-MM-DD`), `status`, `attempts`, `startedAt?`, `completedAt?`.
- User enters name, time limit (minutes), and points when creating a task. Validate: name non-empty, duration 1 to 240, points 0 or more (integer).
- Tasks are for **today only**. Unfinished tasks do not roll over to the next day.

### Status lifecycle
`pending` → (lands on wheel) → `active` → one of:
- **Completed** (early via button, or "Yes" when the timer ends) → `done`, points awarded, removed from the wheel.
- **Not completed** ("No" when the timer ends, or the user abandons) → `attempts += 1`.
  - If `attempts < 2`: back to `pending` (returns to the wheel **once**).
  - If `attempts >= 2`: `failed`, removed from the wheel, **penalty applied** (see below).

### Wheel
- Equal slices, one per `pending` task. Only `pending` tasks appear. Only one task can be `active` at a time, and spinning is disabled while one is active.
- Pick the winner **first** (uniform random), then animate the wheel to land exactly on that slice. The animation must never decide the result.
- Need at least 1 pending task to spin. With exactly 1 task, the wheel still spins and lands on it.

### Timer
- When a task lands, it becomes `active` and `startedAt` is set automatically.
- Remaining time = `durationMin * 60_000 - (now - startedAt)`, recomputed on every tick. A 1-second interval only triggers re-render.
- The user can press **"Done early"** at any time during the countdown, which completes the task immediately.
- When the time reaches 0, show a **"Did you complete it?" Yes / No** prompt. If the user reopens the app after the timer already expired, show that prompt immediately.

### Points and penalties (ledger model)
- Keep a **points ledger**: entries `{ id, date, delta, reason, taskId }`. The total is always the sum of `delta`; never store a mutable running total.
- Completing a task adds `+task.points` dated **today**.
- Failing a task (second unfinished attempt) adds `-task.points` dated **tomorrow** (the penalty is deducted from the next day's total).
- The total **may go negative** (no floor).
- Perfect-day bonus: when every task for a day is `done` (and the day has at least 1 task), add a one-time `+50` entry dated that day. Make 50 a named constant.

### Streak (derived, not stored)
- A day **counts** toward the streak if at least 1 task was completed that day.
- `currentStreak` = number of consecutive counted days ending today. If today has no completion yet but yesterday counted, the streak is still alive (it only breaks once a full day passes with zero completions).
- `longestStreak` = longest run of consecutive counted days in history.
- Penalties never affect the streak; only completions do.
- Out of scope for v1: streak freezes and streak point multipliers.

### Calendar / history
- Month view with previous/next navigation. Each day shows an indicator: no activity, some completed, perfect day, or penalty-only.
- Clicking a day opens its details: tasks completed (name, points, duration), failed tasks, ledger entries for that day (including penalties), and the day's net points.
- Past days are read-only.

---

## Suggested structure

```
app/
  page.tsx                 # main screen: tasks + wheel + active task
  calendar/page.tsx        # calendar + day detail
components/
  TaskForm.tsx
  TaskList.tsx
  Wheel.tsx
  ActiveTask.tsx           # timer, done early, did-you-finish prompt
  StatsBar.tsx             # total points, current/longest streak
  Calendar.tsx
  DayDetail.tsx
lib/
  types.ts
  date.ts                  # local date helpers
  tasks.ts                 # lifecycle transitions (pure)
  ledger.ts                # points + penalties + perfect-day (pure)
  streak.ts                # derived streak calc (pure)
  wheel.ts                 # slice geometry + landing angle math (pure)
  storage.ts               # versioned localStorage wrapper
store/
  useAppState.ts           # state + persistence glue
design_todo.md             # design source of truth (already provided)
```

Adjust this if you have a good reason, and tell me why.

---

## Phase 0: Setup and design tokens

**Build**
- Initialize the Next.js + TypeScript (strict) + Tailwind project.
- Read `design_todo.md`; map its colors, fonts, spacing, radius, and motion values into Tailwind theme / CSS variables.
- Create the folder structure and `lib/types.ts` with `Task`, `LedgerEntry`, and `AppState`.
- Build a bare layout shell (header, container) matching the design file.

**Done when**
- App runs, the shell renders in the style described by `design_todo.md`, and no design values are hard-coded outside the tokens.
- You list any gaps or ambiguities you found in `design_todo.md` as questions for me.

---

## Phase 1: Pure domain logic

**Build** (no UI)
- `lib/date.ts`: `todayLocal()`, `tomorrowLocal()`, add/subtract days, month helpers.
- `lib/tasks.ts`: transitions `startTask`, `completeTask`, `markNotCompleted` (handles the 2-attempt rule), plus selectors like `pendingTasks(date)`.
- `lib/ledger.ts`: `completionEntry`, `penaltyEntry` (dated tomorrow), `perfectDayEntry`, `totalPoints`, `pointsForDate`.
- `lib/streak.ts`: `currentStreak`, `longestStreak`, derived from task history.
- Unit tests (Vitest or Jest) covering: the full lifecycle including retry then fail, penalty date, negative totals, perfect-day detection (once only), streak continuity, streak still alive when today is empty, streak breaking after a missed day, and local-date handling around midnight.

**Done when** all tests pass and I can read the test names as a spec of the rules above.

---

## Phase 2: State and persistence

**Build**
- `lib/storage.ts`: versioned `localStorage` wrapper (`schemaVersion` key, safe parse, fallback to empty state on corrupt data, wrapped in try/catch).
- `store/useAppState.ts`: state container (context + reducer is fine) exposing actions that call the pure functions from Phase 1.
- Make it **SSR/hydration safe** for Next.js: render nothing stateful until mounted on the client, and avoid hydration mismatches.
- Handle a date change while the app is open (a new day starts at local midnight): recompute "today" on a timer or on window focus.

**Done when** state survives refresh, corrupt storage doesn't crash the app, and there are no hydration warnings in the console.

---

## Phase 3: Task input and list

**Build**
- `TaskForm` (name, time limit in minutes, points) with validation and inline errors.
- `TaskList` showing today's tasks with status (pending / active / done / failed), points, and duration. Allow deleting a task only while it is `pending`.
- Empty state styled per `design_todo.md`.

**Done when** I can add, see, and delete tasks, and they persist across refreshes.

---

## Phase 4: The wheel

**Build**
- `lib/wheel.ts`: slice angle math, and a function that, given the winner index and the current rotation, returns a target rotation that lands the pointer in the middle of the winning slice (include several full spins).
- `Wheel.tsx`: SVG wheel with equal slices, slice colors and label style from `design_todo.md`, a fixed pointer, and a Spin button. Truncate long task names cleanly in slices.
- Animation: CSS transition or `requestAnimationFrame` with easing-out deceleration. Winner is chosen before the animation starts.
- Edge cases: 1 task (full circle, no dividing lines), many tasks (10+, readable labels), reduced-motion preference (shorter or no spin).
- Spin disabled when there are no pending tasks or a task is active.

**Done when** the wheel always lands visibly on the task it selected, across 50+ test spins and with 1, 2, 5, and 12 tasks.

---

## Phase 5: Active task and timer

**Build**
- On wheel landing: show a result moment, then set the task `active` with `startedAt`.
- `ActiveTask.tsx`: task name, big countdown, progress indicator, **Done early** button.
- At time 0 (or on reload after expiry): the **Did you complete it?** Yes / No prompt.
  - Yes: `done`, completion points added to the ledger.
  - No: apply the 2-attempt rule (back to the wheel once, then `failed` with the penalty entry dated tomorrow).
- Refreshing the tab mid-timer must not reset it. Closing the tab and reopening after expiry must show the prompt.

**Done when** I can run a full cycle: spin, countdown, done early / yes / no, retry, then fail, and see the correct ledger entries each time. A 1-minute task is enough to test this.

---

## Phase 6: Stats bar, points, and streak display

**Build**
- `StatsBar.tsx`: total points (may be negative), current streak, longest streak, today's net points.
- Show a pending-penalty hint: if a penalty will land tomorrow, indicate it subtly.
- Perfect-day bonus triggers automatically when the last pending task of a day is completed; show a small celebration per `design_todo.md`.

**Done when** the numbers update immediately after each action, match the ledger, and match the unit-tested logic.

---

## Phase 7: Calendar and history

**Build**
- `Calendar.tsx`: month grid with prev/next, today highlighted, per-day indicator (none / some completed / perfect day / penalty-only), and streak days visually connected if `design_todo.md` supports it.
- `DayDetail.tsx`: opens on day click with completed tasks (name, duration, points), failed tasks, ledger entries (including penalties), and net points. Past days are read-only.
- Derive everything from stored tasks and the ledger; do not duplicate data.

**Done when** I can browse previous months and see exactly what I completed on any past day.

---

## Phase 8: Polish and hardening

**Build**
- Edge-case pass: midnight rollover while the app is open, timer expiring while on the calendar page, very long task names, zero-point tasks, deleting storage mid-session.
- Accessibility: keyboard operation for the form, Spin button, and prompt; focus management on the "Did you complete it?" dialog; sufficient contrast (verify against `design_todo.md` tokens); respect `prefers-reduced-motion`.
- Responsive check on mobile widths.
- A short `README.md`: how to run, the rules (lifecycle, penalty, streak), and where the design source of truth lives.
- A final review listing known limitations and ideas for v2 (for example streak freezes, multipliers, weighted slices, sync across devices).

**Done when** the full flow works on desktop and mobile, tests pass, and the README is accurate.

---

## How to respond in each phase

1. Briefly restate what you're about to build and any assumptions.
2. Build it, with code organized by file path.
3. End with: **what to test**, **what's intentionally not done yet**, and **any questions about `design_todo.md`**.
4. Stop and wait for me.
