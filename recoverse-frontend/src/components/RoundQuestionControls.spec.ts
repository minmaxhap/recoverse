// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import type { Issue } from '@recoverse/shared';
import { describe, expect, it } from 'vitest';
import RoundQuestionControls from './RoundQuestionControls.vue';
import PastQuestionPick from './PastQuestionPick.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import type { SoloIssueCurrentRoundDraft } from '../lib/soloIssueDraftTypes';

const currentRound: SoloIssueCurrentRoundDraft = {
  question: 'What stayed with you?',
  formatId: '',
  answers: { Mina: 'The train platform' },
};

const pastIssue: Issue = {
  id: 'past-issue',
  kind: 'yearend',
  date: '2025-12-31',
  title: '지난 기록',
  participants: ['Mina'],
  rounds: [{ asker: 'Mina', question: '지난해의 장면은?', answers: { Mina: { text: '기차역' } } }],
  source: 'solo',
};

function mountControls(
  overrides: Partial<InstanceType<typeof RoundQuestionControls>['$props']> = {},
  attachTo?: Element,
) {
  return mount(RoundQuestionControls, {
    props: {
      presentation: 'standard',
      questionNumber: 1,
      currentRound,
      kind: 'free',
      pastIssues: [],
      pastQuestions: [],
      draftStateLabel: '새 질문',
      ...overrides,
    },
    ...(attachTo ? { attachTo } : {}),
  });
}

describe('RoundQuestionControls', () => {
  it('shows the Quick question without editable question controls', () => {
    // Given
    const wrapper = mountControls({ presentation: 'quick' });

    // Then
    expect(wrapper.get('.quickQuestion').text()).toBe('What stayed with you?');
    expect(wrapper.get('.boxHead').text()).toContain('QUICK NOTE');
    expect(wrapper.find('input.field').exists()).toBe(false);
    expect(wrapper.find('.formatChips').exists()).toBe(false);
    expect(wrapper.find('.questionSources').exists()).toBe(false);
  });

  it('emits typed current-round updates for direct questions and formats', async () => {
    // Given
    const wrapper = mountControls();

    // When
    await wrapper.get('input.field').setValue('What changed?');
    await wrapper.findAll('.fchip')[1]?.trigger('click');

    // Then
    const events = wrapper.emitted('update:currentRound') ?? [];
    expect(events[0]?.[0]).toMatchObject({ question: 'What changed?' });
    expect(events[events.length - 1]?.[0]).toMatchObject({ formatId: 'year-keyword' });
  });

  it('routes recommendation picks and saved sets through typed emits', async () => {
    // Given
    const wrapper = mountControls();
    await wrapper.get('.sourcesToggle').trigger('click');

    // When
    await wrapper.findAll('.sourceRoute')[0]?.trigger('click');
    wrapper.findComponent(QuestionSuggest).vm.$emit('pick', '추천 질문');
    wrapper.findComponent(QuestionSuggest).vm.$emit('pickAll', ['추천 질문 A', '추천 질문 B']);
    await wrapper.get('.sourcesToggle').trigger('click');
    await wrapper.findAll('.sourceRoute')[1]?.trigger('click');

    // Then
    const updateEvents = wrapper.emitted('update:currentRound') ?? [];
    expect(updateEvents[updateEvents.length - 1]?.[0]).toMatchObject({ question: '추천 질문' });
    expect(wrapper.emitted('add-questions')).toEqual([[['추천 질문 A', '추천 질문 B']]]);
    expect(wrapper.emitted('browse-sets')).toEqual([[]]);
  });

  it('shows the past-issue route only when issues exist and forwards its pick', async () => {
    // Given
    const empty = mountControls();
    const wrapper = mountControls({ pastIssues: [pastIssue] });

    // When
    await wrapper.get('.sourcesToggle').trigger('click');
    await wrapper.findAll('.sourceRoute')[2]?.trigger('click');
    wrapper.findComponent(PastQuestionPick).vm.$emit('pick', '지난해의 장면은?');

    // Then
    expect(empty.findComponent(PastQuestionPick).exists()).toBe(false);
    expect(wrapper.findComponent(PastQuestionPick).exists()).toBe(true);
    const updateEvents = wrapper.emitted('update:currentRound') ?? [];
    expect(updateEvents[updateEvents.length - 1]?.[0]).toMatchObject({ question: '지난해의 장면은?' });
  });

  it('exposes focusQuestion for the parent focus hand-off', () => {
    // Given
    const wrapper = mountControls({}, document.body);

    // When
    wrapper.vm.focusQuestion();

    // Then
    expect(document.activeElement).toBe(wrapper.get('input.field').element);
    wrapper.unmount();
  });
});
