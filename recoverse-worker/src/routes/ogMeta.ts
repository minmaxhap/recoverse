import {
  defaultTitle,
  isValidCode,
  isValidShareId,
  KIND_LABELS,
  type Issue,
  type Kind,
  type SessionMeta,
} from '@recoverse/shared';
import { keys, kvGetJson, type Env } from '../kv';

/**
 * SPA 링크 미리보기 문제 해결 — Recoverse는 클라이언트 렌더 SPA라, 카카오톡·슬랙 등
 * JS를 실행하지 않는 링크 크롤러에게는 모든 경로가 똑같은 기본 index.html로 보인다.
 * 그래서 공유(/shared/:id)·합류(/join) 링크가 "빈 카드"로 뜬다.
 *
 * 이 모듈은 그 두 경로의 요청에 한해, 엣지에서 index.html의 <head> 메타를 그 링크에 맞는
 * 제목·설명으로 덮어써 rich preview가 뜨게 한다. SPA 자체 동작에는 영향이 없다(부팅 후
 * 클라이언트가 이어받는다). KV 조회가 필요하므로 저빈도 진입점에만 적용한다.
 */

const SHARE_PREFIX = '/shared/';
const SITE_NAME = 'Recoverse';
const OG_TITLE_MAX = 90;
const OG_DESC_MAX = 200;

export interface OgMeta {
  readonly title: string;
  readonly description: string;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(text: string, max: number): string {
  const collapsed = text.trim().replace(/\s+/g, ' ');
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, max - 1).trimEnd()}…`;
}

function shareDescription(issue: Issue): string {
  const people = Array.isArray(issue.participants)
    ? issue.participants.filter((name): name is string => typeof name === 'string' && name.length > 0)
    : [];
  const kindLabel = KIND_LABELS[issue.kind as Kind] ?? '회고';
  const count = Array.isArray(issue.rounds) ? issue.rounds.length : 0;
  const who = people.length > 0 ? `${people.join('·')}의 ` : '';
  return `${who}${kindLabel} 회고 · 질문과 답 ${count}편`;
}

/** 경로에 맞는 OG 메타를 만든다. 대상 경로가 아니거나 데이터가 없으면 null(기본 카드 유지). */
export async function resolveOgMeta(env: Env, path: string, url: URL): Promise<OgMeta | null> {
  if (path.startsWith(SHARE_PREFIX)) {
    const shareId = path.slice(SHARE_PREFIX.length);
    if (!isValidShareId(shareId)) return null;
    const issue = await kvGetJson<Issue>(env.SESSIONS, keys.share(shareId));
    // 만료·오타 링크는 기본 브랜드 카드로 떨어뜨린다(존재하지 않는 회고를 지어내지 않는다).
    if (!issue) return null;
    return { title: `${issue.title} · ${SITE_NAME}`, description: shareDescription(issue) };
  }

  if (path === '/join') {
    const code = (url.searchParams.get('code') ?? '').toUpperCase();
    if (isValidCode(code)) {
      const meta = await kvGetJson<SessionMeta>(env.SESSIONS, keys.meta(code));
      if (meta) {
        return {
          title: `${defaultTitle(meta.kind, meta.date)} 합류 · ${SITE_NAME}`,
          description: `${meta.host}님과 함께 쓰는 회고예요. 코드 ${code}로 합류하세요.`,
        };
      }
    }
    return {
      title: `${SITE_NAME} 합류`,
      description: code ? `코드 ${code}로 이번 호에 합류하세요.` : '코드로 이번 호에 합류해요.',
    };
  }

  return null;
}

/** index.html Response의 <head> 메타를 주어진 OG 값으로 덮어써 스트리밍 변환한다. */
export function injectOgMeta(html: Response, meta: OgMeta, canonicalUrl: string): Response {
  const title = clamp(meta.title, OG_TITLE_MAX);
  const description = clamp(meta.description, OG_DESC_MAX);
  const appended =
    `<meta property="og:url" content="${escapeAttr(canonicalUrl)}" />` +
    `<meta property="og:site_name" content="${SITE_NAME}" />` +
    `<meta name="twitter:card" content="summary" />` +
    `<meta name="twitter:title" content="${escapeAttr(title)}" />` +
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`;

  return new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(title);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', title);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', description);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', description);
      },
    })
    .on('head', {
      element(el) {
        el.append(appended, { html: true });
      },
    })
    .transform(html);
}

/**
 * OG 대상 경로면 index.html을 가져와 메타를 주입한 응답을 돌려주고, 아니면 null을 돌려
 * 호출부가 평소대로 정적 자산을 서빙하게 한다.
 */
export async function maybeRenderOgPage(
  request: Request,
  env: Env,
  path: string,
  url: URL,
): Promise<Response | null> {
  if (request.method !== 'GET' || !env.ASSETS) return null;
  const meta = await resolveOgMeta(env, path, url);
  if (!meta) return null;

  const indexResponse = await env.ASSETS.fetch(new Request(new URL('/', url), request));
  if (!indexResponse.ok || !(indexResponse.headers.get('content-type') ?? '').includes('text/html')) {
    return null;
  }
  return injectOgMeta(indexResponse, meta, url.href);
}
