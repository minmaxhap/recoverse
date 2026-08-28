// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Issue } from '@recoverse/shared';
import IssueDetailView from './IssueDetailView.vue';
import { useShelf } from '../composables/useShelf';
import { api } from '../lib/api';

const SHELF_KEY = 'recoverse_issues_v1';

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    kind: 'yearend',
    date: '2026-12-31',
    title: '2026 연말호',
    participants: ['민아'],
    rounds: [{ asker: '민아', question: '올해 가장 큰 변화는?', answers: { 민아: { text: '이사' } } }],
    source: 'solo',
    ...overrides,
  };
}

describe('IssueDetailView', () => {
  beforeEach(() => {
    localStorage.setItem(SHELF_KEY, JSON.stringify([issue()]));
    useShelf().reload();
  });

  it('hands out a link on the share route, not the reader-specific issue path', async () => {
    // Given — 링크를 만드는 사람은 자기 책장의 상세 화면에 서 있다
    window.history.replaceState({}, '', '/issues/issue-1');
    vi.spyOn(api, 'createShare').mockResolvedValue({ shareId: 'token-abc' });
    const wrapper = mount(IssueDetailView, { props: { issue: issue() } });

    // When
    await wrapper.findAll('.toolButton').find((button) => button.text().includes('공유'))?.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Then — 받는 사람 책장에 없는 id가 링크에 섞이면 가드가 표지로 되돌린다
    const url = wrapper.get('.shareUrl').text();
    expect(url).toBe(`${window.location.origin}/shared/token-abc`);
    expect(url).not.toContain('issue-1');
    expect(url).not.toContain('?share=');
  });

  it('reuses the share id already on the issue instead of minting another', async () => {
    // Given
    const shared = issue({ shareId: 'token-existing' });
    localStorage.setItem(SHELF_KEY, JSON.stringify([shared]));
    useShelf().reload();
    const createShare = vi.spyOn(api, 'createShare');
    const wrapper = mount(IssueDetailView, { props: { issue: shared } });

    // When
    await wrapper.findAll('.toolButton').find((button) => button.text().includes('공유'))?.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Then
    expect(createShare).not.toHaveBeenCalled();
    expect(wrapper.get('.shareUrl').text()).toBe(`${window.location.origin}/shared/token-existing`);
  });
});
