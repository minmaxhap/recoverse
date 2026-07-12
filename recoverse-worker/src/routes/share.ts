import { isValidShareId, type Issue } from '@recoverse/shared';
import { ApiError, jsonResponse } from '../errors';
import { keys, kvGetJson, kvPutJson, SHARE_TTL_SECONDS, type Env } from '../kv';
import { enforceRateLimit } from '../rateLimit';

// 공유 스냅샷은 라운드/답변이 많을 수 있어 세션 본문보다 넉넉하게
const MAX_SHARE_BYTES = 256 * 1024;

function genShareId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** 저장 전 최소 형태 검증 — 사용자 소유 호를 그대로 스냅샷하되 형식만 확인 */
function validateIssue(v: unknown): Issue {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new ApiError(400, 'bad_issue', '공유할 호 형식이 올바르지 않아요.');
  }
  const issue = v as Record<string, unknown>;
  if (
    typeof issue.title !== 'string' ||
    typeof issue.date !== 'string' ||
    typeof issue.kind !== 'string' ||
    !Array.isArray(issue.participants) ||
    !Array.isArray(issue.rounds)
  ) {
    throw new ApiError(400, 'bad_issue', '공유할 호 형식이 올바르지 않아요.');
  }
  return v as Issue;
}

async function createShare(request: Request, env: Env): Promise<Response> {
  // 공유 스냅샷 무한 생성 스팸 방어 (IP당 분당 20개)
  await enforceRateLimit(env, request, 'share', 20);
  const raw = await request.text();
  if (raw.length > MAX_SHARE_BYTES) {
    throw new ApiError(400, 'share_too_large', '공유할 내용이 너무 커요.');
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
  const issue = validateIssue((parsed as Record<string, unknown>).issue);

  const shareId = genShareId();
  // 읽기 전용 스냅샷 — shareId를 박아 저장 (id는 원본 로컬 id와 별개로 유지)
  const snapshot: Issue = { ...issue, shareId };
  await kvPutJson(env.SESSIONS, keys.share(shareId), snapshot, SHARE_TTL_SECONDS);
  return jsonResponse({ shareId });
}

async function getShare(env: Env, shareId: string): Promise<Response> {
  if (!isValidShareId(shareId)) {
    throw new ApiError(400, 'bad_share_id', '공유 링크 형식이 올바르지 않아요.');
  }
  const issue = await kvGetJson<Issue>(env.SESSIONS, keys.share(shareId));
  if (!issue) {
    throw new ApiError(404, 'share_not_found', '공유된 호를 찾지 못했어요. 링크가 만료되었을 수 있어요.');
  }
  return jsonResponse({ issue });
}

export async function handleShareRoute(request: Request, env: Env, path: string): Promise<Response> {
  if (path === '/api/share') {
    if (request.method !== 'POST') {
      throw new ApiError(405, 'method_not_allowed', '허용되지 않은 메서드예요.');
    }
    return createShare(request, env);
  }
  // GET /api/share/:id
  if (request.method !== 'GET') {
    throw new ApiError(405, 'method_not_allowed', '허용되지 않은 메서드예요.');
  }
  const shareId = path.slice('/api/share/'.length);
  return getShare(env, shareId);
}
