import { readLocalStorageValue, writeLocalStorageValue } from "./safeLocalStorage";

export const THEME_STORAGE_KEY = "recoverse_theme";

export type StoredRecoverseTheme = "book" | "letter" | "journey";

function readPreference(key: string): string | null {
  const result = readLocalStorageValue(key);
  return result.ok ? result.value : null;
}

export function loadPreferredTheme(): StoredRecoverseTheme {
  const savedTheme = readPreference(THEME_STORAGE_KEY);
  return savedTheme === "letter" || savedTheme === "journey" || savedTheme === "book" ? savedTheme : "book";
}

export function savePreferredTheme(theme: StoredRecoverseTheme): boolean {
  return writeLocalStorageValue(THEME_STORAGE_KEY, theme).ok;
}