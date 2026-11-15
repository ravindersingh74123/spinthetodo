import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DayDetail from "./DayDetail";
import * as AppStateModule from "@/store/useAppState";
import { Task, LedgerEntry } from "@/lib/types";

describe("components/DayDetail (spec)", () => {
  it("renders empty state when there is no activity for the selected date", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      tasks: [],
      ledger: [],
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    render(<DayDetail date="2026-11-10" />);

    expect(screen.getByText(/no activity recorded/i)).toBeInTheDocument();
    expect(screen.getByText("Read-Only")).toBeInTheDocument();
  });

  it("renders completed tasks, failed tasks, and ledger breakdown for the date", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        name: "Completed Sprint Task",
        durationMin: 30,
        points: 20,
        date: "2026-11-14",
        status: "done",
        attempts: 0,
      },
      {
        id: "t2",
        name: "Failed Deep Work",
        durationMin: 45,
        points: 15,
        date: "2026-11-14",
        status: "failed",
        attempts: 2,
      },
    ];

    const ledger: LedgerEntry[] = [
      {
        id: "l1",
        date: "2026-11-14",
        delta: 20,
        reason: "task_completed",
        taskId: "t1",
      },
      {
        id: "l2",
        date: "2026-11-14",
        delta: -15,
        reason: "task_penalty",
        taskId: "t2",
      },
    ];

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      tasks,
      ledger,
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    render(<DayDetail date="2026-11-14" />);

    // Header and Read-only badge
    expect(screen.getByText(/nov 14, 2026/i)).toBeInTheDocument();
    expect(screen.getByText("Read-Only")).toBeInTheDocument();

    // Day net points: 20 - 15 = +5 pts
    expect(screen.getByText("+5 pts")).toBeInTheDocument();

    // Completed task
    expect(screen.getByText("Completed Sprint Task")).toBeInTheDocument();
    expect(screen.getAllByText("+20 pts").length).toBe(2); // In completed task & ledger entries

    // Failed task
    expect(screen.getByText("Failed Deep Work")).toBeInTheDocument();
    expect(screen.getByText("-15 penalty")).toBeInTheDocument();

    // Ledger items
    expect(screen.getByText(/task completion/i)).toBeInTheDocument();
    expect(screen.getByText(/penalty \(failed task\)/i)).toBeInTheDocument();
  });
});
