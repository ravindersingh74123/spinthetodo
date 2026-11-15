import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsBar from "./StatsBar";
import * as AppStateModule from "@/store/useAppState";
import { LedgerEntry, Task } from "@/lib/types";

describe("components/StatsBar (spec)", () => {
  it("renders null when there is no Perfect Day achieved", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      todayTasks: [],
      ledger: [],
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    const { container } = render(<StatsBar />);
    expect(container.firstChild).toBeNull();
  });

  it("displays Perfect Day celebration banner when all tasks are done and bonus is awarded", () => {
    const task: Task = {
      id: "t1",
      name: "Important Task",
      durationMin: 25,
      points: 20,
      date: "2026-11-15",
      status: "done",
      attempts: 0,
    };
    const bonusEntry: LedgerEntry = {
      id: "bonus-1",
      date: "2026-11-15",
      delta: 50,
      reason: "perfect_day_bonus",
    };

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      todayTasks: [task],
      ledger: [
        {
          id: "comp-1",
          date: "2026-11-15",
          delta: 20,
          reason: "task_completed",
          taskId: "t1",
        },
        bonusEntry,
      ],
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    render(<StatsBar />);

    expect(screen.getByText(/perfect day achieved!/i)).toBeInTheDocument();
    expect(screen.getByText(/\+50 bonus/i)).toBeInTheDocument();
  });
});
