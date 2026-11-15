"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  useState,
} from "react";
import {
  Task,
  LedgerEntry,
  AppState,
  STORAGE_KEY,
} from "@/lib/types";
import {
  loadState,
  saveState,
  clearState,
  createInitialState,
} from "@/lib/storage";
import {
  todayLocal,
  tomorrowLocal,
} from "@/lib/date";
import {
  createTask,
  startTask,
  completeTask,
  markNotCompleted,
  canDeleteTask,
  pendingTasks as getPendingTasks,
  completedTasks as getCompletedTasks,
  failedTasks as getFailedTasks,
  tasksForDate,
  findExistingTaskForDate,
  isTaskAttempted,
} from "@/lib/tasks";
import {
  completionEntry,
  penaltyEntry,
  checkPerfectDayBonus,
  totalPoints as calcTotalPoints,
  pointsForDate,
  penaltiesForDate,
} from "@/lib/ledger";
import {
  currentStreak as calcCurrentStreak,
  longestStreak as calcLongestStreak,
} from "@/lib/streak";

// ==========================================
// External Store for SSR / Hydration Safety
// ==========================================

interface StoreSnapshot {
  appState: AppState;
  today: string;
  isHydrated: boolean;
}

let clientSnapshot: StoreSnapshot | null = null;
const storeListeners = new Set<() => void>();

function getClientSnapshot(): StoreSnapshot {
  if (typeof window === "undefined") {
    return {
      appState: createInitialState(),
      today: "",
      isHydrated: false,
    };
  }

  if (!clientSnapshot) {
    const loaded = loadState(STORAGE_KEY);
    const currentDate = todayLocal();
    const active = loaded.tasks.find(
      (t) => t.status === "active" && t.id === loaded.activeTaskId
    );
    clientSnapshot = {
      appState: {
        ...loaded,
        activeTaskId: active ? active.id : null,
      },
      today: currentDate,
      isHydrated: true,
    };
  }
  return clientSnapshot;
}

function notifyStoreListeners() {
  for (const listener of storeListeners) {
    listener();
  }
}

function updateGlobalAppState(newAppState: AppState) {
  const current = getClientSnapshot();
  clientSnapshot = {
    ...current,
    appState: newAppState,
  };
  saveState(newAppState, STORAGE_KEY);
  notifyStoreListeners();
}

function updateGlobalToday(newToday: string) {
  const current = getClientSnapshot();
  if (current.today !== newToday) {
    clientSnapshot = {
      ...current,
      today: newToday,
    };
    notifyStoreListeners();
  }
}

function subscribeToGlobalStore(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

const SERVER_SNAPSHOT: StoreSnapshot = {
  appState: createInitialState(),
  today: "",
  isHydrated: false,
};

// Setup browser listeners for midnight rollover and storage sync
if (typeof window !== "undefined") {
  const handleDateOrStorageChange = () => {
    const nowToday = todayLocal();
    updateGlobalToday(nowToday);
  };

  window.addEventListener("focus", handleDateOrStorageChange);
  document.addEventListener("visibilitychange", handleDateOrStorageChange);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      const reloaded = loadState(STORAGE_KEY);
      updateGlobalAppState(reloaded);
    }
  });
  setInterval(handleDateOrStorageChange, 15000);
}

// ==========================================
// Context & Hook Definition
// ==========================================

export interface AppStateContextValue {
  // State
  tasks: Task[];
  ledger: LedgerEntry[];
  activeTaskId: string | null;
  today: string;
  isHydrated: boolean;

  // Selectors for today
  todayTasks: Task[];
  pendingTasks: Task[];
  activeTask: Task | null;
  completedToday: Task[];
  failedToday: Task[];
  totalPoints: number;
  todayPoints: number;
  currentStreak: number;
  longestStreak: number;
  pendingPenaltiesTomorrow: LedgerEntry[];

  // Actions
  addTask: (
    name: string,
    durationMin: number,
    points: number
  ) => { success: boolean; error?: string; task?: Task };
  deleteTask: (taskId: string) => { success: boolean; error?: string };
  startTaskById: (taskId: string) => boolean;
  completeActiveTask: () => boolean;
  abandonActiveTask: (completed: boolean) => boolean;
  resetAllData: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({
  children,
  initialState,
  initialDate,
}: {
  children: React.ReactNode;
  initialState?: AppState;
  initialDate?: string;
}) {
  // If initialState or initialDate is explicitly provided (e.g. in test wrapper), use local state isolation
  const isCustomTestMode = initialState !== undefined || initialDate !== undefined;

  const [testTasks, setTestTasks] = useState<Task[]>(initialState?.tasks ?? []);
  const [testLedger, setTestLedger] = useState<LedgerEntry[]>(
    initialState?.ledger ?? []
  );
  const [testActiveTaskId, setTestActiveTaskId] = useState<string | null>(
    initialState?.activeTaskId ?? null
  );
  const [testToday] = useState<string>(
    () => initialDate ?? (isCustomTestMode ? todayLocal() : "")
  );

  // Use standard external store for production SSR / hydration safety
  const snapshot = useSyncExternalStore(
    subscribeToGlobalStore,
    getClientSnapshot,
    () => SERVER_SNAPSHOT
  );

  const tasks = isCustomTestMode ? testTasks : snapshot.appState.tasks;
  const ledger = isCustomTestMode ? testLedger : snapshot.appState.ledger;
  const activeTaskId = isCustomTestMode
    ? testActiveTaskId
    : snapshot.appState.activeTaskId;
  const today = isCustomTestMode ? testToday : snapshot.today;
  const isHydrated = isCustomTestMode ? true : snapshot.isHydrated;

  const commit = useCallback(
    (
      newTasks: Task[],
      newLedger: LedgerEntry[],
      newActiveTaskId: string | null
    ) => {
      const newState: AppState = {
        tasks: newTasks,
        ledger: newLedger,
        activeTaskId: newActiveTaskId,
        schemaVersion: 1,
      };

      if (isCustomTestMode) {
        setTestTasks(newTasks);
        setTestLedger(newLedger);
        setTestActiveTaskId(newActiveTaskId);
        saveState(newState, STORAGE_KEY);
      } else {
        updateGlobalAppState(newState);
      }
    },
    [isCustomTestMode]
  );

  // Actions
  const addTask = useCallback(
    (
      name: string,
      durationMin: number,
      points: number
    ): { success: boolean; error?: string; task?: Task } => {
      try {
        const taskDate = today || todayLocal();
        const existing = findExistingTaskForDate(tasks, name, taskDate);
        if (existing) {
          if (isTaskAttempted(existing)) {
            return {
              success: false,
              error: `Task "${existing.name}" has already been assigned and attempted for today`,
            };
          }
          return {
            success: false,
            error: `Task "${existing.name}" is already assigned for today`,
          };
        }

        const newTask = createTask(name, durationMin, points, taskDate);
        const updatedTasks = [...tasks, newTask];
        commit(updatedTasks, ledger, activeTaskId);
        return { success: true, task: newTask };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to create task",
        };
      }
    },
    [tasks, ledger, activeTaskId, today, commit]
  );

  const deleteTask = useCallback(
    (taskId: string): { success: boolean; error?: string } => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) {
        return { success: false, error: "Task not found" };
      }
      if (!canDeleteTask(target)) {
        return {
          success: false,
          error: "Only pending tasks can be deleted",
        };
      }

      const updatedTasks = tasks.filter((t) => t.id !== taskId);
      commit(updatedTasks, ledger, activeTaskId);
      return { success: true };
    },
    [tasks, ledger, activeTaskId, commit]
  );

  const startTaskById = useCallback(
    (taskId: string): boolean => {
      if (activeTaskId !== null) {
        return false;
      }

      const target = tasks.find((t) => t.id === taskId);
      if (!target || target.status !== "pending") {
        return false;
      }

      try {
        const started = startTask(target, Date.now());
        const updatedTasks = tasks.map((t) => (t.id === taskId ? started : t));
        commit(updatedTasks, ledger, started.id);
        return true;
      } catch {
        return false;
      }
    },
    [tasks, ledger, activeTaskId, commit]
  );

  const completeActiveTask = useCallback((): boolean => {
    if (!activeTaskId) return false;

    const currentActive = tasks.find((t) => t.id === activeTaskId);
    if (!currentActive || currentActive.status !== "active") return false;

    try {
      const taskDate = today || todayLocal();
      const finished = completeTask(currentActive, Date.now());
      const updatedTasks = tasks.map((t) =>
        t.id === activeTaskId ? finished : t
      );

      const entry = completionEntry(finished, taskDate);
      let updatedLedger = [...ledger, entry];

      const perfectDayBonus = checkPerfectDayBonus(
        updatedTasks,
        updatedLedger,
        taskDate
      );
      if (perfectDayBonus) {
        updatedLedger = [...updatedLedger, perfectDayBonus];
      }

      commit(updatedTasks, updatedLedger, null);
      return true;
    } catch {
      return false;
    }
  }, [tasks, ledger, activeTaskId, today, commit]);

  const abandonActiveTask = useCallback(
    (completed: boolean): boolean => {
      if (completed) {
        return completeActiveTask();
      }

      if (!activeTaskId) return false;

      const currentActive = tasks.find((t) => t.id === activeTaskId);
      if (!currentActive || currentActive.status !== "active") return false;

      try {
        const taskDate = today || todayLocal();
        const { updatedTask, didFail } = markNotCompleted(currentActive);
        const updatedTasks = tasks.map((t) =>
          t.id === activeTaskId ? updatedTask : t
        );

        let updatedLedger = ledger;

        if (didFail) {
          const penalty = penaltyEntry(updatedTask, tomorrowLocal(taskDate));
          updatedLedger = [...ledger, penalty];
        }

        commit(updatedTasks, updatedLedger, null);
        return true;
      } catch {
        return false;
      }
    },
    [activeTaskId, tasks, ledger, today, commit, completeActiveTask]
  );

  const resetAllData = useCallback(() => {
    clearState(STORAGE_KEY);
    clientSnapshot = null;
    commit([], [], null);
  }, [commit]);

  // Derived selectors
  const todayTasksList = useMemo(
    () => (today ? tasksForDate(tasks, today) : []),
    [tasks, today]
  );
  const pendingTasksList = useMemo(
    () => (today ? getPendingTasks(tasks, today) : []),
    [tasks, today]
  );
  const currentActiveTask = useMemo(
    () => (activeTaskId ? tasks.find((t) => t.id === activeTaskId) ?? null : null),
    [tasks, activeTaskId]
  );
  const completedTodayList = useMemo(
    () => (today ? getCompletedTasks(tasks, today) : []),
    [tasks, today]
  );
  const failedTodayList = useMemo(
    () => (today ? getFailedTasks(tasks, today) : []),
    [tasks, today]
  );
  const totalPointsValue = useMemo(() => calcTotalPoints(ledger), [ledger]);
  const todayPointsValue = useMemo(
    () => (today ? pointsForDate(ledger, today) : 0),
    [ledger, today]
  );
  const currentStreakValue = useMemo(
    () => (today ? calcCurrentStreak(tasks, today) : 0),
    [tasks, today]
  );
  const longestStreakValue = useMemo(() => calcLongestStreak(tasks), [tasks]);
  const pendingPenalties = useMemo(
    () => (today ? penaltiesForDate(ledger, tomorrowLocal(today)) : []),
    [ledger, today]
  );

  const value: AppStateContextValue = useMemo(
    () => ({
      tasks,
      ledger,
      activeTaskId,
      today,
      isHydrated,
      todayTasks: todayTasksList,
      pendingTasks: pendingTasksList,
      activeTask: currentActiveTask,
      completedToday: completedTodayList,
      failedToday: failedTodayList,
      totalPoints: totalPointsValue,
      todayPoints: todayPointsValue,
      currentStreak: currentStreakValue,
      longestStreak: longestStreakValue,
      pendingPenaltiesTomorrow: pendingPenalties,
      addTask,
      deleteTask,
      startTaskById,
      completeActiveTask,
      abandonActiveTask,
      resetAllData,
    }),
    [
      tasks,
      ledger,
      activeTaskId,
      today,
      isHydrated,
      todayTasksList,
      pendingTasksList,
      currentActiveTask,
      completedTodayList,
      failedTodayList,
      totalPointsValue,
      todayPointsValue,
      currentStreakValue,
      longestStreakValue,
      pendingPenalties,
      addTask,
      deleteTask,
      startTaskById,
      completeActiveTask,
      abandonActiveTask,
      resetAllData,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
