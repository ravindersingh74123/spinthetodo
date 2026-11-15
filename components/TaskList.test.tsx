import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskList from "./TaskList";
import * as AppStateModule from "@/store/useAppState";
import { Task } from "@/lib/types";

describe("components/TaskList (spec)", () => {
  it("renders empty state styled per design_todo.md when there are no tasks", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      todayTasks: [],
      pendingTasks: [],
      deleteTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskList />);

    expect(screen.getByText(/no tasks added for today/i)).toBeInTheDocument();
    expect(
      screen.getByText(/they will appear as equal slices on the wheel/i)
    ).toBeInTheDocument();
  });

  it("renders tasks with status badges, duration, and points", () => {
    const mockTasks: Task[] = [
      {
        id: "t1",
        name: "Pending Task",
        durationMin: 25,
        points: 10,
        date: "2026-11-15",
        status: "pending",
        attempts: 0,
      },
      {
        id: "t2",
        name: "Active Task",
        durationMin: 30,
        points: 20,
        date: "2026-11-15",
        status: "active",
        attempts: 0,
      },
      {
        id: "t3",
        name: "Done Task",
        durationMin: 15,
        points: 5,
        date: "2026-11-15",
        status: "done",
        attempts: 0,
      },
      {
        id: "t4",
        name: "Failed Task",
        durationMin: 45,
        points: 15,
        date: "2026-11-15",
        status: "failed",
        attempts: 2,
      },
    ];

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      todayTasks: mockTasks,
      pendingTasks: [mockTasks[0]],
      deleteTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskList />);

    expect(screen.getByText("Pending Task")).toBeInTheDocument();
    expect(screen.getByText("Active Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
    expect(screen.getByText("Failed Task")).toBeInTheDocument();

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("✓ Done")).toBeInTheDocument();
    expect(screen.getByText("✕ Failed (Penalty)")).toBeInTheDocument();
  });

  it("allows deleting pending tasks only", () => {
    const mockDelete = vi.fn();
    const mockTasks: Task[] = [
      {
        id: "t1",
        name: "Pending Task",
        durationMin: 25,
        points: 10,
        date: "2026-11-15",
        status: "pending",
        attempts: 0,
      },
      {
        id: "t2",
        name: "Done Task",
        durationMin: 15,
        points: 5,
        date: "2026-11-15",
        status: "done",
        attempts: 0,
      },
    ];

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      todayTasks: mockTasks,
      pendingTasks: [mockTasks[0]],
      deleteTask: mockDelete,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskList />);

    // Only one delete button exists (for the pending task)
    const deleteBtn = screen.getByRole("button", {
      name: /delete task: pending task/i,
    });
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(mockDelete).toHaveBeenCalledWith("t1");

    // For Done Task, there is no delete button
    expect(
      screen.queryByRole("button", { name: /delete task: done task/i })
    ).not.toBeInTheDocument();
  });

  it("filters tasks by All, Pending, and Done tabs", () => {
    const mockTasks: Task[] = [
      {
        id: "t1",
        name: "Pending Task",
        durationMin: 25,
        points: 10,
        date: "2026-11-15",
        status: "pending",
        attempts: 0,
      },
      {
        id: "t2",
        name: "Done Task",
        durationMin: 15,
        points: 5,
        date: "2026-11-15",
        status: "done",
        attempts: 0,
      },
    ];

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      todayTasks: mockTasks,
      pendingTasks: [mockTasks[0]],
      deleteTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskList />);

    // Initially on "All" tab: both tasks visible
    expect(screen.getByText("Pending Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();

    // Switch to Pending tab
    const pendingTab = screen.getByRole("tab", { name: /pending/i });
    fireEvent.click(pendingTab);
    expect(screen.getByText("Pending Task")).toBeInTheDocument();
    expect(screen.queryByText("Done Task")).not.toBeInTheDocument();

    // Switch to Done tab
    const doneTab = screen.getByRole("tab", { name: /done/i });
    fireEvent.click(doneTab);
    expect(screen.queryByText("Pending Task")).not.toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();

    // Switch back to All tab
    const allTab = screen.getByRole("tab", { name: /all/i });
    fireEvent.click(allTab);
    expect(screen.getByText("Pending Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });
});
