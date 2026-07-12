import { ApiError } from './errors';
import type { Env } from './kv';

/**
 * 아주 가벼운 IP 기반 레이트 리미터 (KV, 60초 창).
 * 공개 URL이라 세션/공유 무한 생성으로 KV를 채우는 스팸을 막는 용도.
 * KV 카운트는 원자적이지 않지만, 남용 차단엔 러프 카운팅으로 충분하다.
 * (KV TTL 최소값이 60초라 창은 60초 고정)
 */
const WINDOW_SEC = 60;

export async function enforceRateLimit(
  env: Env,
  request: Request,
  action: string,
  limit: number,
): Promise<void> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const key = `rl:${action}:${ip}`;
  const current = parseInt((await env.SESSIONS.get(key)) ?? '0', 10) || 0;
  if (current >= limit) {
    throw new ApiError(429, 'rate_limited', '요청이 너무 많아요. 잠시 후 다시 시도해주세요.');
  }
  await env.SESSIONS.put(key, String(current + 1), { expirationTtl: WINDOW_SEC });
}
