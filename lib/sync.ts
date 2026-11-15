import { AppState } from "./types";

export const SYNC_CODE_STORAGE_KEY = "spintodo_sync_code";
export const LAST_SYNCED_STORAGE_KEY = "spintodo_last_synced";

export function generateSyncCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SPIN-${suffix}`;
}

export function getStoredSyncCode(): string {
  if (typeof window === "undefined") return "";
  let code = localStorage.getItem(SYNC_CODE_STORAGE_KEY);
  if (!code) {
    code = generateSyncCode();
    localStorage.setItem(SYNC_CODE_STORAGE_KEY, code);
  }
  return code;
}

export function setStoredSyncCode(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SYNC_CODE_STORAGE_KEY, code.trim().toUpperCase());
}

export interface SyncResult {
  success: boolean;
  state?: AppState;
  updatedAt?: number;
  notConfigured?: boolean;
  notFound?: boolean;
  error?: string;
}

export async function fetchRemoteState(syncCode: string): Promise<SyncResult> {
  try {
    const res = await fetch(`/api/sync?code=${encodeURIComponent(syncCode.trim().toUpperCase())}`);
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error syncing with cloud",
    };
  }
}

export async function pushLocalState(
  syncCode: string,
  state: AppState
): Promise<SyncResult> {
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        syncCode: syncCode.trim().toUpperCase(),
        state,
        updatedAt: Date.now(),
      }),
    });
    const data = await res.json();
    if (data.success && typeof window !== "undefined") {
      localStorage.setItem(LAST_SYNCED_STORAGE_KEY, String(Date.now()));
    }
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error syncing with cloud",
    };
  }
}
