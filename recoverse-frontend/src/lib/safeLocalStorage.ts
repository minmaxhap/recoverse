export type StorageReadFailureReason = "read_failed" | "storage_unavailable";
export type StorageWriteFailureReason = "write_failed" | "storage_unavailable";

export type StorageReadResult =
  | { readonly ok: true; readonly value: string | null }
  | { readonly ok: false; readonly reason: StorageReadFailureReason };

export type StorageWriteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: StorageWriteFailureReason };

function storageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

export function readLocalStorageValue(key: string): StorageReadResult {
  if (!storageAvailable()) return { ok: false, reason: "storage_unavailable" };

  try {
    return { ok: true, value: localStorage.getItem(key) };
  } catch {
    return { ok: false, reason: "read_failed" };
  }
}

export function listLocalStorageKeys(): readonly string[] {
  if (!storageAvailable()) return [];

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key != null) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

export function writeLocalStorageValue(key: string, value: string): StorageWriteResult {
  if (!storageAvailable()) return { ok: false, reason: "storage_unavailable" };

  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch {
    return { ok: false, reason: "write_failed" };
  }
}