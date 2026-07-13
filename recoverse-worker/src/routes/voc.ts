import { VOC_STATUSES, VOC_TYPES, type VocCreateRequest, type VocEntry, type VocStatus } from '@recoverse/shared';
import { ApiError, jsonResponse } from '../errors';
import { type Env } from '../kv';
import { enforceRateLimit } from '../rateLimit';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isVocType(value: string): value is VocCreateRequest['type'] {
  return VOC_TYPES.some((candidate) => candidate === value);
}

function isVocStatus(value: string): value is VocStatus {
  return VOC_STATUSES.some((candidate) => candidate === value);
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof Error) return null;
    return null;
  }
}

async function hashToken(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([hashToken(left), hashToken(right)]);
  let diff = 0;
  for (let i = 0; i < leftHash.length; i += 1) {
    diff |= leftHash[i] ^ rightHash[i];
  }
  return diff === 0;
}

async function isAdminRequest(request: Request, env: Env): Promise<boolean> {
  const token = env.ADMIN_TOKEN?.trim();
  if (!token) return false;
  const authorization = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';
  if (!authorization.startsWith(prefix)) return false;
  return constantTimeEqual(authorization.slice(prefix.length), token);
}

async function requireAdmin(request: Request, env: Env): Promise<void> {
  if (!env.ADMIN_TOKEN?.trim()) {
    throw new ApiError(503, 'admin_disabled', '관리 기능이 아직 설정되지 않았어요.');
  }
  if (!(await isAdminRequest(request, env))) {
    throw new ApiError(401, 'unauthorized', '관리자 토큰이 필요해요.');
  }
}

function readCreateBody(body: unknown): VocCreateRequest {
  if (!isRecord(body)) {
    throw new ApiError(400, 'bad_request', '요청 형식이 올바르지 않아요.');
  }

  const type = typeof body.type === 'string' ? body.type : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!isVocType(type)) {
    throw new ApiError(400, 'bad_type', '의견 종류가 올바르지 않아요.');
  }
  if (!message) {
    throw new ApiError(400, 'bad_message', '내용을 입력해주세요.');
  }

  return {
    type,
    message,
    authorName: typeof body.authorName === 'string' ? body.authorName : undefined,
    contact: typeof body.contact === 'string' ? body.contact : undefined,
    pagePath: typeof body.pagePath === 'string' ? body.pagePath : undefined,
  };
}

function toEntry(row: Record<string, unknown>): VocEntry {
  const type = typeof row.type === 'string' && isVocType(row.type) ? row.type : 'other';
  const status = typeof row.status === 'string' && isVocStatus(row.status) ? row.status : 'new';
  return {
    id: String(row.id),
    type,
    message: String(row.message ?? ''),
    authorName: typeof row.author_name === 'string' ? row.author_name : null,
    contact: typeof row.contact === 'string' ? row.contact : null,
    pagePath: typeof row.page_path === 'string' ? row.page_path : 'home',
    status,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    userAgent: typeof row.user_agent === 'string' ? row.user_agent : null,
  };
}

async function createVoc(request: Request, env: Env): Promise<Response> {
  await enforceRateLimit(env, request, 'voc', 5);
  const body = await readJsonBody(request);
  const input = readCreateBody(body);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO voc_entries
      (id, type, message, author_name, contact, page_path, status, created_at, updated_at, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
  )
    .bind(
      id,
      input.type,
      input.message,
      input.authorName?.trim() || null,
      input.contact?.trim() || null,
      input.pagePath?.trim() || 'home',
      now,
      now,
      request.headers.get('user-agent'),
    )
    .run();

  return jsonResponse(
    {
      entry: {
        id,
        type: input.type,
        message: input.message,
        authorName: input.authorName?.trim() || null,
        contact: input.contact?.trim() || null,
        pagePath: input.pagePath?.trim() || 'home',
        status: 'new',
        createdAt: now,
        updatedAt: now,
        userAgent: request.headers.get('user-agent'),
      },
    },
    201,
  );
}

async function listVoc(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  const rows = await env.DB.prepare(
    `SELECT id, type, message, author_name, contact, page_path, status, created_at, updated_at, user_agent
     FROM voc_entries
     ORDER BY created_at DESC`,
  ).all<Record<string, unknown>>();
  return jsonResponse({ entries: rows.results.map(toEntry) });
}

async function updateVocStatus(request: Request, env: Env, id: string): Promise<Response> {
  await requireAdmin(request, env);
  const body = await readJsonBody(request);
  const status = isRecord(body) && typeof body.status === 'string' ? body.status : '';
  if (!isVocStatus(status)) {
    throw new ApiError(400, 'bad_status', '상태 값이 올바르지 않아요.');
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE voc_entries
     SET status = ?, updated_at = ?
     WHERE id = ?`,
  ).bind(status, now, id).run();
  if (result.meta.changes === 0) {
    throw new ApiError(404, 'not_found', '의견을 찾지 못했어요.');
  }
  return jsonResponse({ ok: true });
}

export async function handleVocRoute(request: Request, env: Env, path: string): Promise<Response> {
  if (path === '/api/voc') {
    if (request.method !== 'POST') {
      throw new ApiError(405, 'method_not_allowed', '허용되지 않는 메서드예요.');
    }
    return createVoc(request, env);
  }

  if (path === '/api/admin/voc') {
    if (request.method !== 'GET') {
      throw new ApiError(405, 'method_not_allowed', '허용되지 않는 메서드예요.');
    }
    return listVoc(request, env);
  }

  if (path.startsWith('/api/admin/voc/') && path.endsWith('/status')) {
    if (request.method !== 'PATCH') {
      throw new ApiError(405, 'method_not_allowed', '허용되지 않는 메서드예요.');
    }
    const id = path.slice('/api/admin/voc/'.length, -'/status'.length);
    if (!id) {
      throw new ApiError(400, 'bad_id', '의견 ID가 올바르지 않아요.');
    }
    return updateVocStatus(request, env, id);
  }

  throw new ApiError(404, 'not_found', '요청한 경로를 찾지 못했어요.');
}
