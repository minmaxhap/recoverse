// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SOLO_ISSUE_DRAFT_V2_KEY, type SoloIssueDraftV2 } from '../composables/useSoloIssueDraft';
import type { RediscoveryMoment } from '../lib/rediscover';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

const moment: RediscoveryMoment = {
  groupKey: 'key',
  question: '올해 가장 잘한 선택은?',
  date: '2025-03-02',
  year: '2025',
  yearsAgo: 1,
  issueTitle: '2025 회고',
  participants: ['나'],
  answers: { 나: { text: '이직' } },
  anniversary: false,
};

function storeDraft(): void {
  localStorage.setItem(
    SOLO_ISSUE_DRAFT_V2_KEY,
    JSON.stringify({
      version: 2,
      updatedAt: '2026-08-28T09:00:00.000Z',
      kind: 'free',
      title: '',
      name: '나',
      sourceIssueId: '',
      rounds: [{ asker: '나', question: '요즘 떠오르는 장면은?', answers: { 나: { text: '퇴근길 하늘' } } }],
      currentRound: { question: '', formatId: '', answers: {} },
      soloMode: 'free',
    } satisfies SoloIssueDraftV2),
  );
}

async function mountCover(): Promise<VueWrapper> {
  vi.resetModules();
  const component = await import('./CoverView.vue');
  return mount(component.default, { props: { issues: [], moment } });
}

describe('CoverView', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: createMemoryStorage() });
    // 설정 패널이 테마 선호를 묻는다 — jsdom에는 없는 API라 세워 둔다.
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn() })));
  });

  it('opens the rediscovery card when there is nothing waiting to be finished', async () => {
    // Given / When
    const wrapper = await mountCover();

    // Then
    expect(wrapper.find('.momentCard').exists()).toBe(true);
    expect(wrapper.find('.momentFolded').exists()).toBe(false);
    expect(wrapper.find('.resumeCard').exists()).toBe(false);
  });

  it('folds the rediscovery card under the draft, so only one thing is being asked for', async () => {
    // Given
    storeDraft();

    // When
    const wrapper = await mountCover();

    // Then: 두 장의 카드가 나란히 서면 고르는 일이 생긴다 — 재발견은 한 줄로 접힌다
    expect(wrapper.find('.resumeCard').exists()).toBe(true);
    expect(wrapper.find('.momentCard').exists()).toBe(false);
    expect(wrapper.get('.momentFolded').text()).toContain('올해 가장 잘한 선택은?');

    // Then: 접힌 줄은 이어쓰기 아래에 온다 — 이어 쓰던 손을 먼저 세우지 않는다
    const order = wrapper.findAll('.resumeCard, .momentFolded').map((el) => el.classes()[0]);
    expect(order).toEqual(['resumeCard', 'momentFolded']);
  });

  it('empties the draft on the second tap and gives the rediscovery card its place back', async () => {
    // Given
    storeDraft();
    const wrapper = await mountCover();

    // When
    await wrapper.get('.discardLink').trigger('click');
    await wrapper.get('.discardYes').trigger('click');

    // Then
    expect(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY)).toBe('');
    expect(wrapper.find('.resumeCard').exists()).toBe(false);
    expect(wrapper.find('.momentCard').exists()).toBe(true);
    expect(wrapper.find('.momentFolded').exists()).toBe(false);
  });
});
