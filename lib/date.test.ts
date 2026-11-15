import { describe, it, expect } from "vitest";
import {
  formatDate,
  parseDate,
  todayLocal,
  tomorrowLocal,
  yesterdayLocal,
  addDays,
  subtractDays,
  daysDifference,
  isValidDateString,
  getDaysInMonth,
  getMonthDays,
  formatDisplayDate,
} from "./date";

describe("lib/date: Local calendar date helpers (spec)", () => {
  it("formats dates as local YYYY-MM-DD strings without UTC shift", () => {
    const localDate = new Date(2026, 10, 15, 13, 30, 0); // Nov 15, 2026
    expect(formatDate(localDate)).toBe("2026-11-15");
  });

  it("handles dates near midnight correctly (23:59:59 vs 00:00:01 local)", () => {
    const lateNight = new Date(2026, 10, 15, 23, 59, 59);
    const earlyMorning = new Date(2026, 10, 16, 0, 0, 1);
    expect(formatDate(lateNight)).toBe("2026-11-15");
    expect(formatDate(earlyMorning)).toBe("2026-11-16");
    expect(daysDifference(formatDate(lateNight), formatDate(earlyMorning))).toBe(1);
  });

  it("adds and subtracts days across regular month boundaries", () => {
    expect(addDays("2026-03-30", 2)).toBe("2026-04-01");
    expect(subtractDays("2026-04-01", 2)).toBe("2026-03-30");
  });

  it("handles leap year February boundaries correctly (2024 is leap, 2025 is not)", () => {
    // 2024 leap year
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
    expect(getDaysInMonth(2024, 2)).toBe(29);

    // 2025 non-leap year
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(getDaysInMonth(2025, 2)).toBe(28);
  });

  it("adds and subtracts days across year boundaries (Dec 31 to Jan 1)", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(subtractDays("2027-01-01", 1)).toBe("2026-12-31");
  });

  it("computes tomorrowLocal and yesterdayLocal relative to given date", () => {
    expect(tomorrowLocal("2026-11-15")).toBe("2026-11-16");
    expect(yesterdayLocal("2026-11-15")).toBe("2026-11-14");
    expect(todayLocal()).toBe(formatDate(new Date()));
  });

  it("parses date string to noon Date object", () => {
    const d = parseDate("2026-11-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(15);
  });

  it("formats date for friendly display", () => {
    expect(formatDisplayDate("2026-11-15")).toBe("Nov 15, 2026");
  });

  it("calculates exact calendar day differences regardless of time of day", () => {
    expect(daysDifference("2026-11-10", "2026-11-15")).toBe(5);
    expect(daysDifference("2026-11-15", "2026-11-10")).toBe(-5);
    expect(daysDifference("2026-11-15", "2026-11-15")).toBe(0);
  });

  it("validates valid and invalid date strings", () => {
    expect(isValidDateString("2026-11-15")).toBe(true);
    expect(isValidDateString("2026-02-29")).toBe(false); // 2026 is not leap year
    expect(isValidDateString("invalid")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
  });

  it("generates correct month day lists for calendar view", () => {
    const novDays = getMonthDays(2026, 11);
    expect(novDays.length).toBe(30);
    expect(novDays[0]).toBe("2026-11-01");
    expect(novDays[29]).toBe("2026-11-30");
  });
});
