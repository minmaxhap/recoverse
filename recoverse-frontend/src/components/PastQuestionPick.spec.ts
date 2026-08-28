// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Issue } from '@recoverse/shared';
import PastQuestionPick from './PastQuestionPick.vue';

function issue(id: string, date: string, title: string, questions: string[]): Issue {
  return {
    id,
    kind: 'yearend',
    date,
    title,
    participants: ['Mina'],
    rounds: questions.map((question) => ({ asker: 'Mina', question, answers: { Mina: { text: `${question} 답` } } })),
    source: 'solo',
  };
}

describe('PastQuestionPick', () => {
  it('hands one past question straight to the writer', async () => {
    // Given
    const wrapper = mount(PastQuestionPick, {
      props: { issues: [issue('a', '2025-12-31', '2025 연말호', ['올해 가장 오래 남은 장면은?'])], exclude: [] },
    });

    // When
    await wrapper.get('.pickOpen').trigger('click');
    await wrapper.get('.pick').trigger('click');

    // Then
    expect(wrapper.emitted('pick')![0]).toEqual(['올해 가장 오래 남은 장면은?']);
    expect(wrapper.find('.panel').exists()).toBe(false);
  });

  it('collapses the same question asked across years into one row', async () => {
    // Given
    const issues = [
      issue('a', '2025-12-31', '2025 연말호', ['올해의 나에게?']),
      issue('b', '2024-12-31', '2024 연말호', ['올해의 나에게?']),
    ];
    const wrapper = mount(PastQuestionPick, { props: { issues, exclude: [] } });

    // When
    await wrapper.get('.pickOpen').trigger('click');

    // Then
    expect(wrapper.findAll('.pick')).toHaveLength(1);
    expect(wrapper.get('.qMeta').text()).toContain('2개의 해');
    expect(wrapper.get('.qMeta').text()).toContain('2025 연말호');
  });

  it('leaves out questions already in the contents', async () => {
    // Given
    const wrapper = mount(PastQuestionPick, {
      props: {
        issues: [issue('a', '2025-12-31', '2025 연말호', ['이미 쓴 질문?', '아직 안 쓴 질문?'])],
        exclude: ['이미 쓴 질문?'],
      },
    });

    // When
    await wrapper.get('.pickOpen').trigger('click');

    // Then
    const shown = wrapper.findAll('.pick').map((row) => row.text());
    expect(shown).toHaveLength(1);
    expect(shown[0]).toContain('아직 안 쓴 질문?');
  });

  it('narrows the list by search and says so when nothing matches', async () => {
    // Given
    const wrapper = mount(PastQuestionPick, {
      props: {
        issues: [issue('a', '2025-12-31', '2025 연말호', ['여행에서 본 것은?', '올해 읽은 책은?'])],
        exclude: [],
      },
    });
    await wrapper.get('.pickOpen').trigger('click');

    // When
    await wrapper.get('.searchField').setValue('여행');

    // Then
    expect(wrapper.findAll('.pick')).toHaveLength(1);

    // When
    await wrapper.get('.searchField').setValue('없는질문');

    // Then
    expect(wrapper.find('.pick').exists()).toBe(false);
    expect(wrapper.text()).toContain('찾는 질문이 없어요');
  });
});
