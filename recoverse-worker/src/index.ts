import { ApiError, errorResponse, jsonResponse } from './errors';
import type { Env } from './kv';
import { handleSessionRoute } from './routes/session';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/health') {
        return jsonResponse({ ok: true });
      }
      if (path === '/api/session' || path.startsWith('/api/session/')) {
        return await handleSessionRoute(request, env, path);
      }
      if (path.startsWith('/api/')) {
        return errorResponse(404, 'not_found', '요청한 경로를 찾지 못했어요.');
      }
      // 비 API 경로는 정적 자산(빌드된 SPA)으로 위임. dev에서는 ASSETS 미바인딩.
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return errorResponse(404, 'not_found', '요청한 경로를 찾지 못했어요.');
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.status, err.code, err.message);
      }
      console.error('unhandled error', err);
      return errorResponse(500, 'internal', '서버에서 문제가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
  },
} satisfies ExportedHandler<Env>;
