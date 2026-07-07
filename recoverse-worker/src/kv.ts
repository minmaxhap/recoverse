/** KV 키 레이아웃 + 헬퍼. 모든 세션 키는 24시간 TTL. */

export const SESSION_TTL_SECONDS = 86400;

export interface Env {
  SESSIONS: KVNamespace;
  // 프로덕션에서만 바인딩됨 (dev/test에서는 undefined일 수 있음)
  ASSETS?: Fetcher;
}

export const keys = {
  meta: (code: string) => `session:${code}:meta`,
  participantPrefix: (code: string) => `session:${code}:p:`,
  participant: (code: string, joinedAt: string, name: string) =>
    `session:${code}:p:${joinedAt}~${name}`,
  answerPrefix: (code: string, roundIdx: number) => `session:${code}:r:${roundIdx}:a:`,
  answer: (code: string, roundIdx: number, name: string) =>
    `session:${code}:r:${roundIdx}:a:${name}`,
  guessPrefix: (code: string, roundIdx: number) => `session:${code}:r:${roundIdx}:g:`,
  guess: (code: string, roundIdx: number, name: string) =>
    `session:${code}:r:${roundIdx}:g:${name}`,
  revealed: (code: string, roundIdx: number) => `session:${code}:r:${roundIdx}:revealed`,
  // 지난 라운드 추측 누적 (호스트가 next/end 시점에만 기록 — 단일 작성자라 안전)
  pastGuesses: (code: string) => `session:${code}:pastGuesses`,
};

export async function kvGetJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvPutJson(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(value), { expirationTtl: SESSION_TTL_SECONDS });
}

/** prefix 아래 모든 키 나열 (세션 규모가 작아 단일 페이지로 충분하지만 커서 루프로 안전하게) */
export async function kvListKeys(kv: KVNamespace, prefix: string): Promise<string[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await kv.list({ prefix, cursor });
    for (const k of page.keys) names.push(k.name);
    if (page.list_complete) break;
    cursor = page.cursor;
  }
  return names;
}

/**
 * 참여자 목록 — 합류 순.
 * 키가 `p:{joinedAt}~{name}` 이므로 키 사전순 = joinedAt 순 (joinedAt은 고정폭 타임스탬프).
 */
export async function listPlayers(kv: KVNamespace, code: string): Promise<string[]> {
  const prefix = keys.participantPrefix(code);
  const names = await kvListKeys(kv, prefix);
  return names
    .map((k) => k.slice(prefix.length))
    .sort()
    .map((entry) => entry.split('~').slice(1).join('~'));
}
