import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Calendar from "./Calendar";
import * as AppStateModule from "@/store/useAppState";
import { Task, LedgerEntry } from "@/lib/types";

describe("components/Calendar (spec)", () => {
  it("renders month navigation and responds to month switching", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      tasks: [],
      ledger: [],
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    const mockSelect = vi.fn();
    render(<Calendar selectedDate="2026-11-15" onSelectDate={mockSelect} />);

    expect(screen.getByText(/november 2026/i)).toBeInTheDocument();

    // Click previous month -> October 2026
    const prevBtn = screen.getByRole("button", { name: /previous month/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText(/october 2026/i)).toBeInTheDocument();

    // Click next month -> November 2026
    const nextBtn = screen.getByRole("button", { name: /next month/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/november 2026/i)).toBeInTheDocument();
  });

  it("selects a date when clicked", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      tasks: [],
      ledger: [],
      today: "2026-11-15",
    } as unknown as AppStateModule.AppStateContextValue);

    const mockSelect = vi.fn();
    render(<Calendar selectedDate="2026-11-15" onSelectDate={mockSelect} />);

    // Click on day 10
    const dayBtn = screen.getByRole("button", { name: /^10/ });
    fireEvent.click(dayBtn);

    expect(mockSelect).toHaveBeenCalledWith("2026-11-10");
  });

  it("renders distinct indicators for perfect day, completed tasks, and penalties", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        name: "Done Task",
        durationMin: 20,
        points: 10,
        date: "2026-11-10",
        status: "done",
        attempts: 0,
      },
    ];

    const ledger: LedgerEntry[] = [
      {
        id: "e1",
        date: "2026-11-10",
        delta: 10,
        reason: "task_completed",
        taskId: "t1",
      },
      {
        id: "e2",
        date: "2026-11-12",
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

    render(<Calendar selectedDate="2026-11-15" onSelectDate={vi.fn()} />);

    // Nov 10 has a completed task
    const day10 = screen.getByRole("button", { name: /^10/ });
    expect(day10).toBeInTheDocument();

    // Nov 12 has a penalty
    const day12 = screen.getByRole("button", { name: /^12/ });
    expect(day12).toBeInTheDocument();
  });
});
