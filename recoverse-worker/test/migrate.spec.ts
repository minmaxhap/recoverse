import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { ApiError, errorResponse } from '../src/errors';
import type { Env } from '../src/kv';
import { handleMigrateRoute } from '../src/routes/migrate';

const BASE = 'http://recoverse.test';

async function call(path: string, init: RequestInit): Promise<Response> {
  const request = new Request(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  try {
    return await handleMigrateRoute(request, env as Env, new URL(request.url).pathname);
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message);
    throw error;
  }
}

const shelf = [
  {
    id: 'a',
    kind: 'yearend',
    date: '2026-12-31',
    title: '2026 연말호',
    participants: ['민희'],
    rounds: [{ asker: '민희', question: 'Q', answers: { 민희: { text: 'A' } } }],
    source: 'solo',
  },
];

describe('migrate', () => {
  it('stores a shelf under a 6-char code and hands it back exactly once', async () => {
    // Given — 책장을 올린다
    const createRes = await call('/api/migrate', { method: 'POST', body: JSON.stringify({ issues: shelf }) });
    expect(createRes.status).toBe(200);
    const { code, expiresInSeconds } = (await createRes.json()) as { code: string; expiresInSeconds: number };
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(expiresInSeconds).toBe(600);

    // When — 새 기기가 코드로 받는다
    const claimRes = await call(`/api/migrate/${code}`, { method: 'GET' });
    expect(claimRes.status).toBe(200);
    const claimed = (await claimRes.json()) as { issues: typeof shelf };
    expect(claimed.issues).toHaveLength(1);
    expect(claimed.issues[0].title).toBe('2026 연말호');

    // Then — 일회용: 같은 코드로 다시 받으면 사라지고 없다
    const second = await call(`/api/migrate/${code}`, { method: 'GET' });
    expect(second.status).toBe(404);
  });

  it('lowercases codes are accepted on claim', async () => {
    const createRes = await call('/api/migrate', { method: 'POST', body: JSON.stringify({ issues: shelf }) });
    const { code } = (await createRes.json()) as { code: string };
    const claimRes = await call(`/api/migrate/${code.toLowerCase()}`, { method: 'GET' });
    expect(claimRes.status).toBe(200);
  });

  it('rejects an empty shelf', async () => {
    const res = await call('/api/migrate', { method: 'POST', body: JSON.stringify({ issues: [] }) });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed code and an unknown code', async () => {
    expect((await call('/api/migrate/short', { method: 'GET' })).status).toBe(400);
    expect((await call('/api/migrate/ZZZZZZ', { method: 'GET' })).status).toBe(404);
  });
});
