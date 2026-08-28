// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { SessionStateResponse } from '@recoverse/shared';
import LobbyPhase from './LobbyPhase.vue';

function lobbyState(players: readonly string[]): SessionStateResponse {
  return {
    meta: {
      code: 'ABCD',
      kind: 'yearend',
      date: '2026-12-31',
      host: '민희',
      phase: 'lobby',
      roundIdx: -1,
      asker: null,
      question: null,
      format: null,
      history: [],
    },
    players: [...players],
    answered: [],
    answers: null,
    guessed: [],
    guesses: null,
    pastGuesses: {},
    allAnswered: false,
    allGuessed: false,
    revealed: false,
  };
}

describe('LobbyPhase', () => {
  it('tells a solo host exactly what is needed before starting', () => {
    const wrapper = mount(LobbyPhase, {
      props: { state: lobbyState(['민희']), isHost: true, me: '민희', playerToken: 'host-token' },
    });

    const action = wrapper.get('button.cta');
    expect(action.attributes('disabled')).toBeDefined();
    expect(action.text()).toBe('한 명 더 오면 시작할 수 있어요');
    expect(wrapper.text()).toContain('방장');
  });

  it('lets two players start and explains the optional third-player game', () => {
    const wrapper = mount(LobbyPhase, {
      props: { state: lobbyState(['민희', '지원']), isHost: true, me: '민희', playerToken: 'host-token' },
    });

    const action = wrapper.get('button.cta');
    expect(action.attributes('disabled')).toBeUndefined();
    expect(action.text()).toBe('지금 시작하기');
    expect(wrapper.text()).toContain('한 명 더 오면 ‘누가 썼게’도 열려요');
  });

  it('starts the guessing game once three players have joined', () => {
    const wrapper = mount(LobbyPhase, {
      props: {
        state: lobbyState(['민희', '지원', '수현']),
        isHost: true,
        me: '민희',
        playerToken: 'host-token',
      },
    });

    const action = wrapper.get('button.cta');
    expect(action.attributes('disabled')).toBeUndefined();
    expect(action.text()).toBe('누가 썼게 시작하기');
  });

  it('gives a non-host a direct waiting instruction', () => {
    const wrapper = mount(LobbyPhase, {
      props: { state: lobbyState(['민희', '지원']), isHost: false, me: '지원', playerToken: 'player-token' },
    });

    expect(wrapper.text()).toContain('방장이 시작하면 첫 질문이 열려요.');
    expect(wrapper.find('button.cta').exists()).toBe(false);
  });
});
