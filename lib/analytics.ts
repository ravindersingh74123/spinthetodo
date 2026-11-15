import { Task, LedgerEntry, WHEEL_PALETTE } from "./types";
import { daysDifference } from "./date";

export type AnalyticsTimeRange = "this_month" | "last_30_days" | "all_time";

export interface TaskHabitStats {
  name: string;
  normalizedName: string;
  totalAssigned: number;
  daysScheduled: number;
  totalCompleted: number;
  daysCompleted: number;
  completionRate: number; // 0 to 100
  totalMinutes: number;   // completed focus minutes
  totalPoints: number;    // completed points
}

export interface DailyActivityPoint {
  date: string;
  dayLabel: string;
  completedCount: number;
  assignedCount: number;
  failedCount: number;
  netPoints: number;
}

export interface CategoryAllocation {
  name: string;
  minutes: number;
  percentage: number;
  color: string;
  offset: number;
}

export interface MacroAnalytics {
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  overallCompletionRate: number;
  totalFocusMinutes: number;
  totalFocusHours: string;
  totalPointsEarned: number;
  mostFrequentTask: TaskHabitStats | null;
  bestCompletionTask: TaskHabitStats | null;
  taskHabits: TaskHabitStats[];
  dailyTimeline: DailyActivityPoint[];
  categoryAllocations: CategoryAllocation[];
}

/**
 * Filter tasks and ledger entries by a selected time range.
 */
export function filterByTimeRange<T extends { date: string }>(
  items: T[],
  range: AnalyticsTimeRange,
  referenceDate: string
): T[] {
  if (range === "all_time") return items;

  const refParts = referenceDate.split("-");
  const refYearMonth = `${refParts[0]}-${refParts[1]}`;

  return items.filter((item) => {
    if (!item.date) return false;
    if (range === "this_month") {
      return item.date.startsWith(refYearMonth);
    }
    if (range === "last_30_days") {
      const diff = daysDifference(item.date, referenceDate);
      return diff >= 0 && diff <= 30;
    }
    return true;
  });
}

/**
 * Calculates per-task habit consistency metrics (e.g. Gym assigned 22 days, done 15 days).
 */
export function calculateTaskHabits(tasks: Task[]): TaskHabitStats[] {
  const groups = new Map<
    string,
    {
      displayName: string;
      tasks: Task[];
    }
  >();

  // Group by normalized trimmed lowercase name
  for (const task of tasks) {
    const trimmed = task.name.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();

    if (!groups.has(normalized)) {
      groups.set(normalized, { displayName: trimmed, tasks: [] });
    }
    const group = groups.get(normalized)!;
    group.tasks.push(task);
    // Keep title-cased or best capitalized display name
    if (trimmed[0] === trimmed[0].toUpperCase() && group.displayName[0] !== group.displayName[0].toUpperCase()) {
      group.displayName = trimmed;
    }
  }

  const result: TaskHabitStats[] = [];

  for (const [normalizedName, { displayName, tasks: groupTasks }] of groups.entries()) {
    const totalAssigned = groupTasks.length;
    const scheduledDates = new Set(groupTasks.map((t) => t.date));
    const daysScheduled = scheduledDates.size;

    const completedTasks = groupTasks.filter((t) => t.status === "done");
    const totalCompleted = completedTasks.length;
    const completedDates = new Set(completedTasks.map((t) => t.date));
    const daysCompleted = completedDates.size;

    const completionRate =
      totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    const totalMinutes = completedTasks.reduce(
      (sum, t) => sum + (Number(t.durationMin) || 0),
      0
    );

    const totalPoints = completedTasks.reduce(
      (sum, t) => sum + (Number(t.points) || 0),
      0
    );

    result.push({
      name: displayName,
      normalizedName,
      totalAssigned,
      daysScheduled,
      totalCompleted,
      daysCompleted,
      completionRate,
      totalMinutes,
      totalPoints,
    });
  }

  // Sort descending by totalAssigned, then by completionRate
  return result.sort((a, b) => {
    if (b.totalAssigned !== a.totalAssigned) {
      return b.totalAssigned - a.totalAssigned;
    }
    return b.completionRate - a.completionRate;
  });
}

/**
 * Calculates a daily activity timeline for bar charts (last N days).
 */
export function calculateDailyTimeline(
  tasks: Task[],
  ledger: LedgerEntry[],
  referenceDate: string,
  daysCount: number = 14
): DailyActivityPoint[] {
  const result: DailyActivityPoint[] = [];

  // Generate date points backwards from referenceDate
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const completed = dayTasks.filter((t) => t.status === "done").length;
    const failed = dayTasks.filter((t) => t.status === "failed").length;
    const assigned = dayTasks.length;

    const dayLedger = ledger.filter((l) => l.date === dateStr);
    const netPoints = dayLedger.reduce((sum, l) => sum + l.delta, 0);

    // Short day label e.g. "15 Nov" or "Nov 15"
    let dayLabel = dateStr.slice(5);
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        dayLabel = `${parts[1]}/${parts[2]}`;
      }
    } catch {
      // fallback
    }

    result.push({
      date: dateStr,
      dayLabel,
      completedCount: completed,
      assignedCount: assigned,
      failedCount: failed,
      netPoints,
    });
  }

  return result;
}

/**
 * Calculates focus time allocation slices for charts.
 */
export function calculateFocusAllocations(
  habits: TaskHabitStats[]
): CategoryAllocation[] {
  const completedHabits = habits.filter((h) => h.totalMinutes > 0);
  const totalMinutes = completedHabits.reduce((sum, h) => sum + h.totalMinutes, 0);

  if (totalMinutes === 0) return [];

  // Take top 5 and group remaining as "Other"
  const topHabits = completedHabits.slice(0, 5);
  const otherHabits = completedHabits.slice(5);
  const otherMinutes = otherHabits.reduce((sum, h) => sum + h.totalMinutes, 0);

  let runningOffset = 0;
  const allocations: CategoryAllocation[] = topHabits.map((h, i) => {
    const percentage = Math.round((h.totalMinutes / totalMinutes) * 100);
    const offset = runningOffset;
    runningOffset += percentage;
    return {
      name: h.name,
      minutes: h.totalMinutes,
      percentage,
      color: WHEEL_PALETTE[i % WHEEL_PALETTE.length],
      offset,
    };
  });

  if (otherMinutes > 0) {
    const percentage = Math.max(1, Math.round((otherMinutes / totalMinutes) * 100));
    const offset = runningOffset;
    runningOffset += percentage;
    allocations.push({
      name: "Other Tasks",
      minutes: otherMinutes,
      percentage,
      color: "#e9e9e9", // Soft Mist
      offset,
    });
  }

  return allocations;
}

/**
 * Main analytics calculator aggregating all metrics into a clean, complete dataset.
 */
export function computeMacroAnalytics(
  tasks: Task[],
  ledger: LedgerEntry[],
  range: AnalyticsTimeRange,
  referenceDate: string
): MacroAnalytics {
  const scopedTasks = filterByTimeRange(tasks, range, referenceDate);
  const scopedLedger = filterByTimeRange(ledger, range, referenceDate);

  const taskHabits = calculateTaskHabits(scopedTasks);

  const totalTasksAssigned = scopedTasks.length;
  const totalTasksCompleted = scopedTasks.filter((t) => t.status === "done").length;
  const overallCompletionRate =
    totalTasksAssigned > 0
      ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100)
      : 0;

  const totalFocusMinutes = scopedTasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (Number(t.durationMin) || 0), 0);

  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const totalPointsEarned = scopedLedger.reduce((sum, l) => sum + l.delta, 0);

  // Most frequent task (highest totalAssigned)
  const mostFrequentTask = taskHabits.length > 0 ? taskHabits[0] : null;

  // Best completion task (at least 2 assignments, highest completion rate)
  const qualifiedForBest = taskHabits.filter((h) => h.totalAssigned >= 2);
  const bestCompletionTask =
    qualifiedForBest.length > 0
      ? [...qualifiedForBest].sort((a, b) => b.completionRate - a.completionRate)[0]
      : taskHabits.length > 0
      ? taskHabits[0]
      : null;

  const dailyTimeline = calculateDailyTimeline(scopedTasks, scopedLedger, referenceDate, 14);
  const categoryAllocations = calculateFocusAllocations(taskHabits);

  return {
    totalTasksAssigned,
    totalTasksCompleted,
    overallCompletionRate,
    totalFocusMinutes,
    totalFocusHours,
    totalPointsEarned,
    mostFrequentTask,
    bestCompletionTask,
    taskHabits,
    dailyTimeline,
    categoryAllocations,
  };
}
