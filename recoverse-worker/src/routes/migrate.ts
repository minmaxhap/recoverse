import type { Issue } from '@recoverse/shared';
import { ApiError, jsonResponse } from '../errors';
import { keys, kvGetJson, kvPutJson, MIGRATE_TTL_SECONDS, type Env } from '../kv';
import { enforceRateLimit } from '../rateLimit';

/**
 * 기기 이사 — 로컬 우선 앱에서 계정 없이 다른 폰으로 책장을 옮기기 위한 일회용 코드.
 * 책장 스냅샷을 짧은 TTL로 저장하고, 새 기기가 코드로 받는 즉시 삭제한다(1회용).
 * 개인 기록이 서버에 머무는 창을 최소화하려는 설계다.
 */

const MAX_MIGRATE_BYTES = 1024 * 1024; // 책장 전체라 공유 스냅샷보다 넉넉하게
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // I·O·0·1 제외
const MIGRATE_CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

function genMigrateCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

function validateIssues(value: unknown): Issue[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, 'bad_shelf', '옮길 책장 내용이 없어요.');
  }
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new ApiError(400, 'bad_shelf', '옮길 책장 내용이 올바르지 않아요.');
    }
  }
  return value as Issue[];
}

async function createMigration(request: Request, env: Env): Promise<Response> {
  await enforceRateLimit(env, request, 'migrate', 10);
  const raw = await request.text();
  if (raw.length > MAX_MIGRATE_BYTES) {
    throw new ApiError(400, 'shelf_too_large', '책장이 너무 커요. 파일 내보내기로 옮겨주세요.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || '{}');
  } catch {
    throw new ApiError(400, 'bad_json', '요청 형식이 올바르지 않아요.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new ApiError(400, 'bad_json', '요청 형식이 올바르지 않아요.');
  }
  const issues = validateIssues((parsed as Record<string, unknown>).issues);

  let code = '';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = genMigrateCode();
    if ((await env.SESSIONS.get(keys.migrate(candidate))) === null) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    throw new ApiError(503, 'code_exhausted', '코드를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
  }

  await kvPutJson(env.SESSIONS, keys.migrate(code), { issues }, MIGRATE_TTL_SECONDS);
  return jsonResponse({ code, expiresInSeconds: MIGRATE_TTL_SECONDS });
}

async function claimMigration(env: Env, rawCode: string): Promise<Response> {
  const code = rawCode.toUpperCase();
  if (!MIGRATE_CODE_RE.test(code)) {
    throw new ApiError(400, 'bad_migrate_code', '이사 코드 형식이 올바르지 않아요.');
  }
  const payload = await kvGetJson<{ issues: Issue[] }>(env.SESSIONS, keys.migrate(code));
  if (!payload) {
    throw new ApiError(404, 'migrate_not_found', '코드를 찾지 못했어요. 만료됐거나 이미 사용한 코드예요.');
  }
  // 일회용 — 받는 즉시 지운다.
  await env.SESSIONS.delete(keys.migrate(code));
  return jsonResponse({ issues: payload.issues });
}

export async function handleMigrateRoute(request: Request, env: Env, path: string): Promise<Response> {
  if (path === '/api/migrate') {
    if (request.method !== 'POST') {
      throw new ApiError(405, 'method_not_allowed', '허용되지 않은 메서드예요.');
    }
    return createMigration(request, env);
  }
  // GET /api/migrate/:code
  if (request.method !== 'GET') {
    throw new ApiError(405, 'method_not_allowed', '허용되지 않은 메서드예요.');
  }
  return claimMigration(env, path.slice('/api/migrate/'.length));
}
