/**
 * Pure local date helpers for Spin the Wheel Todo.
 *
 * Rules:
 * - A "day" is always the user's local calendar date as a YYYY-MM-DD string, never UTC.
 * - Calculations use local year, month, and day to avoid time-zone/DST drift.
 */

/**
 * Formats a Date object as a local YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 * Uses 12:00:00 (noon) to protect against daylight saving transitions shifting the day.
 */
export function parseDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Returns today's local date as YYYY-MM-DD.
 */
export function todayLocal(): string {
  return formatDate(new Date());
}

/**
 * Adds an integer number of days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Subtracts an integer number of days from a YYYY-MM-DD date string.
 */
export function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

/**
 * Returns tomorrow's local date (from today or a provided base date) as YYYY-MM-DD.
 */
export function tomorrowLocal(baseDateStr?: string): string {
  return addDays(baseDateStr ?? todayLocal(), 1);
}

/**
 * Returns yesterday's local date (from today or a provided base date) as YYYY-MM-DD.
 */
export function yesterdayLocal(baseDateStr?: string): string {
  return subtractDays(baseDateStr ?? todayLocal(), 1);
}

/**
 * Returns the calendar difference (d2 - d1) in days between two YYYY-MM-DD strings.
 */
export function daysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = parseDate(dateStr1);
  const d2 = parseDate(dateStr2);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a string is a valid YYYY-MM-DD date.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  try {
    const d = parseDate(dateStr);
    return formatDate(d) === dateStr;
  } catch {
    return false;
  }
}

/**
 * Returns the number of days in a given local year and month (1-indexed: 1 = Jan, 12 = Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  // Day 0 of next month is the last day of this month
  return new Date(year, month, 0).getDate();
}

/**
 * Returns all YYYY-MM-DD strings in a given year and month (1-indexed: 1 = Jan, 12 = Dec).
 */
export function getMonthDays(year: number, month: number): string[] {
  const count = getDaysInMonth(year, month);
  const days: string[] = [];
  const monthStr = String(month).padStart(2, "0");
  for (let d = 1; d <= count; d++) {
    const dayStr = String(d).padStart(2, "0");
    days.push(`${year}-${monthStr}-${dayStr}`);
  }
  return days;
}

/**
 * Formats a YYYY-MM-DD date for user-friendly display (e.g., "Nov 15, 2026").
 */
export function formatDisplayDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
