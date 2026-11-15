import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadState,
  saveState,
  clearState,
  createInitialState,
  isValidAppState,
} from "./storage";
import { AppState, CURRENT_SCHEMA_VERSION } from "./types";

describe("lib/storage: Versioned localStorage wrapper (spec)", () => {
  const TEST_KEY = "test_spinthetodo_key";
  let storageMock: Record<string, string> = {};

  beforeEach(() => {
    storageMock = {};

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        storageMock[key] = val;
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
      clear: () => {
        storageMock = {};
      },
    });
  });

  it("returns initial empty state when storage is empty", () => {
    const state = loadState(TEST_KEY);
    expect(state).toEqual({
      tasks: [],
      ledger: [],
      activeTaskId: null,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  });

  it("safely recovers from corrupted, non-JSON strings in localStorage", () => {
    storageMock[TEST_KEY] = "{corrupt: true, malformed JSON...";
    const state = loadState(TEST_KEY);
    expect(state).toEqual(createInitialState());
  });

  it("safely recovers from invalid schema or missing arrays", () => {
    storageMock[TEST_KEY] = JSON.stringify({
      tasks: "not-an-array",
      schemaVersion: 1,
    });
    const state = loadState(TEST_KEY);
    expect(state).toEqual(createInitialState());
  });

  it("safely recovers from outdated/mismatched schema versions", () => {
    storageMock[TEST_KEY] = JSON.stringify({
      tasks: [],
      ledger: [],
      activeTaskId: null,
      schemaVersion: 999, // unknown future/legacy version
    });
    const state = loadState(TEST_KEY);
    expect(state).toEqual(createInitialState());
  });

  it("saves and retrieves a valid AppState", () => {
    const testState: AppState = {
      tasks: [
        {
          id: "t1",
          name: "Test task",
          durationMin: 25,
          points: 10,
          date: "2026-11-15",
          status: "pending",
          attempts: 0,
        },
      ],
      ledger: [
        {
          id: "l1",
          date: "2026-11-15",
          delta: 10,
          reason: "task_completed",
          taskId: "t1",
        },
      ],
      activeTaskId: null,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };

    const saved = saveState(testState, TEST_KEY);
    expect(saved).toBe(true);

    const loaded = loadState(TEST_KEY);
    expect(loaded).toEqual(testState);
  });

  it("clears state from localStorage without error", () => {
    storageMock[TEST_KEY] = JSON.stringify(createInitialState());
    expect(storageMock[TEST_KEY]).toBeDefined();

    clearState(TEST_KEY);
    expect(storageMock[TEST_KEY]).toBeUndefined();
  });

  it("handles storage write exceptions gracefully", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    });

    const success = saveState(createInitialState(), TEST_KEY);
    expect(success).toBe(false);
  });

  it("validates valid and invalid AppState objects via isValidAppState", () => {
    expect(isValidAppState(null)).toBe(false);
    expect(isValidAppState("string")).toBe(false);
    expect(isValidAppState({})).toBe(false);
    expect(isValidAppState({ tasks: [], ledger: [], schemaVersion: 1, activeTaskId: null })).toBe(true);
    expect(isValidAppState({ tasks: [], ledger: [], schemaVersion: 1, activeTaskId: "task-1" })).toBe(true);
    expect(isValidAppState({ tasks: [], ledger: [], schemaVersion: "one", activeTaskId: null })).toBe(false);
  });
});
