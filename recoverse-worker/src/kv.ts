export const SESSION_TTL_SECONDS = 86400;
export const SHARE_TTL_SECONDS = 180 * 86400;

export interface Env {
  SESSIONS: KVNamespace;
  DB: D1Database;
  ADMIN_TOKEN?: string;
  ASSETS?: Fetcher;
}

export const keys = {
  meta: (code: string) => `session:${code}:meta`,
  participantPrefix: (code: string) => `session:${code}:p:`,
  participant: (code: string, joinedAt: string, name: string) =>
    `session:${code}:p:${joinedAt}~${name}`,
  playerToken: (code: string, name: string) => `session:${code}:token:${name}`,
  answerPrefix: (code: string, roundIdx: number) => `session:${code}:r:${roundIdx}:a:`,
  answer: (code: string, roundIdx: number, name: string) =>
    `session:${code}:r:${roundIdx}:a:${name}`,
  guessPrefix: (code: string, roundIdx: number) => `session:${code}:r:${roundIdx}:g:`,
  guess: (code: string, roundIdx: number, name: string) =>
    `session:${code}:r:${roundIdx}:g:${name}`,
  revealed: (code: string, roundIdx: number) => `session:${code}:r:${roundIdx}:revealed`,
  pastGuesses: (code: string) => `session:${code}:pastGuesses`,
  share: (shareId: string) => `share:${shareId}`,
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

export async function kvPutJson(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<void> {
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
}

export async function kvPutString(kv: KVNamespace, key: string, value: string): Promise<void> {
  await kv.put(key, value, { expirationTtl: SESSION_TTL_SECONDS });
}

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

export async function listPlayers(kv: KVNamespace, code: string): Promise<string[]> {
  const prefix = keys.participantPrefix(code);
  const names = await kvListKeys(kv, prefix);
  return names
    .map((k) => k.slice(prefix.length))
    .sort()
    .map((entry) => entry.split('~').slice(1).join('~'));
}
