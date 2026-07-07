import {
  CODE_ALPHABET,
  isKind,
  isValidAnswerText,
  isValidCode,
  isValidName,
  isValidQuestion,
  type Answer,
  type Kind,
  type Round,
  type SessionMeta,
  type SessionStateResponse,
} from '@recoverse/shared';
import { ApiError, jsonResponse } from '../errors';
import { keys, kvGetJson, kvListKeys, kvPutJson, listPlayers, type Env } from '../kv';

const MAX_BODY_BYTES = 16 * 1024;

type Guesses = Record<string, string>;
type PastGuesses = Record<number, Record<string, Guesses>>;

/* ── 요청 파싱 ── */

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new ApiError(400, 'body_too_large', '요청이 너무 커요.');
  }
  try {
    const parsed: unknown = JSON.parse(raw || '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new ApiError(400, 'bad_json', '요청 형식이 올바르지 않아요.');
  }
}

function requireName(body: Record<string, unknown>): string {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!isValidName(name)) {
    throw new ApiError(400, 'bad_name', '이름은 1~12자로 입력해주세요.');
  }
  return name;
}

/* ── 세션 상태 조회 ── */

async function requireMeta(env: Env, code: string): Promise<SessionMeta> {
  const meta = await kvGetJson<SessionMeta>(env.SESSIONS, keys.meta(code));
  if (!meta) {
    throw new ApiError(404, 'session_not_found', '코드에 해당하는 호를 찾지 못했어요. 코드를 확인해주세요.');
  }
  return meta;
}

async function listRoundNames(env: Env, prefix: string): Promise<string[]> {
  const names = await kvListKeys(env.SESSIONS, prefix);
  return names.map((k) => k.slice(prefix.length));
}

async function collectAnswers(
  env: Env,
  code: string,
  roundIdx: number,
  names: string[],
): Promise<Record<string, Answer>> {
  const out: Record<string, Answer> = {};
  await Promise.all(
    names.map(async (n) => {
      const a = await kvGetJson<Answer>(env.SESSIONS, keys.answer(code, roundIdx, n));
      if (a) out[n] = a;
    }),
  );
  return out;
}

async function collectGuesses(
  env: Env,
  code: string,
  roundIdx: number,
  names: string[],
): Promise<Record<string, Guesses>> {
  const out: Record<string, Guesses> = {};
  await Promise.all(
    names.map(async (n) => {
      const g = await kvGetJson<Guesses>(env.SESSIONS, keys.guess(code, roundIdx, n));
      if (g) out[n] = g;
    }),
  );
  return out;
}

async function buildState(env: Env, code: string, meta: SessionMeta): Promise<SessionStateResponse> {
  const players = await listPlayers(env.SESSIONS, code);
  const inRound = meta.roundIdx >= 0 && (meta.phase === 'answer' || meta.phase === 'guess');

  let answered: string[] = [];
  let guessed: string[] = [];
  let revealed = false;
  let answers: Record<string, Answer> | null = null;
  let guesses: Record<string, Guesses> | null = null;

  if (inRound) {
    [answered, guessed] = await Promise.all([
      listRoundNames(env, keys.answerPrefix(code, meta.roundIdx)),
      listRoundNames(env, keys.guessPrefix(code, meta.roundIdx)),
    ]);
    revealed = (await env.SESSIONS.get(keys.revealed(code, meta.roundIdx))) !== null;
  }

  const allAnswered = inRound && players.length > 0 && answered.length >= players.length;
  const allGuessed =
    inRound && players.length >= 3 && guessed.length >= players.length;

  // 전원 제출 전에는 답을 절대 내보내지 않음 — 은닉은 서버가 강제한다
  if (allAnswered) {
    answers = await collectAnswers(env, code, meta.roundIdx, answered);
  }
  if (allGuessed || (revealed && meta.phase === 'guess')) {
    guesses = await collectGuesses(env, code, meta.roundIdx, guessed);
  }

  const pastGuesses =
    (await kvGetJson<PastGuesses>(env.SESSIONS, keys.pastGuesses(code))) ?? {};

  return {
    meta,
    players,
    answered,
    answers,
    guessed,
    guesses,
    pastGuesses,
    allAnswered,
    allGuessed,
    revealed,
  };
}

async function stateResponse(env: Env, code: string, meta?: SessionMeta): Promise<Response> {
  const m = meta ?? (await requireMeta(env, code));
  return jsonResponse(await buildState(env, code, m));
}

/** 공개 조건: (2인 && 전원 답) || 전원 추측 || 호스트 강제 공개 */
function revealCondition(state: SessionStateResponse): boolean {
  return (
    (state.players.length === 2 && state.allAnswered) ||
    state.allGuessed ||
    (state.revealed && state.allAnswered)
  );
}

/* ── 액션 핸들러 ── */

async function createSession(env: Env, body: Record<string, unknown>): Promise<Response> {
  const host = typeof body.host === 'string' ? body.host.trim() : '';
  if (!isValidName(host)) {
    throw new ApiError(400, 'bad_name', '이름은 1~12자로 입력해주세요.');
  }
  const kind: Kind = isKind(body.kind) ? body.kind : 'yearend';

  let code = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    const candidate = Array.from(buf, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    if ((await env.SESSIONS.get(keys.meta(candidate))) === null) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    throw new ApiError(503, 'code_exhausted', '코드를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
  }

  const meta: SessionMeta = {
    code,
    kind,
    date: new Date().toISOString().slice(0, 10),
    host,
    phase: 'lobby',
    roundIdx: -1,
    asker: null,
    question: null,
    history: [],
  };
  await kvPutJson(env.SESSIONS, keys.meta(code), meta);
  await kvPutJson(env.SESSIONS, keys.participant(code, String(Date.now()).padStart(14, '0'), host), 1);
  return stateResponse(env, code, meta);
}

async function joinSession(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const meta = await requireMeta(env, code);
  if (meta.phase !== 'lobby') {
    throw new ApiError(409, 'already_started', '이미 시작된 호예요. 다음 라운드부터 함께하려면 호스트에게 문의!');
  }
  const players = await listPlayers(env.SESSIONS, code);
  if (players.includes(name)) {
    throw new ApiError(409, 'name_taken', '같은 이름이 이미 합류해 있어요. 다른 이름으로 참여해주세요.');
  }
  await kvPutJson(env.SESSIONS, keys.participant(code, String(Date.now()).padStart(14, '0'), name), 1);
  return stateResponse(env, code, meta);
}

async function startSession(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const meta = await requireMeta(env, code);
  if (name !== meta.host) {
    throw new ApiError(403, 'host_only', '발행인만 시작할 수 있어요.');
  }
  if (meta.phase !== 'lobby') {
    throw new ApiError(409, 'bad_phase', '이미 시작된 호예요.');
  }
  const players = await listPlayers(env.SESSIONS, code);
  if (players.length < 2) {
    throw new ApiError(409, 'not_enough_players', '2명 이상 모이면 시작할 수 있어요.');
  }
  const next: SessionMeta = { ...meta, phase: 'question', roundIdx: 0, asker: players[0], question: null };
  await kvPutJson(env.SESSIONS, keys.meta(code), next);
  return stateResponse(env, code, next);
}

async function submitQuestion(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!isValidQuestion(question)) {
    throw new ApiError(400, 'bad_question', `질문은 1~200자로 입력해주세요.`);
  }
  const meta = await requireMeta(env, code);
  if (meta.phase !== 'question') {
    throw new ApiError(409, 'bad_phase', '지금은 질문을 정하는 단계가 아니에요.');
  }
  if (name !== meta.asker) {
    throw new ApiError(403, 'asker_only', '이번 라운드의 질문자만 헤드라인을 정할 수 있어요.');
  }
  const next: SessionMeta = { ...meta, phase: 'answer', question };
  await kvPutJson(env.SESSIONS, keys.meta(code), next);
  return stateResponse(env, code, next);
}

async function submitAnswer(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!isValidAnswerText(text)) {
    throw new ApiError(400, 'bad_answer', `답변은 1~2000자로 입력해주세요.`);
  }
  const meta = await requireMeta(env, code);
  if (meta.phase !== 'answer') {
    throw new ApiError(409, 'bad_phase', '지금은 답변을 쓰는 단계가 아니에요.');
  }
  const players = await listPlayers(env.SESSIONS, code);
  if (!players.includes(name)) {
    throw new ApiError(403, 'not_a_player', '이 호에 합류한 사람만 답할 수 있어요.');
  }
  const answer: Answer = { text };
  await kvPutJson(env.SESSIONS, keys.answer(code, meta.roundIdx, name), answer);

  // 전원 제출 && 3인 이상 → guess 단계 (마지막 제출자가 전이. 동시 제출해도 동일 값으로 수렴)
  if (players.length >= 3) {
    const answered = await listRoundNames(env, keys.answerPrefix(code, meta.roundIdx));
    if (answered.length >= players.length) {
      const next: SessionMeta = { ...meta, phase: 'guess' };
      await kvPutJson(env.SESSIONS, keys.meta(code), next);
      return stateResponse(env, code, next);
    }
  }
  return stateResponse(env, code, meta);
}

async function submitGuess(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const meta = await requireMeta(env, code);
  if (meta.phase !== 'guess') {
    throw new ApiError(409, 'bad_phase', '지금은 추측 단계가 아니에요.');
  }
  const players = await listPlayers(env.SESSIONS, code);
  if (!players.includes(name)) {
    throw new ApiError(403, 'not_a_player', '이 호에 합류한 사람만 추측할 수 있어요.');
  }

  const raw = body.guesses;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ApiError(400, 'bad_guesses', '추측 형식이 올바르지 않아요.');
  }
  const guesses = raw as Record<string, unknown>;
  const others = players.filter((p) => p !== name).sort();
  const guessKeys = Object.keys(guesses).sort();
  const guessValues = Object.values(guesses);
  const valuesSorted = [...guessValues].map(String).sort();
  const isPermutation =
    guessKeys.length === others.length &&
    guessKeys.every((k, i) => k === others[i]) &&
    valuesSorted.length === others.length &&
    valuesSorted.every((v, i) => v === others[i]) &&
    guessValues.every((v) => typeof v === 'string');
  if (!isPermutation) {
    throw new ApiError(400, 'bad_guesses', '자기 답을 뺀 나머지 답에 한 이름씩 배정해주세요.');
  }

  await kvPutJson(env.SESSIONS, keys.guess(code, meta.roundIdx, name), guesses);
  return stateResponse(env, code, meta);
}

async function forceReveal(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const meta = await requireMeta(env, code);
  if (name !== meta.host) {
    throw new ApiError(403, 'host_only', '발행인만 공개할 수 있어요.');
  }
  if (meta.phase !== 'guess') {
    throw new ApiError(409, 'bad_phase', '지금은 추측 단계가 아니에요.');
  }
  await kvPutJson(env.SESSIONS, keys.revealed(code, meta.roundIdx), '1');
  return stateResponse(env, code, meta);
}

/** 현재 라운드를 history로 접고, 추측을 pastGuesses 누적에 기록 (호스트 단독 작성) */
async function foldCurrentRound(env: Env, code: string, meta: SessionMeta, state: SessionStateResponse): Promise<Round[]> {
  if (!meta.question || !state.answers) return meta.history;
  const round: Round = { asker: meta.asker ?? meta.host, question: meta.question, answers: state.answers };
  if (state.players.length >= 3) {
    const currentGuesses =
      state.guesses ?? (await collectGuesses(env, code, meta.roundIdx, state.guessed));
    const past = (await kvGetJson<PastGuesses>(env.SESSIONS, keys.pastGuesses(code))) ?? {};
    past[meta.roundIdx] = currentGuesses;
    await kvPutJson(env.SESSIONS, keys.pastGuesses(code), past);
  }
  return [...meta.history, round];
}

async function nextRound(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const meta = await requireMeta(env, code);
  if (name !== meta.host) {
    throw new ApiError(403, 'host_only', '발행인만 다음 페이지를 넘길 수 있어요.');
  }
  if (meta.phase !== 'answer' && meta.phase !== 'guess') {
    throw new ApiError(409, 'bad_phase', '아직 넘길 수 있는 단계가 아니에요.');
  }
  const state = await buildState(env, code, meta);
  if (!revealCondition(state)) {
    throw new ApiError(409, 'not_revealed', '아직 모두의 답이 공개되지 않았어요.');
  }
  const history = await foldCurrentRound(env, code, meta, state);
  const nextIdx = meta.roundIdx + 1;
  const next: SessionMeta = {
    ...meta,
    phase: 'question',
    roundIdx: nextIdx,
    asker: state.players[nextIdx % state.players.length],
    question: null,
    history,
  };
  await kvPutJson(env.SESSIONS, keys.meta(code), next);
  return stateResponse(env, code, next);
}

async function endSession(env: Env, code: string, body: Record<string, unknown>): Promise<Response> {
  const name = requireName(body);
  const meta = await requireMeta(env, code);
  if (name !== meta.host) {
    throw new ApiError(403, 'host_only', '발행인만 마감할 수 있어요.');
  }
  if (meta.phase === 'ended') {
    return stateResponse(env, code, meta);
  }
  let history = meta.history;
  if (meta.phase === 'answer' || meta.phase === 'guess') {
    const state = await buildState(env, code, meta);
    // 진행 중이던 라운드는 공개까지 갔을 때만 포함
    if (revealCondition(state)) {
      history = await foldCurrentRound(env, code, meta, state);
    }
  }
  const next: SessionMeta = { ...meta, phase: 'ended', history };
  await kvPutJson(env.SESSIONS, keys.meta(code), next);
  return stateResponse(env, code, next);
}

/* ── 라우팅 ── */

export async function handleSessionRoute(request: Request, env: Env, path: string): Promise<Response> {
  // POST /api/session
  if (path === '/api/session') {
    if (request.method !== 'POST') {
      throw new ApiError(405, 'method_not_allowed', '허용되지 않은 메서드예요.');
    }
    return createSession(env, await readBody(request));
  }

  // /api/session/:code[/:action]
  const segments = path.slice('/api/session/'.length).split('/');
  const code = (segments[0] ?? '').toUpperCase();
  const action = segments[1] ?? '';
  if (!isValidCode(code)) {
    throw new ApiError(400, 'bad_code', '코드는 4자리예요. 다시 확인해주세요.');
  }

  if (action === 'state' && request.method === 'GET') {
    return stateResponse(env, code);
  }
  if (request.method !== 'POST') {
    throw new ApiError(405, 'method_not_allowed', '허용되지 않은 메서드예요.');
  }
  const body = await readBody(request);
  switch (action) {
    case 'join': return joinSession(env, code, body);
    case 'start': return startSession(env, code, body);
    case 'question': return submitQuestion(env, code, body);
    case 'answer': return submitAnswer(env, code, body);
    case 'guess': return submitGuess(env, code, body);
    case 'reveal': return forceReveal(env, code, body);
    case 'next': return nextRound(env, code, body);
    case 'end': return endSession(env, code, body);
    default:
      throw new ApiError(404, 'not_found', '요청한 경로를 찾지 못했어요.');
  }
}
