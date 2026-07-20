// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionStateResponse } from '@recoverse/shared';
import EndedView from './EndedView.vue';
import { useShelf } from '../../composables/useShelf';

const SHELF_KEY = 'recoverse_issues_v1';

function endedState(): SessionStateResponse {
  return {
    meta: {
      code: 'ABCD',
      kind: 'yearend',
      date: '2026-12-31',
      host: '민희',
      phase: 'ended',
      roundIdx: 1,
      asker: null,
      question: null,
      format: null,
      history: [
        { asker: '민희', question: '올해 가장 큰 변화는?', answers: { 민희: { text: '이사' }, 지원: { text: '이직' } } },
      ],
    },
    players: ['민희', '지원'],
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

describe('EndedView', () => {
  beforeEach(() => {
    // 빈 배열을 심고 reload — reload는 저장값이 있을 때만 메모리를 갱신하므로,
    // 싱글턴 책장이 이전 테스트의 호를 물고 오지 않게 명시적으로 비운다.
    localStorage.setItem(SHELF_KEY, '[]');
    useShelf().reload();
  });

  it('saves the ended session to the shelf once', async () => {
    const wrapper = mount(EndedView, { props: { state: endedState() } });

    await wrapper.get('button.cta').trigger('click');

    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);
    expect(wrapper.get('button.cta').text()).toContain('책장에 꽂아뒀어요');
  });

  it('recognizes an already-saved session after a refresh and does not save a duplicate', async () => {
    // Given — 한 번 저장한 뒤
    const first = mount(EndedView, { props: { state: endedState() } });
    await first.get('button.cta').trigger('click');
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);

    // When — 같은 세션 마감 화면을 새로 마운트(새로고침 상당)
    const second = mount(EndedView, { props: { state: endedState() } });

    // Then — 이미 저장된 것으로 인식하고, 다시 눌러도 중복이 생기지 않는다
    expect(second.get('button.cta').text()).toContain('책장에 꽂아뒀어요');
    await second.get('button.cta').trigger('click');
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);
  });
});
