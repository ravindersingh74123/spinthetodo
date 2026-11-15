/**
 * Pure points ledger functions for Spin the Wheel Todo.
 *
 * Ground rules:
 * - The total is always derived from the sum of delta entries. Never store a running total.
 * - Total may go negative (no floor).
 * - Completing a task adds +task.points dated today.
 * - Failing a task adds -task.points dated tomorrow (deducted from next day's total).
 * - Perfect-day bonus: one-time +50 entry dated that day when all tasks are done.
 */

import { LedgerEntry, Task, PERFECT_DAY_BONUS } from "./types";
import { isAllTasksDoneForDate } from "./tasks";

/**
 * Creates a ledger entry for a completed task dated today.
 */
export function completionEntry(
  task: Task,
  date: string,
  id: string = crypto.randomUUID()
): LedgerEntry {
  return {
    id,
    date,
    delta: task.points,
    reason: "task_completed",
    taskId: task.id,
  };
}

/**
 * Creates a ledger entry for a failed task penalty dated tomorrow.
 */
export function penaltyEntry(
  task: Task,
  tomorrowDate: string,
  id: string = crypto.randomUUID()
): LedgerEntry {
  return {
    id,
    date: tomorrowDate,
    delta: -Math.abs(task.points),
    reason: "task_penalty",
    taskId: task.id,
  };
}

/**
 * Creates a ledger entry for a perfect day bonus (+50) dated that day.
 */
export function perfectDayEntry(
  date: string,
  id: string = crypto.randomUUID()
): LedgerEntry {
  return {
    id,
    date,
    delta: PERFECT_DAY_BONUS,
    reason: "perfect_day_bonus",
  };
}

/**
 * Checks if a perfect day bonus entry has already been awarded for a given date.
 */
export function hasPerfectDayEntry(
  ledger: LedgerEntry[],
  date: string
): boolean {
  return ledger.some(
    (e) => e.date === date && e.reason === "perfect_day_bonus"
  );
}

/**
 * Pure check to see if a perfect day bonus should be granted.
 * Returns the bonus LedgerEntry if every task is done and the bonus was not yet awarded, else null.
 */
export function checkPerfectDayBonus(
  tasks: Task[],
  ledger: LedgerEntry[],
  date: string,
  id?: string
): LedgerEntry | null {
  if (!isAllTasksDoneForDate(tasks, date)) {
    return null;
  }

  if (hasPerfectDayEntry(ledger, date)) {
    return null;
  }

  return perfectDayEntry(date, id);
}

/**
 * Calculates the overall lifetime net points from all ledger entries.
 * Can be negative (no floor).
 */
export function totalPoints(ledger: LedgerEntry[]): number {
  return ledger.reduce((sum, entry) => sum + entry.delta, 0);
}

/**
 * Calculates the net points for a specific date from the ledger.
 */
export function pointsForDate(ledger: LedgerEntry[], date: string): number {
  return ledger
    .filter((entry) => entry.date === date)
    .reduce((sum, entry) => sum + entry.delta, 0);
}

/**
 * Returns all ledger entries for a specific date.
 */
export function entriesForDate(
  ledger: LedgerEntry[],
  date: string
): LedgerEntry[] {
  return ledger.filter((entry) => entry.date === date);
}

/**
 * Returns penalty entries landing on a specific date (e.g. tomorrow).
 */
export function penaltiesForDate(
  ledger: LedgerEntry[],
  date: string
): LedgerEntry[] {
  return ledger.filter(
    (entry) => entry.date === date && entry.reason === "task_penalty"
  );
}
