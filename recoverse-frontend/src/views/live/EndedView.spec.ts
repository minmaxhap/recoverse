// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Issue, SessionStateResponse } from '@recoverse/shared';
import EndedView from './EndedView.vue';
import { useShelf } from '../../composables/useShelf';
import { api, ApiError } from '../../lib/api';

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
    vi.restoreAllMocks();
    // 빈 배열을 심고 reload — reload는 저장값이 있을 때만 메모리를 갱신하므로,
    // 싱글턴 책장이 이전 테스트의 호를 물고 오지 않게 명시적으로 비운다.
    localStorage.setItem(SHELF_KEY, '[]');
    useShelf().reload();
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
    expect(wrapper.get('.shareUrlInput').attributes('value')).toBe(`${window.location.origin}/shared/token-new`);
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
    expect(wrapper.get('.shareUrlInput').attributes('value')).toBe(`${window.location.origin}/shared/token-existing`);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/shared/token-existing`);
    expect(useShelf().issues.value).toHaveLength(1);
  });

  it('keeps the saved issue and lets an API failure retry from the focused action', async () => {
    // Given — 저장은 끝났지만 첫 공유 API 요청이 실패한다
    localStorage.setItem(SHELF_KEY, JSON.stringify([savedLiveIssue()]));
    useShelf().reload();
    const createShare = vi.spyOn(api, 'createShare')
      .mockRejectedValueOnce(new ApiError(503, 'offline', 'offline'))
      .mockResolvedValueOnce({ shareId: 'token-retry' });
    const wrapper = mount(EndedView, { props: { state: endedState() }, attachTo: document.body });

    // When — 공유를 시도한다
    await wrapper.get('button.cta').trigger('click');
    await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe(
      '공유 링크를 만들지 못했어요. 저장된 기록은 그대로예요. 다시 시도해 주세요.',
    ));

    // Then — 저장본과 재시도 동선을 유지한다
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);
    expect(wrapper.find('.shareUrlInput').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('button.cta').element);
    expect(wrapper.get('button.cta').attributes('aria-busy')).toBe('false');

    await wrapper.get('button.cta').trigger('click');
    await vi.waitFor(() => expect(createShare).toHaveBeenCalledTimes(2));
    expect(wrapper.get('.shareUrlInput').attributes('value')).toBe(
      `${window.location.origin}/shared/token-retry`,
    );
    wrapper.unmount();
  });

  it('keeps an unpersisted share usable and reuses it for repeated clicks in the same mount', async () => {
    // Given — API는 성공하지만 shareId를 책장에 다시 쓰는 데 실패한다
    localStorage.setItem(SHELF_KEY, JSON.stringify([savedLiveIssue()]));
    useShelf().reload();
    const createShare = vi.spyOn(api, 'createShare').mockResolvedValue({ shareId: 'token-memory' });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const wrapper = mount(EndedView, { props: { state: endedState() }, attachTo: document.body });

    // When — 공유하고 같은 화면에서 한 번 더 누른다
    await wrapper.get('button.cta').trigger('click');
    await vi.waitFor(() => expect(wrapper.get('.shareUrlInput').attributes('value')).toBe(
      `${window.location.origin}/shared/token-memory`,
    ));
    expect(wrapper.get('[role="alert"]').text()).toBe(
      '링크는 만들었지만 다음 방문에 기억하지 못했어요. 지금 복사해 두세요.',
    );
    expect(document.activeElement).toBe(wrapper.get('.shareUrlInput').element);
    await wrapper.get('button.cta').trigger('click');

    // Then — URL은 계속 쓸 수 있고 API는 중복 호출하지 않는다
    await vi.waitFor(() => expect(createShare).toHaveBeenCalledOnce());
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toEqual([savedLiveIssue()]);

    // When — 화면을 새로 마운트하면 메모리 캐시는 사라진다
    wrapper.unmount();
    setItem.mockRestore();
    const remounted = mount(EndedView, { props: { state: endedState() } });
    await remounted.get('button.cta').trigger('click');

    // Then — 다음 방문에는 API에서 새 링크를 다시 만든다
    await vi.waitFor(() => expect(createShare).toHaveBeenCalledTimes(2));
  });

  it('announces clipboard success without exposing a false manual-copy warning', async () => {
    // Given — 저장된 공유 id와 쓸 수 있는 클립보드
    localStorage.setItem(SHELF_KEY, JSON.stringify([savedLiveIssue({ shareId: 'token-copy' })]));
    useShelf().reload();
    const wrapper = mount(EndedView, { props: { state: endedState() } });

    // When
    await wrapper.get('button.cta').trigger('click');

    // Then
    expect(wrapper.get('[role="status"]').text()).toBe('링크를 복사했어요.');
    expect(wrapper.text()).not.toContain('링크를 길게 눌러 복사해 주세요.');
    expect(wrapper.get('.shareUrlInput').attributes('readonly')).toBeDefined();
  });

  it.each([
    ['거부된', true],
    ['없는', false],
  ])('shows and focuses a selectable URL when the clipboard is %s', async (_label, hasClipboard) => {
    // Given — 저장된 공유 id와 사용할 수 없는 클립보드
    localStorage.setItem(SHELF_KEY, JSON.stringify([savedLiveIssue({ shareId: 'token-manual' })]));
    useShelf().reload();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: hasClipboard
        ? { writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) }
        : undefined,
    });
    const wrapper = mount(EndedView, { props: { state: endedState() }, attachTo: document.body });

    // When
    await wrapper.get('button.cta').trigger('click');

    // Then — API 오류로 오인하지 않고 직접 복사할 수 있다
    const input = wrapper.get<HTMLInputElement>('.shareUrlInput');
    expect(input.attributes('value')).toBe(`${window.location.origin}/shared/token-manual`);
    expect(input.attributes('readonly')).toBeDefined();
    expect(wrapper.get('[role="status"]').text()).toBe('링크를 길게 눌러 복사해 주세요.');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(document.activeElement).toBe(input.element);
    expect(input.element.selectionStart).toBe(0);
    expect(input.element.selectionEnd).toBe(input.element.value.length);
    wrapper.unmount();
  });

  it('marks the share action busy and ignores repeated clicks while the API is pending', async () => {
    // Given — 아직 끝나지 않은 API 요청
    localStorage.setItem(SHELF_KEY, JSON.stringify([savedLiveIssue()]));
    useShelf().reload();
    let resolveShare: ((value: { shareId: string }) => void) | undefined;
    const createShare = vi.spyOn(api, 'createShare').mockImplementation(() => new Promise((resolve) => {
      resolveShare = resolve;
    }));
    const wrapper = mount(EndedView, { props: { state: endedState() } });

    // When — 사용자가 빠르게 두 번 누른다
    await wrapper.get('button.cta').trigger('click');
    await wrapper.get('button.cta').trigger('click');

    // Then — 한 요청만 진행되고 상태가 보조기기에 전달된다
    expect(createShare).toHaveBeenCalledOnce();
    expect(wrapper.get('button.cta').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('button.cta').attributes('disabled')).toBeDefined();

    resolveShare?.({ shareId: 'token-pending' });
    await vi.waitFor(() => expect(wrapper.get('button.cta').attributes('aria-busy')).toBe('false'));
  });
});
