/**
 * Core domain types and constants for Spin the Wheel Todo
 * Based on the spec and design_todo.md
 */

export type TaskStatus = 'pending' | 'active' | 'done' | 'failed';

export interface Task {
  id: string;
  name: string;
  durationMin: number; // 1 to 240
  points: number;      // integer >= 0
  date: string;        // local YYYY-MM-DD
  status: TaskStatus;
  attempts: number;    // 0, 1, or 2
  startedAt?: number;  // timestamp (ms) when active
  completedAt?: number;// timestamp (ms) when done
}

export type LedgerReason = 'task_completed' | 'task_penalty' | 'perfect_day_bonus';

export interface LedgerEntry {
  id: string;
  date: string;        // local YYYY-MM-DD (e.g. today for completion/bonus, tomorrow for penalty)
  delta: number;       // positive for completion/bonus, negative for penalty
  reason: LedgerReason;
  taskId?: string;     // associated task if applicable
}

export interface AppState {
  tasks: Task[];
  ledger: LedgerEntry[];
  activeTaskId: string | null;
  schemaVersion: number;
}

export const PERFECT_DAY_BONUS = 50;
export const MAX_TASK_ATTEMPTS = 2;
export const CURRENT_SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'spinthetodo_state_v1';

/**
 * 6-color sticker palette from design_todo.md:
 * - Electric Blue (#4da2ff)
 * - Mint Pop (#55db9c)
 * - Lavender (#e9ccff)
 * - Ember (#fb4903)
 * - Sunburst (#ffd731)
 * - Voltage Violet (#5c4ade)
 */
export const WHEEL_PALETTE = [
  '#4da2ff', // Electric Blue
  '#55db9c', // Mint Pop
  '#e9ccff', // Lavender
  '#fb4903', // Ember
  '#ffd731', // Sunburst
  '#5c4ade', // Voltage Violet
] as const;

export const DESIGN_TOKENS = {
  colors: {
    carbon: '#000000',
    paperWhite: '#ffffff',
    skyWash: '#dceeff',
    concreteGray: '#cccccc',
    softMist: '#e9e9e9',
    electricBlue: '#4da2ff',
    mintPop: '#55db9c',
    lavender: '#e9ccff',
    ember: '#fb4903',
    sunburst: '#ffd731',
    voltageViolet: '#5c4ade',
  },
  radii: {
    cards: '20px',
    cardsElevated: '40px',
    body: '30px',
    pills: '1600px',
    nav: '1600px',
    buttons: '1600px',
    walletIcon: '16px',
  },
} as const;
