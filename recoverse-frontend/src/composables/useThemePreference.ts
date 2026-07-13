import { readonly, ref } from 'vue';
import { readLocalStorageValue, writeLocalStorageValue } from '../lib/safeLocalStorage';

const STORAGE_KEY = 'recoverse_theme_preference';
const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type AppliedTheme = Exclude<ThemePreference, 'system'>;

const themePreference = ref<ThemePreference>('system');
const appliedTheme = ref<AppliedTheme>('light');
let initialized = false;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getSystemTheme(): AppliedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference): AppliedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function applyTheme(preference: ThemePreference): void {
  if (typeof document === 'undefined') return;

  const nextTheme = resolveTheme(preference);
  appliedTheme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.dataset.themePreference = preference;
}

export function initThemePreference(): void {
  if (initialized) return;
  initialized = true;

  const stored = readLocalStorageValue(STORAGE_KEY);
  if (stored.ok && isThemePreference(stored.value)) {
    themePreference.value = stored.value;
  }

  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (themePreference.value === 'system') applyTheme(themePreference.value);
    });
  }

  applyTheme(themePreference.value);
}

export function setThemePreference(preference: ThemePreference): void {
  themePreference.value = preference;
  writeLocalStorageValue(STORAGE_KEY, preference);
  applyTheme(preference);
}

export function useThemePreference(): {
  readonly themePreference: Readonly<typeof themePreference>;
  readonly appliedTheme: Readonly<typeof appliedTheme>;
  readonly setThemePreference: (preference: ThemePreference) => void;
} {
  initThemePreference();

  return {
    themePreference: readonly(themePreference),
    appliedTheme: readonly(appliedTheme),
    setThemePreference,
  };
}
