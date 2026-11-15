/**
 * Pure streak derivation functions for Spin the Wheel Todo.
 *
 * Rules:
 * - A day counts toward the streak if at least 1 task was completed ('done') on that date.
 * - Penalties NEVER affect the streak; only completions do.
 * - currentStreak = number of consecutive counted days ending today.
 *   If today has no completion yet but yesterday counted, the streak is still alive.
 *   It only breaks once a full day passes with zero completions.
 * - longestStreak = longest run of consecutive counted days in history.
 */

import { Task } from "./types";
import { subtractDays, daysDifference } from "./date";

/**
 * Returns whether a calendar date counts toward streaks (has at least 1 done task).
 */
export function isDateCounted(tasks: Task[], date: string): boolean {
  return tasks.some((t) => t.date === date && t.status === "done");
}

/**
 * Returns a Set of all unique dates that have at least one completed task.
 */
export function getCountedDates(tasks: Task[]): Set<string> {
  const dates = new Set<string>();
  for (const task of tasks) {
    if (task.status === "done") {
      dates.add(task.date);
    }
  }
  return dates;
}

/**
 * Calculates current streak as of todayDate.
 *
 * If today has at least 1 completion:
 *   Streak counts today + consecutive previous days.
 * If today has 0 completions:
 *   If yesterday counted, streak is still alive and counts consecutive days ending yesterday.
 *   If yesterday did not count, streak is 0.
 */
export function currentStreak(tasks: Task[], todayDate: string): number {
  const counted = getCountedDates(tasks);
  if (counted.size === 0) return 0;

  const todayCounted = counted.has(todayDate);
  const yesterday = subtractDays(todayDate, 1);
  const yesterdayCounted = counted.has(yesterday);

  if (!todayCounted && !yesterdayCounted) {
    // Both today and yesterday have no completions -> streak is broken
    return 0;
  }

  // Determine starting point: either today (if counted) or yesterday
  let streak = 0;
  let checkDate = todayCounted ? todayDate : yesterday;

  while (counted.has(checkDate)) {
    streak += 1;
    checkDate = subtractDays(checkDate, 1);
  }

  return streak;
}

/**
 * Calculates the longest streak of consecutive calendar days in history.
 */
export function longestStreak(tasks: Task[]): number {
  const counted = getCountedDates(tasks);
  if (counted.size === 0) return 0;

  const sortedDates = Array.from(counted).sort();
  if (sortedDates.length === 1) return 1;

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = daysDifference(sortedDates[i - 1], sortedDates[i]);
    if (diff === 1) {
      currentRun += 1;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  return maxStreak;
}

/**
 * Returns true if the streak is alive (either today counted or yesterday counted, with streak > 0).
 */
export function isStreakAlive(tasks: Task[], todayDate: string): boolean {
  return currentStreak(tasks, todayDate) > 0;
}
