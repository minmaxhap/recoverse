import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { ApiError, errorResponse } from '../src/errors';
import type { Env } from '../src/kv';
import { handleVocRoute } from '../src/routes/voc';

const BASE = 'http://recoverse.test';
const ADMIN_TOKEN = 'test-admin-token';

function testEnv(): Env {
  return { ...env, ADMIN_TOKEN };
}

async function callVoc(path: string, init: RequestInit): Promise<Response> {
  const request = new Request(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  try {
    return await handleVocRoute(request, testEnv(), new URL(request.url).pathname);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.status, error.code, error.message);
    }
    throw error;
  }
}

async function json(response: Response): Promise<unknown> {
  return response.json();
}

describe('VOC', () => {
  beforeAll(async () => {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS voc_entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('idea', 'bug', 'impression', 'other')),
        message TEXT NOT NULL,
        author_name TEXT,
        contact TEXT,
        page_path TEXT NOT NULL DEFAULT 'home',
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'planned', 'done', 'archived')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        user_agent TEXT
      )`,
    ).run();
  });

  it('creates a VOC entry and lets the admin move its status', async () => {
    const created = await callVoc('/api/voc', {
      method: 'POST',
      body: JSON.stringify({
        type: 'idea',
        message: '발행 완료 화면에서 저장 실패를 알려주세요.',
        authorName: '민트',
        contact: 'mint@example.com',
        pagePath: '/cover',
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await json(created)) as { entry: { id: string; status: string } };
    expect(createdBody.entry.status).toBe('new');

    const listed = await callVoc('/api/admin/voc', {
      method: 'GET',
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    expect(listed.status).toBe(200);
    const listedBody = (await json(listed)) as { entries: Array<{ id: string; message: string }> };
    expect(listedBody.entries.some((entry) => entry.id === createdBody.entry.id)).toBe(true);

    const updated = await callVoc(`/api/admin/voc/${createdBody.entry.id}/status`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify({ status: 'read' }),
    });
    expect(updated.status).toBe(200);
  });

  it('rejects invalid public VOC payloads and unauthenticated admin reads', async () => {
    const badPayload = await callVoc('/api/voc', {
      method: 'POST',
      body: JSON.stringify({ type: 'idea', message: '' }),
    });
    expect(badPayload.status).toBe(400);

    const unauthenticated = await callVoc('/api/admin/voc', { method: 'GET' });
    expect(unauthenticated.status).toBe(401);
  });
});
