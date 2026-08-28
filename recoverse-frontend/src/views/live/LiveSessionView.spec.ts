// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionStateResponse } from '@recoverse/shared';
import AnswerPhase from './AnswerPhase.vue';
import LiveSessionView from './LiveSessionView.vue';
import RevealSpread from './RevealSpread.vue';

const sessionState = ref<SessionStateResponse | null>(null);

vi.mock('../../composables/useSession', () => ({
  useSession: () => ({
    state: sessionState,
    error: ref(''),
    loading: ref(false),
    missing: ref(false),
    apply: vi.fn(),
    refreshNow: vi.fn(),
  }),
}));

function liveState(
  players: readonly string[],
  phase: SessionStateResponse['meta']['phase'],
  overrides: Partial<Pick<SessionStateResponse, 'allAnswered' | 'allGuessed' | 'revealed'>> = {},
): SessionStateResponse {
  return {
    meta: {
      code: 'ABCD',
      kind: 'yearend',
      date: '2026-12-31',
      host: players[0] ?? '민희',
      phase,
      roundIdx: 0,
      asker: players[0] ?? null,
      question: '올해 가장 기억에 남는 순간은?',
      format: null,
      history: [],
    },
    players: [...players],
    answered: [...players],
    answers: Object.fromEntries(players.map((name) => [name, { text: `${name}의 답` }])),
    guessed: [],
    guesses: null,
    pastGuesses: {},
    allAnswered: overrides.allAnswered ?? true,
    allGuessed: overrides.allGuessed ?? false,
    revealed: overrides.revealed ?? false,
  };
}

function mountView() {
  return mount(LiveSessionView, {
    props: { code: 'ABCD', me: '민희', isHost: false, playerToken: 'player-token' },
    global: {
      stubs: {
        AppShell: { template: '<main><slot /></main>' },
        LobbyPhase: { template: '<div data-phase="lobby" />' },
        QuestionPhase: { template: '<div data-phase="question" />' },
        AnswerPhase: { template: '<div data-phase="answer" />' },
        GuessPhase: { template: '<div data-phase="guess" />' },
        RevealSpread: { template: '<div data-phase="reveal" />' },
        EndedView: { template: '<div data-phase="ended" />' },
      },
    },
  });
}

describe('LiveSessionView player-count boundary', () => {
  beforeEach(() => {
    sessionState.value = null;
  });

  it('reveals two-player answers directly without mounting the guessing phase', () => {
    sessionState.value = liveState(['민희', '지원'], 'answer');

    const wrapper = mountView();

    expect(wrapper.find('[data-phase="reveal"]').exists()).toBe(true);
    expect(wrapper.find('[data-phase="guess"]').exists()).toBe(false);
  });

  it('keeps three-player answers in guessing until every guess is submitted', async () => {
    sessionState.value = liveState(['민희', '지원', '수현'], 'guess');
    const wrapper = mountView();

    expect(wrapper.find('[data-phase="guess"]').exists()).toBe(true);
    expect(wrapper.find('[data-phase="reveal"]').exists()).toBe(false);

    sessionState.value = liveState(['민희', '지원', '수현'], 'guess', { allGuessed: true });
    await nextTick();

    expect(wrapper.find('[data-phase="guess"]').exists()).toBe(false);
    expect(wrapper.find('[data-phase="reveal"]').exists()).toBe(true);
  });
});

describe('live waiting and control copy', () => {
  it('promises a result rather than a spread after two-player answers', () => {
    const state = liveState(['민희', '지원'], 'answer', { allAnswered: false });
    state.answered = ['민희'];
    const wrapper = mount(AnswerPhase, {
      props: { state, me: '민희', playerToken: 'player-token' },
    });

    expect(wrapper.text()).toContain('모두 제출하면 결과가 열려요');
  });

  it('uses direct host and next-question language on the reveal screen', () => {
    const state = liveState(['민희', '지원'], 'answer');
    const guest = mount(RevealSpread, {
      props: { state, me: '지원', isHost: false, playerToken: 'player-token' },
    });
    const host = mount(RevealSpread, {
      props: { state, me: '민희', isHost: true, playerToken: 'host-token' },
    });

    expect(guest.text()).toContain('방장이 다음 질문을 시작하길 기다리는 중…');
    expect(host.get('button.cta').text()).toBe('다음 질문 시작하기 (지원 차례)');
  });
});
