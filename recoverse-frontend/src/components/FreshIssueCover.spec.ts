// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import type { Issue } from '@recoverse/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FreshIssueCoverSource from './FreshIssueCover.vue?raw';
import FreshIssueCover from './FreshIssueCover.vue';

const issue: Issue = {
  id: 'fresh',
  kind: 'yearend',
  date: '2026-08-05',
  title: '새 기록',
  participants: ['민아'],
  rounds: [{ asker: '민아', question: '새 질문?', answers: { 민아: { text: '새 답' } } }],
  source: 'solo',
};

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

describe('FreshIssueCover', () => {
  it('delegates the visible and accessible fresh state to IssueCover', () => {
    const wrapper = mount(FreshIssueCover, { props: { issue, no: 1, fresh: true } });

    expect(wrapper.get('.issueCover').classes()).toContain('fresh');
    expect(wrapper.get('.issueCover').attributes('aria-label')).toContain('방금 남긴 기록');
    expect(wrapper.get('.freshFlag').text()).toBe('방금 남긴 기록');
  });

  it('runs exactly one timer and removes the fresh state after 3,200ms', async () => {
    const wrapper = mount(FreshIssueCover, { props: { issue, no: 1, fresh: true } });

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(3_199);
    expect(wrapper.get('.issueCover').classes()).toContain('fresh');
    await vi.advanceTimersByTimeAsync(1);
    expect(wrapper.get('.issueCover').classes()).not.toContain('fresh');
    expect(wrapper.find('.freshFlag').exists()).toBe(false);
  });

  it('clears its timer when unmounted', () => {
    const wrapper = mount(FreshIssueCover, { props: { issue, no: 1, fresh: true } });

    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts fresh presentation when the prop changes from false to true', async () => {
    const wrapper = mount(FreshIssueCover, { props: { issue, no: 1 } });

    expect(vi.getTimerCount()).toBe(0);
    await wrapper.setProps({ fresh: true });
    expect(wrapper.get('.issueCover').classes()).toContain('fresh');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('removes fresh presentation and cancels the timer when the prop changes to false', async () => {
    const wrapper = mount(FreshIssueCover, { props: { issue, no: 1, fresh: true } });

    await wrapper.setProps({ fresh: false });
    expect(wrapper.get('.issueCover').classes()).not.toContain('fresh');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('forwards the opened issue id exactly once', async () => {
    const wrapper = mount(FreshIssueCover, { props: { issue, no: 1 } });

    await wrapper.get('.issueCover').trigger('click');
    expect(wrapper.emitted('open')).toEqual([['fresh']]);
  });

  it('keeps the fresh class while reduced motion CSS suppresses the lift animation', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const wrapper = mount(FreshIssueCover, { props: { issue, no: 1, fresh: true } });

    expect(wrapper.get('.issueCover').classes()).toContain('fresh');
    expect(FreshIssueCoverSource).toContain('@media (prefers-reduced-motion: reduce)');
    expect(FreshIssueCoverSource).toMatch(/\.fresh\s*\{\s*animation:\s*none;/);
  });
});
