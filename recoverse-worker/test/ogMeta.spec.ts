import { createExecutionContext, env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import type { Issue, SessionMeta } from '@recoverse/shared';
import worker from '../src/index';
import { keys, type Env } from '../src/kv';
import { injectOgMeta, resolveOgMeta } from '../src/routes/ogMeta';

const BASE = 'http://recoverse.test';
const SHARE_ID = 'a1b2c3d4e5f6a1b2c3d4e5f6'; // 24 hex — isValidShareId 형식

function testEnv(): Env {
  return env;
}

function url(path: string): URL {
  return new URL(`${BASE}${path}`);
}

function sampleIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    kind: 'yearend',
    date: '2026-12-31',
    title: '2026 연말호',
    participants: ['민희', '지원'],
    rounds: [
      { asker: '민희', question: '올해 가장 큰 변화는?', answers: { 민희: { text: '이사' } } },
    ],
    ...overrides,
  };
}

function sampleMeta(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    code: 'ABCD',
    kind: 'reading',
    date: '2026-07-20',
    host: '민희',
    phase: 'lobby',
    roundIdx: -1,
    asker: null,
    question: null,
    format: null,
    history: [],
    ...overrides,
  };
}

const SAMPLE_HTML =
  '<!doctype html><html><head>' +
  '<meta name="description" content="old-desc" />' +
  '<meta property="og:title" content="old-title" />' +
  '<meta property="og:description" content="old-og-desc" />' +
  '<title>old-title</title>' +
  '</head><body></body></html>';

describe('resolveOgMeta', () => {
  it('builds share meta from the stored snapshot', async () => {
    // Given
    await env.SESSIONS.put(keys.share(SHARE_ID), JSON.stringify(sampleIssue()));

    // When
    const meta = await resolveOgMeta(testEnv(), `/shared/${SHARE_ID}`, url(`/shared/${SHARE_ID}`));

    // Then
    expect(meta).not.toBeNull();
    expect(meta?.title).toContain('2026 연말호');
    expect(meta?.description).toContain('민희·지원');
    expect(meta?.description).toContain('질문과 답 1편');
  });

  it('falls back to the default card when the share is missing', async () => {
    const meta = await resolveOgMeta(testEnv(), '/shared/ffffffffffffffffffffffff', url('/shared/ffffffffffffffffffffffff'));
    expect(meta).toBeNull();
  });

  it('ignores a malformed share id', async () => {
    const meta = await resolveOgMeta(testEnv(), '/shared/not-a-valid-id', url('/shared/not-a-valid-id'));
    expect(meta).toBeNull();
  });

  it('builds join meta from the session when the code resolves', async () => {
    // Given
    await env.SESSIONS.put(keys.meta('ABCD'), JSON.stringify(sampleMeta()));

    // When
    const meta = await resolveOgMeta(testEnv(), '/join', url('/join?code=ABCD'));

    // Then
    expect(meta?.title).toContain('2026 독서 특집호');
    expect(meta?.description).toContain('민희');
    expect(meta?.description).toContain('ABCD');
  });

  it('lowercases join codes are upcased and still resolve', async () => {
    await env.SESSIONS.put(keys.meta('ABCD'), JSON.stringify(sampleMeta()));
    const meta = await resolveOgMeta(testEnv(), '/join', url('/join?code=abcd'));
    expect(meta?.description).toContain('ABCD');
  });

  it('shows a generic invite when the join code has no session yet', async () => {
    const meta = await resolveOgMeta(testEnv(), '/join', url('/join?code=WX2Y'));
    expect(meta?.title).toBe('Recoverse 합류');
    expect(meta?.description).toContain('WX2Y');
  });

  it('returns null for routes without a preview card', async () => {
    expect(await resolveOgMeta(testEnv(), '/solo', url('/solo'))).toBeNull();
    expect(await resolveOgMeta(testEnv(), '/', url('/'))).toBeNull();
  });
});

describe('injectOgMeta', () => {
  async function inject(meta: { title: string; description: string }, canonical = `${BASE}/shared/${SHARE_ID}`): Promise<string> {
    const html = new Response(SAMPLE_HTML, { headers: { 'content-type': 'text/html' } });
    return injectOgMeta(html, meta, canonical).text();
  }

  it('overrides the placeholder title and description tags', async () => {
    const text = await inject({ title: '2026 연말호 · Recoverse', description: '민희·지원의 회고' });
    expect(text).not.toContain('old-title');
    expect(text).not.toContain('old-desc');
    expect(text).not.toContain('old-og-desc');
    expect(text).toContain('2026 연말호 · Recoverse');
    expect(text).toContain('민희·지원의 회고');
  });

  it('appends twitter and canonical tags', async () => {
    const text = await inject({ title: 'T', description: 'D' });
    expect(text).toContain('name="twitter:card"');
    expect(text).toContain('property="og:url"');
    expect(text).toContain(`content="${BASE}/shared/${SHARE_ID}"`);
    expect(text).toContain('property="og:site_name"');
  });

  it('escapes quotes and ampersands so injected values cannot break out of attributes', async () => {
    const text = await inject({ title: 'A "quote" & <tag>', description: 'plain' });
    // 우리가 직접 만든 twitter:title 태그는 안전하게 이스케이프되어야 한다.
    expect(text).toContain('content="A &quot;quote&quot; &amp; &lt;tag&gt;"');
    // 원본 그대로의 위험한 속성값이 남아서는 안 된다.
    expect(text).not.toContain('content="A "quote"');
  });

  it('keeps the html content type', async () => {
    const html = new Response(SAMPLE_HTML, { headers: { 'content-type': 'text/html' } });
    const out = injectOgMeta(html, { title: 'T', description: 'D' }, `${BASE}/join`);
    expect(out.headers.get('content-type')).toContain('text/html');
  });
});

describe('worker OG integration', () => {
  // 정적 자산 서버를 스텁으로 갈아끼워 wrangler dev 없이 index.ts 배선까지 통째로 검증한다.
  function assetsEnv(): Env {
    return {
      ...env,
      ASSETS: {
        fetch: async () => new Response(SAMPLE_HTML, { headers: { 'content-type': 'text/html' } }),
      } as unknown as Fetcher,
    };
  }

  it('injects share OG into the served index.html', async () => {
    // Given
    await env.SESSIONS.put(keys.share(SHARE_ID), JSON.stringify(sampleIssue()));

    // When
    const response = await worker.fetch(
      new Request(`${BASE}/shared/${SHARE_ID}`),
      assetsEnv(),
      createExecutionContext(),
    );
    const text = await response.text();

    // Then
    expect(text).toContain('2026 연말호 · Recoverse');
    expect(text).toContain('name="twitter:card"');
    expect(text).not.toContain('old-title');
  });

  it('serves the untouched index.html for routes without a preview card', async () => {
    const response = await worker.fetch(new Request(`${BASE}/solo`), assetsEnv(), createExecutionContext());
    const text = await response.text();
    expect(text).toContain('old-title');
    expect(text).not.toContain('twitter:card');
  });
});
