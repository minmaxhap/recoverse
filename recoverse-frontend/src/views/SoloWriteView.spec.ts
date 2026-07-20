// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Issue, Round } from '@recoverse/shared';
import { SOLO_ISSUE_DRAFT_V2_KEY, type SoloIssueDraftV2 } from '../composables/useSoloIssueDraft';

const SHELF_KEY = 'recoverse_issues_v1';

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

function issue(id: string): Issue {
  return {
    id,
    kind: 'yearend',
    date: '2025-12-31',
    title: '2025 Year End',
    participants: ['Mina'],
    rounds: [{ asker: 'Mina', question: 'Source question?', format: 'three-scenes', answers: { Mina: { text: 'Then' } } }],
    source: 'solo',
  };
}

function draft(sourceIssueId = 'source-1'): SoloIssueDraftV2 {
  const rounds: readonly Round[] = [
    { asker: 'Mina', question: 'Finished question?', answers: { Mina: { text: 'Finished answer' } } },
  ];
  return {
    version: 2,
    updatedAt: '2026-07-19T12:00:00.000Z',
    kind: 'yearend',
    title: 'Recovered issue',
    name: 'Mina',
    sourceIssueId,
    rounds,
    currentRound: {
      question: 'Current question?',
      formatId: '',
      answers: { Mina: 'Current answer' },
    },
  };
}

function savedTimeText(savedAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(savedAt),
  );
}

async function mountSolo(): Promise<VueWrapper> {
  vi.resetModules();
  const component = await import('./SoloWriteView.vue');
  return mount(component.default);
}

async function flushDraftSave(): Promise<void> {
  await nextTick();
  await nextTick();
}

describe('SoloWriteView', () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it('restores every visible solo draft field after remount', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft()));

    // When
    const wrapper = await mountSolo();

    // Then
    expect(wrapper.text()).toContain('복원됨');
    expect(wrapper.find('.draftState').text()).toBe(`저장됨 ${savedTimeText(draft().updatedAt)}`);
    expect(wrapper.find('.draftState').text()).not.toBe('저장 준비 중');
    expect((wrapper.find('input[placeholder="나"]').element as HTMLInputElement).value).toBe('Mina');
    expect((wrapper.find('input[placeholder]').element as HTMLInputElement).value).toBe('Recovered issue');
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('source-1');
    const inputValues = wrapper.findAll('input.field').map((input) => (input.element as HTMLInputElement).value);
    expect(inputValues).toContain('Current question?');
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Current answer');
    expect(wrapper.text()).toContain('Finished question?');
  });

  it('clears only a restored stale source id and keeps written content', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('other-source')]));
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft('missing-source')));

    // When
    const wrapper = await mountSolo();
    await flushDraftSave();

    // Then
    const saved = JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}') as SoloIssueDraftV2;
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('');
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Current answer');
    expect(saved.sourceIssueId).toBe('');
    expect(saved.title).toBe('Recovered issue');
    expect(saved.currentRound.answers).toEqual({ Mina: 'Current answer' });
  });

  it('clears the full draft only after publish succeeds', async () => {
    // Given
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft()));
    const wrapper = await mountSolo();

    // When
    await wrapper.find('button.cta').trigger('click');

    // Then
    expect(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY)).toBe('');
  });

  it('preserves the full draft and shows guidance when publish cannot write to shelf', async () => {
    // Given
    const storage = createMemoryStorage();
    const fixture = draft();
    storage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SHELF_KEY) throw new Error('quota exceeded');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();

    // When
    await wrapper.find('button.cta').trigger('click');

    // Then
    expect(wrapper.find('[role="alert"]').text()).toContain('저장 공간');
    expect(JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}')).toMatchObject(fixture);
  });

  it('stays on the write screen and surfaces guidance when clearing the draft fails after shelf save succeeds', async () => {
    // Given
    const storage = createMemoryStorage();
    // 소스 호가 없는 드래프트로 격리 — 마운트 시 스테일 소스 정리가 드래프트를 재저장하지 않게 한다.
    const fixture = draft('');
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY && value === '') throw new Error('clear failed');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();

    // When
    await wrapper.find('button.cta').trigger('click');

    // Then
    expect(wrapper.find('[role="alert"]').text()).toContain('임시 저장을 비우지 못했어요');
    expect(wrapper.find('.publishOverlay').exists()).toBe(false);
    expect(wrapper.emitted('published')).toBeUndefined();
    expect(JSON.parse(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY) ?? '{}')).toMatchObject(fixture);
    expect(JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]')).toHaveLength(1);
  });

  it('shows persistent editorial guidance and no saved timestamp when draft save fails', async () => {
    // Given
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY) throw new Error('quota exceeded');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();

    // When
    await wrapper.find('input[placeholder="나"]').setValue('Mina');
    await flushDraftSave();

    // Then
    expect(wrapper.text()).not.toMatch(/저장됨 \d{2}:\d{2}/);
    expect(wrapper.find('[role="alert"]').text()).toContain('임시 저장하지 못했어요');
    expect(wrapper.find('[role="alert"]').text()).toContain('다시 시도');
  });

  it('hides the restored success notice and keeps only failure guidance when a later draft save fails', async () => {
    // Given
    const storage = createMemoryStorage();
    const fixture = draft();
    storage.setItem(SHELF_KEY, JSON.stringify([issue('source-1')]));
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY) throw new Error('quota exceeded');
          storage.setItem(key, value);
        },
      } satisfies Storage,
    });
    const wrapper = await mountSolo();

    // When
    await wrapper.find('input[placeholder="나"]').setValue('Joon');
    await flushDraftSave();

    // Then
    expect(wrapper.text()).not.toContain('복원됨');
    expect(wrapper.text()).not.toMatch(/저장됨 \d{2}:\d{2}/);
    expect(wrapper.find('.draftState').text()).toBe('저장 실패');
    expect(wrapper.find('[role="alert"]').text()).toContain('임시 저장하지 못했어요');
  });
});
