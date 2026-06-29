import { readLocalStorageValue, writeLocalStorageValue } from "./safeLocalStorage";

const STORAGE_KEY = "recoverse_telemetry_v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface TelemetryState {
  totalSessions: number;
  totalAnswers: number;
  firstSeenIso: string;
  lastSeenIso: string;
  currentStreak: number;
  longestStreak: number;
}

function emptyState(now: Date): TelemetryState {
  const iso = now.toISOString();
  return {
    totalSessions: 0,
    totalAnswers: 0,
    firstSeenIso: iso,
    lastSeenIso: iso,
    currentStreak: 0,
    longestStreak: 0,
  };
}

function safeParse(value: string | null): TelemetryState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      totalSessions: Number.isFinite(parsed.totalSessions) ? parsed.totalSessions : 0,
      totalAnswers: Number.isFinite(parsed.totalAnswers) ? parsed.totalAnswers : 0,
      firstSeenIso: typeof parsed.firstSeenIso === "string" ? parsed.firstSeenIso : new Date().toISOString(),
      lastSeenIso: typeof parsed.lastSeenIso === "string" ? parsed.lastSeenIso : new Date().toISOString(),
      currentStreak: Number.isFinite(parsed.currentStreak) ? parsed.currentStreak : 0,
      longestStreak: Number.isFinite(parsed.longestStreak) ? parsed.longestStreak : 0,
    };
  } catch {
    return null;
  }
}

function loadState(now: Date): TelemetryState {
  const stored = readLocalStorageValue(STORAGE_KEY);
  if (!stored.ok) return emptyState(now);
  return safeParse(stored.value) ?? emptyState(now);
}

function persist(state: TelemetryState): void {
  writeLocalStorageValue(STORAGE_KEY, JSON.stringify(state));
}

function localDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE");
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(localDayKey(aIso));
  const b = new Date(localDayKey(bIso));
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/**
 * Record an app open as a "session" — at most one session per local day.
 * Updates streak based on whether the previous session was the day before.
 */
export function recordSession(now: Date = new Date()): TelemetryState {
  const state = loadState(now);
  const nowIso = now.toISOString();
  const lastDay = localDayKey(state.lastSeenIso);
  const todayDay = localDayKey(nowIso);

  if (todayDay === lastDay && state.totalSessions > 0) {
    state.lastSeenIso = nowIso;
    persist(state);
    return state;
  }

  const gap = daysBetween(nowIso, state.lastSeenIso);
  if (state.totalSessions === 0) {
    state.currentStreak = 1;
    state.firstSeenIso = nowIso;
  } else if (gap === 1) {
    state.currentStreak += 1;
  } else if (gap > 1) {
    state.currentStreak = 1;
  }

  state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
  state.totalSessions += 1;
  state.lastSeenIso = nowIso;
  persist(state);
  return state;
}

export function recordAnswer(now: Date = new Date()): TelemetryState {
  const state = loadState(now);
  state.totalAnswers += 1;
  state.lastSeenIso = now.toISOString();
  persist(state);
  return state;
}

export function loadTelemetry(now: Date = new Date()): TelemetryState {
  return loadState(now);
}

export function resetTelemetry(): void {
  writeLocalStorageValue(STORAGE_KEY, JSON.stringify(emptyState(new Date())));
}

export function describeTelemetry(state: TelemetryState, now: Date = new Date()): {
  daysSinceFirst: number;
  daysSinceLast: number;
} {
  const firstDay = new Date(localDayKey(state.firstSeenIso));
  const lastDay = new Date(localDayKey(state.lastSeenIso));
  const today = new Date(localDayKey(now.toISOString()));
  return {
    daysSinceFirst: Math.max(0, Math.round((today.getTime() - firstDay.getTime()) / MS_PER_DAY)),
    daysSinceLast: Math.max(0, Math.round((today.getTime() - lastDay.getTime()) / MS_PER_DAY)),
  };
}
