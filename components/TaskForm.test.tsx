import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskForm from "./TaskForm";
import * as AppStateModule from "@/store/useAppState";

describe("components/TaskForm (spec)", () => {
  it("renders form fields and presets with design tokens", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      addTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskForm />);

    expect(screen.getByLabelText(/task name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time limit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/points/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ add to wheel/i })).toBeInTheDocument();

    // Check preset buttons
    expect(screen.getByRole("button", { name: "15m" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "25m" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+10" })).toBeInTheDocument();
  });

  it("shows inline error when submitting with empty task name", () => {
    const mockAddTask = vi.fn();
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      addTask: mockAddTask,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskForm />);

    const submitBtn = screen.getByRole("button", { name: /\+ add to wheel/i });
    fireEvent.click(submitBtn);

    expect(mockAddTask).not.toHaveBeenCalled();
    expect(screen.getByText(/task name cannot be empty/i)).toBeInTheDocument();
  });

  it("shows inline error for invalid duration", () => {
    const mockAddTask = vi.fn();
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      addTask: mockAddTask,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskForm />);

    const nameInput = screen.getByLabelText(/task name/i);
    const durationInput = screen.getByLabelText(/time limit/i);

    fireEvent.change(nameInput, { target: { value: "Valid Task" } });
    fireEvent.change(durationInput, { target: { value: "300" } }); // > 240

    fireEvent.click(screen.getByRole("button", { name: /\+ add to wheel/i }));

    expect(mockAddTask).not.toHaveBeenCalled();
    expect(
      screen.getByText(/duration must be an integer between 1 and 240/i)
    ).toBeInTheDocument();
  });

  it("successfully calls addTask and clears name input on valid submission", () => {
    const mockAddTask = vi.fn().mockReturnValue({ success: true });
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      addTask: mockAddTask,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskForm />);

    const nameInput = screen.getByLabelText(/task name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Write specification" } });

    fireEvent.click(screen.getByRole("button", { name: /\+ add to wheel/i }));

    expect(mockAddTask).toHaveBeenCalledWith("Write specification", 25, 10);
    expect(nameInput.value).toBe("");
  });

  it("shows dropdown with default task options on focus and allows selecting a task", () => {
    const mockAddTask = vi.fn().mockReturnValue({ success: true });
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      addTask: mockAddTask,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskForm />);

    const nameInput = screen.getByLabelText(/task name/i) as HTMLInputElement;
    fireEvent.focus(nameInput);

    // Dropdown list should be open
    expect(screen.getByRole("listbox", { name: /default tasks/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /gym/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /clean your room/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /drink water/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /dsa/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /read book/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /journal/i })).toBeInTheDocument();

    // Click "gym" option
    fireEvent.click(screen.getByRole("option", { name: /gym/i }));

    // Input should be updated
    expect(nameInput.value).toBe("gym");
    const durationInput = screen.getByLabelText(/time limit/i) as HTMLInputElement;
    const pointsInput = screen.getByLabelText(/points/i) as HTMLInputElement;
    expect(durationInput.value).toBe("60");
    expect(pointsInput.value).toBe("30");

    // Dropdown should now be closed
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("filters default tasks based on user typing in task name", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      addTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskForm />);

    const nameInput = screen.getByLabelText(/task name/i);
    fireEvent.change(nameInput, { target: { value: "water" } });

    expect(screen.getByRole("option", { name: /drink water/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /gym/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /dsa/i })).not.toBeInTheDocument();
  });

  it("disables dropdown option and blocks submission if task was already assigned and attempted today", () => {
    const mockAddTask = vi.fn();
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      addTask: mockAddTask,
      today: "2026-11-15",
      todayTasks: [
        {
          id: "gym-1",
          name: "gym",
          durationMin: 60,
          points: 30,
          date: "2026-11-15",
          status: "done",
          attempts: 1,
        },
      ],
    } as unknown as AppStateModule.AppStateContextValue);

    render(<TaskForm />);

    const nameInput = screen.getByLabelText(/task name/i);
    fireEvent.focus(nameInput);

    // Gym option should be disabled and show "Attempted today"
    const gymOption = screen.getByRole("option", { name: /gym/i });
    expect(gymOption).toHaveAttribute("aria-disabled", "true");
    expect(gymOption).toHaveTextContent(/attempted today/i);

    // Typing "gym" manually and submitting should be blocked
    fireEvent.change(nameInput, { target: { value: "gym" } });
    fireEvent.click(screen.getByRole("button", { name: /\+ add to wheel/i }));

    expect(mockAddTask).not.toHaveBeenCalled();
    expect(screen.getByText(/already been assigned and attempted for today/i)).toBeInTheDocument();
  });
});
