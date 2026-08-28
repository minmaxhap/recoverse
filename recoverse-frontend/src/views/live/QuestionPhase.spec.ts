// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { SessionStateResponse } from '@recoverse/shared';
import QuestionPhase from './QuestionPhase.vue';

function questionState(asker: string): SessionStateResponse {
  return {
    meta: {
      code: 'ABCD',
      kind: 'yearend',
      date: '2026-12-31',
      host: '민희',
      phase: 'question',
      roundIdx: 0,
      asker,
      question: null,
      format: null,
      history: [],
    },
    players: [asker, '지원'],
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

describe('QuestionPhase waiting state', () => {
  it.each(['민혁', '민희'])('renders the asker %s without attaching a guessed Korean particle', (asker) => {
    const wrapper = mount(QuestionPhase, {
      props: { state: questionState(asker), me: '지원', playerToken: 'player-token' },
    });

    expect(wrapper.text()).toContain('지금 질문을 쓰는 사람');
    expect(wrapper.get('[data-testid="current-asker"]').text()).toBe(asker);
    expect(wrapper.text()).not.toContain(`${asker}이(가)`);
    expect(wrapper.text()).not.toContain(`${asker}(이)가`);
  });
});
