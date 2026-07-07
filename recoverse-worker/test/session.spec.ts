import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import type { SessionStateResponse } from '@recoverse/shared';
import { shuffledAnswerOrder, normalizeQuestion } from '@recoverse/shared';

const BASE = 'http://recoverse.test';

async function post(path: string, body: unknown): Promise<{ status: number; json: any }> {
  const res = await SELF.fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

async function getState(code: string): Promise<SessionStateResponse> {
  const res = await SELF.fetch(`${BASE}/api/session/${code}/state`);
  expect(res.status).toBe(200);
  return (await res.json()) as SessionStateResponse;
}

async function createSession(host: string, kind = 'yearend'): Promise<string> {
  const { status, json } = await post('/api/session', { host, kind });
  expect(status).toBe(200);
  return json.meta.code as string;
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

    expect((await post(`/api/session/${code}/join`, { name: '지원' })).status).toBe(200);
    expect((await post(`/api/session/${code}/join`, { name: '하늘' })).status).toBe(200);

    let state = await getState(code);
    expect(state.players).toHaveLength(3);
    expect(state.meta.phase).toBe('lobby');
    expect(state.meta.roundIdx).toBe(-1);

    // 시작: 호스트만, asker = players[0]
    expect((await post(`/api/session/${code}/start`, { name: '지원' })).status).toBe(403);
    expect((await post(`/api/session/${code}/start`, { name: '민희' })).status).toBe(200);
    state = await getState(code);
    const players = state.players;
    expect(state.meta.phase).toBe('question');
    expect(state.meta.roundIdx).toBe(0);
    expect(state.meta.asker).toBe(players[0]);

    // 시작 후 합류 거부
    expect((await post(`/api/session/${code}/join`, { name: '늦은이' })).status).toBe(409);

    // 질문: 질문자만
    const [p0, p1, p2] = players;
    const notAsker = players.find((p) => p !== state.meta.asker)!;
    expect((await post(`/api/session/${code}/question`, { name: notAsker, question: '올해 최고의 선택은?' })).status).toBe(403);
    expect((await post(`/api/session/${code}/question`, { name: state.meta.asker!, question: '올해 최고의 선택은?' })).status).toBe(200);

    // 답변: 전원 제출 전 answers는 null (서버 은닉)
    await post(`/api/session/${code}/answer`, { name: p0, text: '답A' });
    await post(`/api/session/${code}/answer`, { name: p1, text: '답B' });
    state = await getState(code);
    expect(state.answers).toBeNull();
    expect(state.answered.sort()).toEqual([p0, p1].sort());
    expect(state.meta.phase).toBe('answer');

    // 마지막 답 → guess 전이 (3인)
    await post(`/api/session/${code}/answer`, { name: p2, text: '답C' });
    state = await getState(code);
    expect(state.meta.phase).toBe('guess');
    expect(state.allAnswered).toBe(true);
    expect(state.answers).not.toBeNull();

    // 추측 검증: 순열이 아니면 400
    expect(
      (await post(`/api/session/${code}/guess`, { name: p0, guesses: { [p1]: p1, [p2]: p1 } })).status,
    ).toBe(400);
    // 자기 답 포함하면 400
    expect(
      (await post(`/api/session/${code}/guess`, { name: p0, guesses: { [p0]: p1, [p1]: p2 } })).status,
    ).toBe(400);

    // p0 전부 정답, p1 전부 정답, p2 전부 오답(스왑)
    expect((await post(`/api/session/${code}/guess`, { name: p0, guesses: { [p1]: p1, [p2]: p2 } })).status).toBe(200);
    state = await getState(code);
    expect(state.guesses).toBeNull(); // 전원 추측 전 은닉

    expect((await post(`/api/session/${code}/guess`, { name: p1, guesses: { [p0]: p0, [p2]: p2 } })).status).toBe(200);
    expect((await post(`/api/session/${code}/guess`, { name: p2, guesses: { [p0]: p1, [p1]: p0 } })).status).toBe(200);
    state = await getState(code);
    expect(state.allGuessed).toBe(true);
    expect(state.guesses).not.toBeNull();
    expect(state.guesses![p0][p1]).toBe(p1);

    // 다음 라운드: 호스트만, asker 로테이션
    expect((await post(`/api/session/${code}/next`, { name: notAsker === '민희' ? p1 : '지원' })).status).toBe(403);
    expect((await post(`/api/session/${code}/next`, { name: '민희' })).status).toBe(200);
    state = await getState(code);
    expect(state.meta.roundIdx).toBe(1);
    expect(state.meta.phase).toBe('question');
    expect(state.meta.asker).toBe(players[1]);
    expect(state.meta.history).toHaveLength(1);
    expect(state.meta.history[0].question).toBe('올해 최고의 선택은?');
    expect(state.meta.history[0].answers[p0].text).toBe('답A');
    expect(state.pastGuesses[0][p2][p0]).toBe(p1);

    // 라운드 2 진행 후 마감
    await post(`/api/session/${code}/question`, { name: players[1], question: '내년의 나에게 한 문장?' });
    await post(`/api/session/${code}/answer`, { name: p0, text: '가보자' });
    await post(`/api/session/${code}/answer`, { name: p1, text: '쉬엄쉬엄' });
    await post(`/api/session/${code}/answer`, { name: p2, text: '기록하자' });
    await post(`/api/session/${code}/guess`, { name: p0, guesses: { [p1]: p2, [p2]: p1 } });
    await post(`/api/session/${code}/guess`, { name: p1, guesses: { [p0]: p0, [p2]: p2 } });
    await post(`/api/session/${code}/guess`, { name: p2, guesses: { [p0]: p0, [p1]: p1 } });

    expect((await post(`/api/session/${code}/end`, { name: '민희' })).status).toBe(200);
    state = await getState(code);
    expect(state.meta.phase).toBe('ended');
    expect(state.meta.history).toHaveLength(2);
    expect(Object.keys(state.pastGuesses).sort()).toEqual(['0', '1']);
  });

  it('강제 공개: 추측이 지체되면 호스트가 공개', async () => {
    const code = await createSession('민희');
    await post(`/api/session/${code}/join`, { name: '지원' });
    await post(`/api/session/${code}/join`, { name: '하늘' });
    await post(`/api/session/${code}/start`, { name: '민희' });
    let state = await getState(code);
    const [p0, p1, p2] = state.players;
    await post(`/api/session/${code}/question`, { name: state.meta.asker!, question: 'Q' });
    await post(`/api/session/${code}/answer`, { name: p0, text: 'a' });
    await post(`/api/session/${code}/answer`, { name: p1, text: 'b' });
    await post(`/api/session/${code}/answer`, { name: p2, text: 'c' });
    // 한 명만 추측하고 멈춤
    await post(`/api/session/${code}/guess`, { name: p0, guesses: { [p1]: p1, [p2]: p2 } });

    // 강제 공개 전에는 next 불가
    expect((await post(`/api/session/${code}/next`, { name: '민희' })).status).toBe(409);
    expect((await post(`/api/session/${code}/reveal`, { name: p1 === '민희' ? p2 : p1 })).status).toBe(403);
    expect((await post(`/api/session/${code}/reveal`, { name: '민희' })).status).toBe(200);

    state = await getState(code);
    expect(state.revealed).toBe(true);
    expect(state.guesses).not.toBeNull(); // 부분 추측만 공개

    expect((await post(`/api/session/${code}/next`, { name: '민희' })).status).toBe(200);
    state = await getState(code);
    expect(state.meta.roundIdx).toBe(1);
    expect(state.meta.history).toHaveLength(1);
  });
});

describe('2인 세션', () => {
  it('guess 단계 없이 전원 제출 = 즉시 공개', async () => {
    const code = await createSession('민희');
    await post(`/api/session/${code}/join`, { name: '지원' });
    await post(`/api/session/${code}/start`, { name: '민희' });
    let state = await getState(code);
    const [p0, p1] = state.players;
    await post(`/api/session/${code}/question`, { name: state.meta.asker!, question: '올해의 한 장면?' });
    await post(`/api/session/${code}/answer`, { name: p0, text: '바다' });
    state = await getState(code);
    expect(state.answers).toBeNull();
    await post(`/api/session/${code}/answer`, { name: p1, text: '산' });
    state = await getState(code);
    expect(state.meta.phase).toBe('answer'); // guess로 가지 않음
    expect(state.allAnswered).toBe(true);
    expect(state.answers).not.toBeNull();

    expect((await post(`/api/session/${code}/next`, { name: '민희' })).status).toBe(200);
    state = await getState(code);
    expect(state.meta.asker).toBe(state.players[1]);

    // 마감: 진행 중 라운드(질문만 정해진 상태)는 history에 포함되지 않음
    await post(`/api/session/${code}/question`, { name: state.players[1], question: '미완성 질문' });
    expect((await post(`/api/session/${code}/end`, { name: '민희' })).status).toBe(200);
    state = await getState(code);
    expect(state.meta.phase).toBe('ended');
    expect(state.meta.history).toHaveLength(1);
  });

  it('2명 미만이면 시작 불가', async () => {
    const code = await createSession('민희');
    expect((await post(`/api/session/${code}/start`, { name: '민희' })).status).toBe(409);
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
