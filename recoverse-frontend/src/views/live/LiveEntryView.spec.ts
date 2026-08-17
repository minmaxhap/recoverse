// @vitest-environment jsdom

import type { SessionEntryResponse } from '@recoverse/shared';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../../lib/api';
import LiveEntryView from './LiveEntryView.vue';

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api')>();
  return {
    ...actual,
    api: {
      ...actual.api,
      createSession: vi.fn(),
      join: vi.fn(),
    },
  };
});

const createSession = vi.mocked(api.createSession);
const join = vi.mocked(api.join);

function entryResponse(code: string, host: string): SessionEntryResponse {
  return {
    meta: {
      code,
      kind: 'yearend',
      date: '2026-08-18',
      host,
      phase: 'lobby',
      roundIdx: -1,
      asker: null,
      question: null,
      format: null,
      history: [],
    },
    players: [host],
    answered: [],
    answers: null,
    guessed: [],
    guesses: null,
    pastGuesses: {},
    allAnswered: false,
    allGuessed: false,
    revealed: false,
    playerToken: 'player-token',
  };
}

describe('LiveEntryView', () => {
  beforeEach(() => {
    createSession.mockReset();
    join.mockReset();
    sessionStorage.clear();
  });

  it('uses plain create copy and explains privacy and the three-person bonus', () => {
    // Given / When
    const wrapper = mount(LiveEntryView, { props: { intent: 'create' } });

    // Then
    expect(wrapper.text()).toContain('친구들과 시작');
    expect(wrapper.get('h1').text()).toBe('누구와 질문 놀이를 시작할까요?');
    expect(wrapper.get('label[for="playerName"]').text()).toBe('내 이름');
    expect(wrapper.get('button.cta').text()).toBe('방 만들기');
    expect(wrapper.text()).toContain('초대 코드를 받은 사람들과 답을 함께 봐요.');
    expect(wrapper.text()).toContain('3명부터 ‘누가 썼게’도 열려요.');
    expect(wrapper.text()).not.toContain('프로토타입');
    expect(wrapper.text()).not.toContain('공유 저장소');
  });

  it('keeps kind optional, collapsed, and keyboard reachable', () => {
    // Given / When
    const wrapper = mount(LiveEntryView, { props: { intent: 'create' } });

    // Then
    const details = wrapper.get('details');
    expect(details.attributes('open')).toBeUndefined();
    expect(details.get('summary').text()).toContain('모임 성격 (선택)');
    expect(details.get('summary').element.tabIndex).toBe(0);
    expect(wrapper.get('#playerName').attributes('aria-label')).toBe('내 이름');
    expect(wrapper.get('button.cta').attributes('type')).toBe('button');
  });

  it('submits the original default kind and trimmed create name', async () => {
    // Given
    createSession.mockResolvedValue(entryResponse('ROOM', '민지'));
    const wrapper = mount(LiveEntryView, { props: { intent: 'create' } });
    await wrapper.get('#playerName').setValue('  민지  ');

    // When
    await wrapper.get('button.cta').trigger('click');
    await flushPromises();

    // Then
    expect(createSession).toHaveBeenCalledWith('민지', 'yearend');
    expect(wrapper.emitted('entered')).toEqual([['ROOM']]);
  });

  it('uses plain join copy and submits a normalized code and name', async () => {
    // Given
    join.mockResolvedValue(entryResponse('ABCD', '준호'));
    const wrapper = mount(LiveEntryView, { props: { intent: 'join' } });
    await wrapper.get('#sessionCode').setValue('abcd');
    await wrapper.get('#playerName').setValue('  준호  ');

    // When
    await wrapper.get('button.cta').trigger('click');
    await flushPromises();

    // Then
    expect(wrapper.get('h1').text()).toBe('초대 코드로 들어가기');
    expect(wrapper.get('button.cta').text()).toBe('들어가기');
    expect(join).toHaveBeenCalledWith('ABCD', '준호');
    expect(wrapper.emitted('entered')).toEqual([['ABCD']]);
  });

  it('disables the primary action while the request is pending', async () => {
    // Given
    createSession.mockReturnValue(new Promise<SessionEntryResponse>(() => undefined));
    const wrapper = mount(LiveEntryView, { props: { intent: 'create' } });
    await wrapper.get('#playerName').setValue('민지');

    // When
    await wrapper.get('button.cta').trigger('click');

    // Then
    expect(wrapper.get('button.cta').attributes('disabled')).toBeDefined();
    expect(wrapper.get('button.cta').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('[role="status"]').text()).toContain('연결하고 있어요');
  });

  it('announces an API error, preserves input, and allows retry', async () => {
    // Given
    createSession.mockRejectedValueOnce(new ApiError(503, 'unavailable', '잠시 길을 잃었어요.'));
    const wrapper = mount(LiveEntryView, { props: { intent: 'create' } });
    await wrapper.get('#playerName').setValue('민지');

    // When
    await wrapper.get('button.cta').trigger('click');
    await flushPromises();

    // Then
    expect(wrapper.get('[role="alert"]').text()).toBe('잠시 길을 잃었어요.');
    expect(wrapper.get<HTMLInputElement>('#playerName').element.value).toBe('민지');
    expect(wrapper.get('button.cta').attributes('disabled')).toBeUndefined();
  });
});
