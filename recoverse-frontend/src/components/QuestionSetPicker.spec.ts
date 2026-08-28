// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Issue } from '@recoverse/shared';
import { QUESTION_SETS_KEY, type QuestionSet } from '../composables/useQuestionSets';

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

function issue(id: string, title: string, questions: string[]): Issue {
  return {
    id,
    kind: 'yearend',
    date: '2025-12-31',
    title,
    participants: ['Mina'],
    rounds: questions.map((question) => ({ asker: 'Mina', question, format: 'three-scenes', answers: {} })),
    source: 'solo',
  };
}

async function mountPicker(props: Record<string, unknown> = {}): Promise<VueWrapper> {
  vi.resetModules();
  const component = await import('./QuestionSetPicker.vue');
  return mount(component.default, {
    props: { issues: [], contents: [], sourceIssueId: '', defaultName: '2026 연말호', ...props },
  });
}

describe('QuestionSetPicker', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: createMemoryStorage() });
  });

  it('lays a past issue out as-is, formats included, in one tap', async () => {
    // Given
    const wrapper = await mountPicker({ issues: [issue('a', '2025 연말호', ['첫 질문?', '둘째 질문?'])] });

    // When
    await wrapper.get('.issueRow').trigger('click');

    // Then
    expect(wrapper.emitted('load')![0][0]).toEqual([
      { question: '첫 질문?', format: 'three-scenes' },
      { question: '둘째 질문?', format: 'three-scenes' },
    ]);
    expect(wrapper.emitted('update:sourceIssueId')![0]).toEqual(['a']);
  });

  it('loads a saved set in one tap', async () => {
    // Given
    const saved: QuestionSet = {
      id: 'set-1',
      name: '월간 회고',
      questions: ['이번 달 좋았던 일은?'],
      updatedAt: '2026-07-01T00:00:00.000Z',
    };
    localStorage.setItem(QUESTION_SETS_KEY, JSON.stringify([saved]));
    const wrapper = await mountPicker();

    // When
    await wrapper.get('.setRow').trigger('click');

    // Then
    expect(wrapper.get('.setRow').text()).toContain('월간 회고');
    expect(wrapper.emitted('load')![0][0]).toEqual([{ question: '이번 달 좋았던 일은?' }]);
  });

  it('saves the current contents as a set under a name', async () => {
    // Given
    const wrapper = await mountPicker({ contents: ['이번 질문 하나?', '이번 질문 둘?'] });

    // When
    const saveLink = wrapper.findAll('.linkBtn').find((button) => button.text().includes('세트로 저장'));
    await saveLink!.trigger('click');
    await wrapper.get('input.field').setValue('월간 회고');
    await wrapper.get('.saveForm').trigger('submit');

    // Then
    const stored = JSON.parse(localStorage.getItem(QUESTION_SETS_KEY) ?? '[]') as QuestionSet[];
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('월간 회고');
    expect(stored[0].questions).toEqual(['이번 질문 하나?', '이번 질문 둘?']);
    expect(wrapper.get('[role="status"]').text()).toContain('세트로 저장했어요');
  });

  it('sends composing and tidying to the dedicated screen', async () => {
    // Given
    const wrapper = await mountPicker();

    // When
    const manageLink = wrapper.findAll('.linkBtn').find((button) => button.text().includes('정리하기'));
    await manageLink!.trigger('click');

    // Then
    expect(wrapper.emitted('manage')).toHaveLength(1);
    // 만들고 고치는 화면이 아니므로 편집기도 삭제 버튼도 여기엔 없다.
    expect(wrapper.find('.setEditor').exists()).toBe(false);
    expect(wrapper.find('.rowDelete').exists()).toBe(false);
  });

  it('keeps the list short until the reader asks for the rest of the shelf', async () => {
    // Given
    const issues = ['a', 'b', 'c', 'd', 'e'].map((id) => issue(id, `${id} 호`, ['질문?']));
    const wrapper = await mountPicker({ issues });

    // Then
    expect(wrapper.findAll('.issueRow')).toHaveLength(4);

    // When
    const more = wrapper.findAll('.linkBtn').find((button) => button.text().includes('더 보기'));
    await more!.trigger('click');

    // Then
    expect(wrapper.findAll('.issueRow')).toHaveLength(5);
  });
});
