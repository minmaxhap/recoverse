import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import type { SessionStateResponse } from '@recoverse/shared';
import { shuffledAnswerOrder, normalizeQuestion } from '@recoverse/shared';

const BASE = 'http://recoverse.test';

// 참가자 토큰 저장소 — 합류 시 발급된 토큰을 name별로 보관해 쓰기 액션에 주입한다.
const tokens: Record<string, string> = {};
const tokenKey = (code: string, name: string) => `${code}~${name}`;

async function post(path: string, body: unknown): Promise<{ status: number; json: any }> {
  const res = await SELF.fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

/** 인증이 필요한 쓰기 액션 — 해당 참가자의 토큰을 자동 주입 */
async function act(
  code: string,
  action: string,
  name: string,
  extra: Record<string, unknown> = {},
): Promise<{ status: number; json: any }> {
  return post(`/api/session/${code}/${action}`, {
    name,
    playerToken: tokens[tokenKey(code, name)],
    ...extra,
  });
}

async function getState(code: string): Promise<SessionStateResponse> {
  const res = await SELF.fetch(`${BASE}/api/session/${code}/state`);
  expect(res.status).toBe(200);
  return (await res.json()) as SessionStateResponse;
}

async function createSession(host: string, kind = 'yearend'): Promise<string> {
  const { status, json } = await post('/api/session', { host, kind });
  expect(status).toBe(200);
  const code = json.meta.code as string;
  tokens[tokenKey(code, host)] = json.playerToken;
  return code;
}

/** 합류 + 발급 토큰 저장. status 반환 */
async function join(code: string, name: string): Promise<number> {
  const { status, json } = await post(`/api/session/${code}/join`, { name });
  if (status === 200) tokens[tokenKey(code, name)] = json.playerToken;
  return status;
}

describe('health', () => {
  it('responds ok', async () => {
    const res = await SELF.fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
  });
});

describe('3인 풀 시나리오', () => {
  it('create → join×2 → start → 2라운드(추측 포함) → end', async () => {
    const code = await createSession('민희');
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);

    expect(await join(code, '지원')).toBe(200);
    expect(await join(code, '하늘')).toBe(200);

    let state = await getState(code);
    expect(state.players).toHaveLength(3);
    expect(state.meta.phase).toBe('lobby');
    expect(state.meta.roundIdx).toBe(-1);

    // 시작: 호스트만, asker = players[0]
    expect((await act(code, 'start', '지원')).status).toBe(403);
    expect((await act(code, 'start', '민희')).status).toBe(200);
    state = await getState(code);
    const players = state.players;
    expect(state.meta.phase).toBe('question');
    expect(state.meta.roundIdx).toBe(0);
    expect(state.meta.asker).toBe(players[0]);

    // 시작 후 합류 거부
    expect(await join(code, '늦은이')).toBe(409);

    // 질문: 질문자만
    const [p0, p1, p2] = players;
    const notAsker = players.find((p) => p !== state.meta.asker)!;
    expect((await act(code, 'question', notAsker, { question: '올해 최고의 선택은?' })).status).toBe(403);
    expect((await act(code, 'question', state.meta.asker!, { question: '올해 최고의 선택은?', format: 'three-scenes' })).status).toBe(200);
    state = await getState(code);
    expect(state.meta.format).toBe('three-scenes');

    // 답변: 전원 제출 전 answers는 null (서버 은닉)
    await act(code, 'answer', p0, { text: '답A' });
    await act(code, 'answer', p1, { text: '답B' });
    state = await getState(code);
    expect(state.answers).toBeNull();
    expect(state.answered.sort()).toEqual([p0, p1].sort());
    expect(state.meta.phase).toBe('answer');

    // 마지막 답 → guess 전이 (3인)
    await act(code, 'answer', p2, { text: '답C' });
    state = await getState(code);
    expect(state.meta.phase).toBe('guess');
    expect(state.allAnswered).toBe(true);
    expect(state.answers).not.toBeNull();

    // 추측 검증: 순열이 아니면 400
    expect((await act(code, 'guess', p0, { guesses: { [p1]: p1, [p2]: p1 } })).status).toBe(400);
    // 자기 답 포함하면 400
    expect((await act(code, 'guess', p0, { guesses: { [p0]: p1, [p1]: p2 } })).status).toBe(400);

    // p0 전부 정답, p1 전부 정답, p2 전부 오답(스왑)
    expect((await act(code, 'guess', p0, { guesses: { [p1]: p1, [p2]: p2 } })).status).toBe(200);
    state = await getState(code);
    expect(state.guesses).toBeNull(); // 전원 추측 전 은닉

    // 이미 추측한 참가자의 재제출은 거부 (점수 조작 방지)
    expect((await act(code, 'guess', p0, { guesses: { [p1]: p2, [p2]: p1 } })).status).toBe(409);

    expect((await act(code, 'guess', p1, { guesses: { [p0]: p0, [p2]: p2 } })).status).toBe(200);
    expect((await act(code, 'guess', p2, { guesses: { [p0]: p1, [p1]: p0 } })).status).toBe(200);
    state = await getState(code);
    expect(state.allGuessed).toBe(true);
    expect(state.guesses).not.toBeNull();
    expect(state.guesses![p0][p1]).toBe(p1);

    // 다음 라운드: 호스트만, asker 로테이션
    expect((await act(code, 'next', notAsker === '민희' ? p1 : '지원')).status).toBe(403);
    expect((await act(code, 'next', '민희')).status).toBe(200);
    state = await getState(code);
    expect(state.meta.roundIdx).toBe(1);
    expect(state.meta.phase).toBe('question');
    expect(state.meta.asker).toBe(players[1]);
    expect(state.meta.history).toHaveLength(1);
    expect(state.meta.history[0].question).toBe('올해 최고의 선택은?');
    expect(state.meta.history[0].format).toBe('three-scenes');
    expect(state.meta.history[0].answers[p0].text).toBe('답A');
    expect(state.pastGuesses[0][p2][p0]).toBe(p1);

    // 라운드 2 진행 후 마감
    await act(code, 'question', players[1], { question: '내년의 나에게 한 문장?' });
    await act(code, 'answer', p0, { text: '가보자' });
    await act(code, 'answer', p1, { text: '쉬엄쉬엄' });
    await act(code, 'answer', p2, { text: '기록하자' });
    await act(code, 'guess', p0, { guesses: { [p1]: p2, [p2]: p1 } });
    await act(code, 'guess', p1, { guesses: { [p0]: p0, [p2]: p2 } });
    await act(code, 'guess', p2, { guesses: { [p0]: p0, [p1]: p1 } });

    expect((await act(code, 'end', '민희')).status).toBe(200);
    state = await getState(code);
    expect(state.meta.phase).toBe('ended');
    expect(state.meta.history).toHaveLength(2);
    expect(Object.keys(state.pastGuesses).sort()).toEqual(['0', '1']);
  });

  it('강제 공개: 추측이 지체되면 호스트가 공개', async () => {
    const code = await createSession('민희');
    await join(code, '지원');
    await join(code, '하늘');
    await act(code, 'start', '민희');
    let state = await getState(code);
    const [p0, p1, p2] = state.players;
    await act(code, 'question', state.meta.asker!, { question: 'Q' });
    await act(code, 'answer', p0, { text: 'a' });
    await act(code, 'answer', p1, { text: 'b' });
    await act(code, 'answer', p2, { text: 'c' });
    // 한 명만 추측하고 멈춤
    await act(code, 'guess', p0, { guesses: { [p1]: p1, [p2]: p2 } });

    // 강제 공개 전에는 next 불가
    expect((await act(code, 'next', '민희')).status).toBe(409);
    expect((await act(code, 'reveal', p1 === '민희' ? p2 : p1)).status).toBe(403);
    expect((await act(code, 'reveal', '민희')).status).toBe(200);

    state = await getState(code);
    expect(state.revealed).toBe(true);
    expect(state.guesses).not.toBeNull(); // 부분 추측만 공개

    // 공개 이후 신규 추측은 거부
    expect((await act(code, 'guess', p1, { guesses: { [p0]: p0, [p2]: p2 } })).status).toBe(409);

    expect((await act(code, 'next', '민희')).status).toBe(200);
    state = await getState(code);
    expect(state.meta.roundIdx).toBe(1);
    expect(state.meta.history).toHaveLength(1);
  });
});

describe('2인 세션', () => {
  it('guess 단계 없이 전원 제출 = 즉시 공개', async () => {
    const code = await createSession('민희');
    await join(code, '지원');
    await act(code, 'start', '민희');
    let state = await getState(code);
    const [p0, p1] = state.players;
    await act(code, 'question', state.meta.asker!, { question: '올해의 한 장면?' });
    await act(code, 'answer', p0, { text: '바다' });
    state = await getState(code);
    expect(state.answers).toBeNull();
    await act(code, 'answer', p1, { text: '산' });
    state = await getState(code);
    expect(state.meta.phase).toBe('answer'); // guess로 가지 않음
    expect(state.allAnswered).toBe(true);
    expect(state.answers).not.toBeNull();

    // 이미 답한 참가자의 재제출은 거부 (2인 세션에서 상대 답을 본 뒤 바꿔치기 방지)
    expect((await act(code, 'answer', p0, { text: '바다-수정' })).status).toBe(409);

    expect((await act(code, 'next', '민희')).status).toBe(200);
    state = await getState(code);
    expect(state.meta.asker).toBe(state.players[1]);

    // 마감: 진행 중 라운드(질문만 정해진 상태)는 history에 포함되지 않음
    await act(code, 'question', state.players[1], { question: '미완성 질문' });
    expect((await act(code, 'end', '민희')).status).toBe(200);
    state = await getState(code);
    expect(state.meta.phase).toBe('ended');
    expect(state.meta.history).toHaveLength(1);
  });

  it('2명 미만이면 시작 불가', async () => {
    const code = await createSession('민희');
    expect((await act(code, 'start', '민희')).status).toBe(409);
  });

  it('잘못된 참가자 토큰은 거부', async () => {
    const code = await createSession('민희');
    await join(code, '지원');
    // 토큰 없이 / 틀린 토큰으로 시작 시도
    expect((await post(`/api/session/${code}/start`, { name: '민희' })).status).toBe(403);
    expect((await post(`/api/session/${code}/start`, { name: '민희', playerToken: 'deadbeef' })).status).toBe(403);
  });
});

describe('검증', () => {
  it('없는 코드 404, 형식 오류 400, 중복 이름 409', async () => {
    expect((await post('/api/session/ZZZZ/join', { name: '지원' })).status).toBe(404);
    expect((await post('/api/session/ab/join', { name: '지원' })).status).toBe(400);
    const code = await createSession('민희');
    expect((await post(`/api/session/${code}/join`, { name: '민희' })).status).toBe(409);
    expect((await post(`/api/session/${code}/join`, { name: '' })).status).toBe(400);
    expect((await post(`/api/session/${code}/join`, { name: '열두자를넘는아주긴이름이다' })).status).toBe(400);
  });

  it('소문자 코드도 대문자로 정규화되어 동작', async () => {
    const code = await createSession('민희');
    const res = await SELF.fetch(`${BASE}/api/session/${code.toLowerCase()}/state`);
    expect(res.status).toBe(200);
  });
});

describe('공유 링크', () => {
  const sampleIssue = {
    id: 'local-1',
    kind: 'yearend',
    date: '2026-12-31',
    title: '2026 연말호',
    participants: ['민희', '지원'],
    rounds: [{ asker: '민희', question: 'Q1', answers: { 민희: { text: 'A' }, 지원: { text: 'B' } } }],
    source: 'live',
  };

  it('공유 생성 → shareId 발급 → 조회로 스냅샷 반환', async () => {
    const created = await post('/api/share', { issue: sampleIssue });
    expect(created.status).toBe(200);
    const shareId = created.json.shareId as string;
    expect(shareId).toMatch(/^[a-f0-9]{24}$/);

    const res = await SELF.fetch(`${BASE}/api/share/${shareId}`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.issue.title).toBe('2026 연말호');
    expect(body.issue.rounds[0].answers['민희'].text).toBe('A');
    expect(body.issue.shareId).toBe(shareId);
  });

  it('없는/잘못된 공유 ID는 404/400', async () => {
    const missing = await SELF.fetch(`${BASE}/api/share/${'0'.repeat(24)}`);
    expect(missing.status).toBe(404);
    const bad = await SELF.fetch(`${BASE}/api/share/not-a-valid-id`);
    expect(bad.status).toBe(400);
  });

  it('형식이 틀린 호는 400', async () => {
    expect((await post('/api/share', { issue: { title: '제목만' } })).status).toBe(400);
    expect((await post('/api/share', {})).status).toBe(400);
  });
});

describe('shared 유닛', () => {
  it('결정적 셔플: 동일 입력 = 동일 순서, 동일 텍스트는 이름 타이브레이크', () => {
    const answers = {
      민희: { text: '같은 답' },
      지원: { text: '같은 답' },
      하늘: { text: '다른 답' },
    };
    const a = shuffledAnswerOrder('Q7MX', 2, answers);
    const b = shuffledAnswerOrder('Q7MX', 2, answers);
    expect(a).toEqual(b);
    expect(a.map((e) => e.label)).toEqual(['가', '나', '다']);
    expect(new Set(a.map((e) => e.owner)).size).toBe(3);
    // 라운드가 다르면 순서가 달라질 수 있음(해시 입력이 다름) — 결정성만 보장
    const c = shuffledAnswerOrder('Q7MX', 3, answers);
    expect(c).toEqual(shuffledAnswerOrder('Q7MX', 3, answers));
  });

  it('질문 정규화: 공백/문장부호/대소문자 무시', () => {
    expect(normalizeQuestion('올해 가장 잘한 선택은?')).toBe(normalizeQuestion('올해,가장 잘한 선택은…'));
    expect(normalizeQuestion('What Was IT?')).toBe(normalizeQuestion('whatwasit'));
  });
});
