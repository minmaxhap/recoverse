import type { Reflection } from "../types/reflection";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const REDISCOVER_THRESHOLD_DAYS = 7;

export type RediscoveryWindow = "year" | "month" | "week";

export interface RediscoveryPick {
  reflection: Reflection;
  window: RediscoveryWindow;
  daysAgo: number;
}

function hasAnswer(reflection: Reflection): boolean {
  return reflection.answers.some((answer) => answer.value.trim().length > 0);
}

function daysBetween(now: number, iso: string): number {
  return Math.floor((now - Date.parse(iso)) / MS_PER_DAY);
}

function localDayKey(now: number): string {
  // Local date key (sv-SE → YYYY-MM-DD), so the daily rotation flips at the user's midnight.
  return new Date(now).toLocaleDateString("sv-SE");
}

function dailySeed(now: number): number {
  const key = localDayKey(now);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function classifyWindow(daysAgo: number): RediscoveryWindow {
  if (daysAgo >= 330) return "year";
  if (daysAgo >= 25) return "month";
  return "week";
}

/**
 * Pick today's rediscovery memory: prefer the largest "ago" bucket
 * (1 year > 1 month > 1 week), then rotate inside the bucket by date seed
 * so the user sees a different memory each day.
 */
export function pickRediscovery(
  reflections: readonly Reflection[],
  now: number = Date.now()
): RediscoveryPick | null {
  const eligible = reflections
    .filter(hasAnswer)
    .map((reflection) => ({ reflection, daysAgo: daysBetween(now, reflection.updatedAt) }))
    .filter((item) => item.daysAgo >= REDISCOVER_THRESHOLD_DAYS);

  if (eligible.length === 0) return null;

  const byWindow = new Map<RediscoveryWindow, typeof eligible>();
  for (const item of eligible) {
    const window = classifyWindow(item.daysAgo);
    byWindow.set(window, [...(byWindow.get(window) ?? []), item]);
  }

  const order: RediscoveryWindow[] = ["year", "month", "week"];
  const seed = dailySeed(now);

  for (const window of order) {
    const bucket = byWindow.get(window);
    if (!bucket || bucket.length === 0) continue;
    const sorted = [...bucket].sort((a, b) => b.daysAgo - a.daysAgo);
    const picked = sorted[seed % sorted.length];
    return { reflection: picked.reflection, window, daysAgo: picked.daysAgo };
  }

  return null;
}

export function describeWindow(window: RediscoveryWindow): string {
  if (window === "year") return "1년 전";
  if (window === "month") return "한 달 전";
  return "지난주";
}
