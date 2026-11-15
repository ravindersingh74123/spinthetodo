import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "./Header";
import * as AppStateModule from "@/store/useAppState";
import { LedgerEntry } from "@/lib/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

describe("components/Header with Topbar Game Stats (spec)", () => {
  it("renders live stats pills matching app state values", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      totalPoints: 120,
      todayPoints: 45,
      currentStreak: 3,
      longestStreak: 7,
      pendingPenaltiesTomorrow: [],
      activeTask: null,
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    render(<Header />);

    // Total points pill
    expect(screen.getByText("+120")).toBeInTheDocument();
    // Today's points pill
    expect(screen.getByText("+45 pts")).toBeInTheDocument();
    // Streak pill
    expect(screen.getByText("3 days")).toBeInTheDocument();
    // Best streak pill
    expect(screen.getByText("7d")).toBeInTheDocument();

    // Verify Rules button and old ⚡ icon are removed
    expect(screen.queryByText(/rules/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/ready to spin/i)).not.toBeInTheDocument();

    // Verify navigation links include Today, Calendar, and Analytics
    expect(screen.getByRole("link", { name: /^today$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^calendar$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^analytics$/i })).toBeInTheDocument();
  });

  it("handles negative total points and applies penalty styling", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      totalPoints: -30,
      todayPoints: 0,
      currentStreak: 0,
      longestStreak: 2,
      pendingPenaltiesTomorrow: [],
      activeTask: null,
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    render(<Header />);

    expect(screen.getByText("-30")).toBeInTheDocument();
  });

  it("displays pending penalty alert pill when a penalty is scheduled tomorrow", () => {
    const tomorrowPenalty: LedgerEntry = {
      id: "pen-1",
      date: "2026-11-16",
      delta: -25,
      reason: "task_penalty",
      taskId: "t-1",
    };

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      totalPoints: 10,
      todayPoints: 10,
      currentStreak: 1,
      longestStreak: 1,
      pendingPenaltiesTomorrow: [tomorrowPenalty],
      activeTask: null,
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    render(<Header />);

    expect(screen.getByText("-25")).toBeInTheDocument();
    expect(screen.getByText("tomorrow")).toBeInTheDocument();
  });
});
