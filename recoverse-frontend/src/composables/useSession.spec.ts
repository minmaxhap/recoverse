// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { ApiError } from '../lib/api';
import { api } from '../lib/api';
import { useSession } from './useSession';

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return { ...actual, api: { ...actual.api, state: vi.fn() } };
});

const state = vi.mocked(api.state);

describe('useSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats a 404 as a terminal missing state and stops polling', async () => {
    // Given
    state.mockRejectedValue(new ApiError(404, 'session_not_found', '없어요'));

    // When
    const session = useSession('ABCD');
    await flushPromises();

    // Then — 재시도 가치 없는 종료 상태로 표시하고 에러 배너는 띄우지 않는다
    expect(session.missing.value).toBe(true);
    expect(session.error.value).toBe('');
    expect(session.loading.value).toBe(false);

    // 폴링이 멈췄는지 — 타이머를 모두 돌려도 추가 요청이 없어야 한다
    const callsAfterMissing = state.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10000);
    expect(state.mock.calls.length).toBe(callsAfterMissing);

    session.stop();
  });

  it('keeps retrying on a transient error without marking the session missing', async () => {
    // Given
    state.mockRejectedValue(new ApiError(500, 'internal', '서버 오류'));

    // When
    const session = useSession('ABCD');
    await flushPromises();

    // Then
    expect(session.missing.value).toBe(false);
    expect(session.error.value).toContain('연결이 불안정');

    session.stop();
  });

  it('clears the missing state when the caller asks for a manual refresh', async () => {
    // Given a session that first 404s, then recovers
    state.mockRejectedValueOnce(new ApiError(404, 'session_not_found', '없어요'));
    const session = useSession('ABCD');
    await flushPromises();
    expect(session.missing.value).toBe(true);

    // When — 서버가 돌아온 뒤 수동 새로고침
    state.mockResolvedValueOnce({
      meta: {
        code: 'ABCD',
        kind: 'yearend',
        date: '2026-12-31',
        host: '나',
        phase: 'lobby',
        roundIdx: -1,
        asker: null,
        question: null,
        format: null,
        history: [],
      },
      players: ['나'],
      answered: [],
      answers: null,
      guessed: [],
      guesses: null,
      pastGuesses: {},
      allAnswered: false,
      allGuessed: false,
      revealed: false,
    });
    session.refreshNow();
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();

    // Then
    expect(session.missing.value).toBe(false);
    expect(session.state.value?.meta.code).toBe('ABCD');

    session.stop();
  });
});
