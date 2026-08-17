// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Issue, SessionStateResponse } from '@recoverse/shared';
import EndedView from './EndedView.vue';
import { useShelf } from '../../composables/useShelf';
import { api } from '../../lib/api';

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

function savedLiveIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'stored-live-issue',
    kind: 'yearend',
    date: '2026-12-31',
    title: '2026 연말호',
    participants: ['민희', '지원'],
    rounds: [
      { asker: '민희', question: '올해 가장 큰 변화는?', answers: { 민희: { text: '이사' }, 지원: { text: '이직' } } },
    ],
    source: 'live',
    ...overrides,
  };
}

describe('EndedView', () => {
  beforeEach(() => {
    // 빈 배열을 심고 reload — reload는 저장값이 있을 때만 메모리를 갱신하므로,
    // 싱글턴 책장이 이전 테스트의 호를 물고 오지 않게 명시적으로 비운다.
    localStorage.setItem(SHELF_KEY, '[]');
    useShelf().reload();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('saves the ended session to the shelf once', async () => {
    const wrapper = mount(EndedView, { props: { state: endedState() } });

    await wrapper.get('button.cta').trigger('click');

    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);
    expect(wrapper.get('button.cta').text()).toContain('친구에게 결과 보내기');
  });

  it('recognizes an already-saved session after a refresh and does not save a duplicate', async () => {
    // Given — 한 번 저장한 뒤
    const first = mount(EndedView, { props: { state: endedState() } });
    await first.get('button.cta').trigger('click');
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);

    // When — 같은 세션 마감 화면을 새로 마운트(새로고침 상당)
    const second = mount(EndedView, { props: { state: endedState() } });

    // Then — 이미 저장된 것으로 인식하고, 다시 눌러도 중복이 생기지 않는다
    expect(second.get('button.cta').text()).toContain('친구에게 결과 보내기');
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);
  });

  it('offers sharing only after save and persists the share id on the exact stored issue', async () => {
    // Given — 아직 책장에 꽂지 않은 마감 화면
    const createShare = vi.spyOn(api, 'createShare').mockResolvedValue({ shareId: 'token-new' });
    const writeText = vi.mocked(navigator.clipboard.writeText);
    const wrapper = mount(EndedView, { props: { state: endedState() } });

    // Then — 저장 전에는 공유 진입점이 없다
    expect(wrapper.text()).not.toContain('친구에게 결과 보내기');
    expect(createShare).not.toHaveBeenCalled();

    // When — 저장하고 곧바로 공유한다
    await wrapper.get('button.cta').trigger('click');
    const storedBeforeShare = useShelf().issues.value[0];
    expect(storedBeforeShare).toBeDefined();
    await wrapper.get('button.cta').trigger('click');
    await vi.waitFor(() => expect(createShare).toHaveBeenCalledOnce());

    // Then — API와 shareId 갱신 모두 실제 책장 객체를 대상으로 한다
    expect(createShare).toHaveBeenCalledWith(storedBeforeShare);
    expect(useShelf().issues.value).toHaveLength(1);
    expect(useShelf().issues.value[0]?.id).toBe(storedBeforeShare?.id);
    expect(useShelf().issues.value[0]?.shareId).toBe('token-new');
    expect(wrapper.get('.shareUrl').text()).toBe(`${window.location.origin}/shared/token-new`);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/shared/token-new`);
  });

  it('shares the fingerprint-matched stored id after refresh without adding a duplicate', async () => {
    // Given — 같은 내용이 이전 방문에서 다른 id로 이미 저장돼 있다
    localStorage.setItem(SHELF_KEY, JSON.stringify([savedLiveIssue()]));
    useShelf().reload();
    const createShare = vi.spyOn(api, 'createShare').mockResolvedValue({ shareId: 'token-refresh' });

    // When — 마감 화면을 다시 열고 공유한다
    const wrapper = mount(EndedView, { props: { state: endedState() } });
    expect(wrapper.text()).not.toContain('내 책장에 이번 호 꽂기');
    await wrapper.get('button.cta').trigger('click');
    await vi.waitFor(() => expect(createShare).toHaveBeenCalledOnce());

    // Then — 새 pending id가 아니라 기존 저장 id를 사용한다
    expect(createShare.mock.calls[0]?.[0].id).toBe('stored-live-issue');
    expect(useShelf().issues.value).toHaveLength(1);
    expect(useShelf().issues.value[0]?.id).toBe('stored-live-issue');
    expect(useShelf().issues.value[0]?.shareId).toBe('token-refresh');
  });

  it('reuses an existing share id without creating another share', async () => {
    // Given — 저장된 호에 공유 id가 이미 있다
    localStorage.setItem(SHELF_KEY, JSON.stringify([savedLiveIssue({ shareId: 'token-existing' })]));
    useShelf().reload();
    const createShare = vi.spyOn(api, 'createShare');
    const writeText = vi.mocked(navigator.clipboard.writeText);
    const wrapper = mount(EndedView, { props: { state: endedState() } });

    // When
    await wrapper.get('button.cta').trigger('click');

    // Then
    expect(createShare).not.toHaveBeenCalled();
    expect(wrapper.get('.shareUrl').text()).toBe(`${window.location.origin}/shared/token-existing`);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/shared/token-existing`);
    expect(useShelf().issues.value).toHaveLength(1);
  });
});
