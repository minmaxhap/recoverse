// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import type { Issue } from '@recoverse/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CoverShelf from './CoverShelf.vue';

const issues: readonly Issue[] = [
  {
    id: 'older',
    kind: 'yearend',
    date: '2025-12-31',
    title: '지난 기록',
    participants: ['민아'],
    rounds: [{ asker: '민아', question: '지난 질문?', answers: { 민아: { text: '지난 답' } } }],
    source: 'solo',
  },
  {
    id: 'fresh',
    kind: 'yearend',
    date: '2026-08-05',
    title: '새 기록',
    participants: ['민아'],
    rounds: [{ asker: '민아', question: '새 질문?', answers: { 민아: { text: '새 답' } } }],
    source: 'solo',
  },
];

class ResizeObserverStub {
  observe(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CoverShelf fresh issue', () => {
  it('marks the existing cover visibly and in its accessible name without duplicating it', () => {
    const wrapper = mount(CoverShelf, { props: { issues, freshIssueId: 'fresh' } });

    const covers = wrapper.findAll('.issueCover');
    expect(covers).toHaveLength(issues.length);
    expect(wrapper.findAll('.freshFlag')).toHaveLength(1);
    expect(wrapper.get('.freshFlag').text()).toBe('방금 남긴 기록');
    expect(covers.filter((cover) => cover.attributes('aria-label')?.includes('방금 남긴 기록'))).toHaveLength(1);
    expect(covers.find((cover) => cover.attributes('aria-label')?.includes('새 기록'))?.classes()).toContain('fresh');
  });

  it('keeps the fresh state class available under reduced motion and removes it after the timer', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const wrapper = mount(CoverShelf, { props: { issues, freshIssueId: 'fresh' } });

    expect(wrapper.get('[aria-label*="새 기록"]').classes()).toContain('fresh');
    await vi.advanceTimersByTimeAsync(3_200);
    expect(wrapper.get('[aria-label*="새 기록"]').classes()).not.toContain('fresh');
    expect(wrapper.find('.freshFlag').exists()).toBe(false);
  });
});
