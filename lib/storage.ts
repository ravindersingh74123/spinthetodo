/**
 * Versioned localStorage persistence wrapper for Spin the Wheel Todo.
 *
 * Ground rules:
 * - SSR safe: never accesses window/localStorage during server rendering.
 * - Defensive: handles corrupt JSON, missing properties, QuotaExceededError,
 *   and schema version mismatches by falling back to safe initial state.
 * - Pure wrapper with full try/catch boundaries.
 */

import { AppState, CURRENT_SCHEMA_VERSION, STORAGE_KEY } from "./types";

/**
 * Creates a clean, empty AppState.
 */
export function createInitialState(): AppState {
  return {
    tasks: [],
    ledger: [],
    activeTaskId: null,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

/**
 * Validates that an unknown object conforms to the AppState contract.
 */
export function isValidAppState(data: unknown): data is AppState {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  if (typeof candidate.schemaVersion !== "number") {
    return false;
  }

  if (!Array.isArray(candidate.tasks)) {
    return false;
  }

  if (!Array.isArray(candidate.ledger)) {
    return false;
  }

  if (
    candidate.activeTaskId !== null &&
    typeof candidate.activeTaskId !== "string"
  ) {
    return false;
  }

  return true;
}

/**
 * Loads state from localStorage.
 * Returns initial state if:
 * - Running in SSR (no window)
 * - Storage is empty
 * - JSON is corrupted
 * - Schema validation fails
 * - Storage read throws an error
 */
export function loadState(storageKey: string = STORAGE_KEY): AppState {
  if (typeof window === "undefined" || !window.localStorage) {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw);

    if (!isValidAppState(parsed)) {
      console.warn(
        `[Storage] Stored data at '${storageKey}' failed schema validation. Falling back to clean state.`
      );
      return createInitialState();
    }

    // Version migration hook: currently version 1
    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      console.warn(
        `[Storage] Schema version mismatch (stored: ${parsed.schemaVersion}, current: ${CURRENT_SCHEMA_VERSION}). Resetting.`
      );
      return createInitialState();
    }

    return parsed;
  } catch (error) {
    console.error(`[Storage] Failed to read or parse localStorage at '${storageKey}':`, error);
    return createInitialState();
  }
}

/**
 * Saves state to localStorage.
 * Returns true if successful, false if save threw or failed.
 */
export function saveState(
  state: AppState,
  storageKey: string = STORAGE_KEY
): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    const dataToSave: AppState = {
      ...state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to save state to localStorage at '${storageKey}':`, error);
    return false;
  }
}

/**
 * Clears stored state from localStorage.
 */
export function clearState(storageKey: string = STORAGE_KEY): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`[Storage] Failed to clear localStorage at '${storageKey}':`, error);
  }
}
