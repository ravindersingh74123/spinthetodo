"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAppState } from "@/store/useAppState";
import {
  validateTaskInput,
  DEFAULT_TASK_PRESETS,
  DefaultTaskPreset,
  findExistingTaskForDate,
  isTaskAttempted,
} from "@/lib/tasks";

export default function TaskForm() {
  const { addTask, todayTasks = [], today = "" } = useAppState();

  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState<number | "">(25);
  const [points, setPoints] = useState<number | "">(10);

  const [errors, setErrors] = useState<{
    name?: string;
    durationMin?: string;
    points?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPresets = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return DEFAULT_TASK_PRESETS;
    return DEFAULT_TASK_PRESETS.filter((preset) =>
      preset.name.toLowerCase().includes(q)
    );
  }, [name]);

  const selectPreset = (preset: DefaultTaskPreset) => {
    const existing = findExistingTaskForDate(todayTasks, preset.name, today);
    if (existing) {
      if (isTaskAttempted(existing)) {
        setErrors((prev) => ({
          ...prev,
          name: `Task "${existing.name}" has already been assigned and attempted for today`,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          name: `Task "${existing.name}" is already assigned for today`,
        }));
      }
      return;
    }

    setName(preset.name);
    setDurationMin(preset.durationMin);
    setPoints(preset.points);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    setErrors((prev) => ({
      ...prev,
      name: undefined,
      durationMin: undefined,
      points: undefined,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || filteredPresets.length === 0) {
      if (e.key === "ArrowDown") {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredPresets.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredPresets.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = filteredPresets[highlightedIndex];
      if (selected) {
        selectPreset(selected);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);

    const durationNum = durationMin === "" ? NaN : Number(durationMin);
    const pointsNum = points === "" ? NaN : Number(points);

    const validation = validateTaskInput(name, durationNum, pointsNum);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if task is already assigned / attempted for today
    const existing = findExistingTaskForDate(todayTasks, name, today);
    if (existing) {
      if (isTaskAttempted(existing)) {
        setErrors({
          name: `Task "${existing.name}" has already been assigned and attempted for today`,
        });
      } else {
        setErrors({
          name: `Task "${existing.name}" is already assigned for today`,
        });
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = addTask(name, durationNum, pointsNum);
    setIsSubmitting(false);

    if (result.success) {
      setName("");
      // Retain or reset default duration & points for rapid task entry
      setDurationMin(25);
      setPoints(10);
    } else if (result.error) {
      setErrors({ name: result.error });
    }
  };

  return (
    <div className="p-1 sm:p-2 select-none">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-carbon/20">
        <h2 className="text-sm font-extrabold tracking-[0.032em] uppercase text-carbon">
          Add Task
        </h2>
        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border border-carbon bg-lavender text-carbon">
          Today Only
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Task Name with Dropdown */}
        <div ref={dropdownRef} className="relative">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="task-name"
              className="block text-xs font-bold uppercase tracking-[0.032em] text-carbon"
            >
              Task Name
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="text-[10px] font-bold text-carbon/60 hover:text-carbon flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Default tasks</span>
              <span className={`text-[9px] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
          </div>
          <div className="relative">
            <input
              id="task-name"
              type="text"
              value={name}
              autoComplete="off"
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setName(e.target.value);
                setIsDropdownOpen(true);
                setHighlightedIndex(-1);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g., Gym, Clean your room, Drink water..."
              className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-[16px] border bg-paper-white text-carbon focus:outline-none focus:ring-2 focus:ring-carbon ${
                errors.name ? "border-ember" : "border-carbon"
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-[11px] font-bold text-ember" role="alert">
              {errors.name}
            </p>
          )}

          {/* Suggestions Dropdown */}
          {isDropdownOpen && filteredPresets.length > 0 && (
            <div
              role="listbox"
              aria-label="Default tasks"
              className="absolute z-30 left-0 right-0 mt-1.5 bg-paper-white border border-carbon rounded-[16px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] overflow-hidden divide-y divide-carbon/10"
            >
              <div className="px-3 py-1.5 bg-soft-mist/70 text-[10px] font-extrabold uppercase tracking-wider text-carbon/70 flex items-center justify-between">
                <span>Default Tasks</span>
                <span className="text-[10px] font-bold text-carbon/70">🎵 Audio track</span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filteredPresets.map((preset, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const existing = findExistingTaskForDate(todayTasks, preset.name, today);
                  const isAttempted = existing ? isTaskAttempted(existing) : false;
                  const isAlreadyAdded = Boolean(existing);

                  return (
                    <button
                      key={preset.name}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      aria-disabled={isAlreadyAdded}
                      disabled={isAlreadyAdded}
                      onMouseEnter={() => !isAlreadyAdded && setHighlightedIndex(idx)}
                      onClick={() => !isAlreadyAdded && selectPreset(preset)}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors ${
                        isAlreadyAdded
                          ? "opacity-60 bg-neutral-100/70 cursor-not-allowed"
                          : isHighlighted
                          ? "bg-sand/30 cursor-pointer"
                          : "hover:bg-soft-mist cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold capitalize ${isAlreadyAdded ? "text-carbon/60 line-through" : "text-carbon"}`}>
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-medium text-carbon/50 px-1.5 py-0.5 rounded-full bg-carbon/5 border border-carbon/10">
                          {preset.category}
                        </span>
                      </div>
                      {isAlreadyAdded ? (
                        <span className="text-[10px] font-bold rounded-full border border-carbon/20 bg-neutral-200/80 px-2 py-0.5 text-carbon/70">
                          {isAttempted ? "Attempted today" : "On wheel"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold rounded-full border border-carbon/30 bg-paper-white px-2 py-0.5 text-carbon">
                          {preset.durationMin}m • +{preset.points}p
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Duration & Points grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Duration in Minutes */}
          <div>
            <label
              htmlFor="task-duration"
              className="block text-xs font-bold uppercase tracking-[0.032em] text-carbon mb-1"
            >
              Time Limit (Min)
            </label>
            <input
              id="task-duration"
              type="number"
              min={1}
              max={240}
              step={1}
              value={durationMin}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setDurationMin(val);
                if (errors.durationMin) {
                  setErrors((prev) => ({ ...prev, durationMin: undefined }));
                }
              }}
              placeholder="1–240"
              className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-[16px] border bg-paper-white text-carbon focus:outline-none focus:ring-2 focus:ring-carbon ${
                errors.durationMin ? "border-ember" : "border-carbon"
              }`}
            />
            {errors.durationMin && (
              <p className="mt-1 text-[11px] font-bold text-ember" role="alert">
                {errors.durationMin}
              </p>
            )}
            {/* Quick duration presets */}
            <div className="flex gap-1.5 mt-2">
              {[15, 25, 45].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDurationMin(preset);
                    if (errors.durationMin) {
                      setErrors((prev) => ({ ...prev, durationMin: undefined }));
                    }
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border border-carbon ${
                    durationMin === preset
                      ? "bg-carbon text-paper-white"
                      : "bg-paper-white text-carbon hover:bg-soft-mist"
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Points */}
          <div>
            <label
              htmlFor="task-points"
              className="block text-xs font-bold uppercase tracking-[0.032em] text-carbon mb-1"
            >
              Points (≥ 0)
            </label>
            <input
              id="task-points"
              type="number"
              min={0}
              step={1}
              value={points}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setPoints(val);
                if (errors.points) {
                  setErrors((prev) => ({ ...prev, points: undefined }));
                }
              }}
              placeholder="0+"
              className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-[16px] border bg-paper-white text-carbon focus:outline-none focus:ring-2 focus:ring-carbon ${
                errors.points ? "border-ember" : "border-carbon"
              }`}
            />
            {errors.points && (
              <p className="mt-1 text-[11px] font-bold text-ember" role="alert">
                {errors.points}
              </p>
            )}
            {/* Quick points presets */}
            <div className="flex gap-1.5 mt-2">
              {[5, 10, 25].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setPoints(preset);
                    if (errors.points) {
                      setErrors((prev) => ({ ...prev, points: undefined }));
                    }
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border border-carbon ${
                    points === preset
                      ? "bg-carbon text-paper-white"
                      : "bg-paper-white text-carbon hover:bg-soft-mist"
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button: Filled CTA style per design_todo.md */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 rounded-full border border-carbon bg-carbon text-paper-white text-xs font-bold uppercase tracking-[0.032em] hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          + Add to Wheel
        </button>
      </form>
    </div>
  );
}
