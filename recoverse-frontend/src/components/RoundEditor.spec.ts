// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Round } from '@recoverse/shared';
import RoundEditor from './RoundEditor.vue';
import RoundQuestionControls from './RoundQuestionControls.vue';
import type { SoloIssueCurrentRoundDraft } from '../composables/useSoloIssueDraft';

const currentRound: SoloIssueCurrentRoundDraft = {
  question: 'What stayed with you?',
  formatId: '',
  answers: { Mina: 'The train platform' },
};

describe('RoundEditor', () => {
  it('keeps question, format, and source controls in the standard presentation', async () => {
    // Given
    const wrapper = mount(RoundEditor, {
      props: {
        participants: ['Mina'],
        rounds: [],
        kind: 'free',
        currentRound,
      },
    });

    // When
    await wrapper.get('input.field').setValue('What changed?');
    await wrapper.get('.sourcesToggle').trigger('click');
    await wrapper.findAll('.fchip')[1]?.trigger('click');

    // Then
    const currentRoundEvents = wrapper.emitted('update:currentRound') ?? [];
    expect(currentRoundEvents[0]?.[0]).toMatchObject({ question: 'What changed?' });
    expect(currentRoundEvents[currentRoundEvents.length - 1]?.[0]).toMatchObject({ formatId: 'year-keyword' });
    expect(wrapper.find('.questionSources').exists()).toBe(true);
    expect(wrapper.find('.formatChips').exists()).toBe(true);
    expect(wrapper.findAll('.sourceRoute').map((route) => route.text())).toContain('추천 질문');
  });

  it('adds a batch of pack questions as answer-less rounds, skipping ones already in the contents', () => {
    // Given — 이미 목차에 하나가 실려 있음
    const existing: Round = { asker: 'Mina', question: 'Already here?', answers: { Mina: { text: 'Yes' } } };
    const wrapper = mount(RoundEditor, {
      props: { participants: ['Mina'], rounds: [existing], kind: 'free', currentRound },
    });

    // When — 팩 질문 묶음을 담는다(중복 포함)
    wrapper.findComponent(RoundQuestionControls).vm.$emit(
      'add-questions',
      ['Already here?', '새 질문 A', '새 질문 B'],
    );

    // Then — 중복은 빠지고 나머지는 답 없는 라운드로 목차에 붙는다
    const emitted = wrapper.emitted('update:rounds')?.[0]?.[0] as Round[] | undefined;
    expect(emitted).toHaveLength(3);
    expect(emitted?.slice(1).map((round) => round.question)).toEqual(['새 질문 A', '새 질문 B']);
    expect(emitted?.[1]?.answers).toEqual({});
  });

  it('uses the outcome-clear round action wording and clears current round after adding it', async () => {
    // Given
    const wrapper = mount(RoundEditor, {
      props: {
        participants: ['Mina'],
        rounds: [],
        kind: 'free',
        currentRound: {
          ...currentRound,
          formatId: 'three-scenes',
          questionId: 'question-1',
          questionRevision: 2,
          pathId: 'solo-today',
          pathStep: 0,
          review: { lensId: 'photo', lensRevision: 1, scope: { type: 'recent' } },
        },
      },
      attachTo: document.body,
    });

    // When
    await wrapper.find('button.ghost').trigger('click');

    // Then
    const emittedRounds = wrapper.emitted('update:rounds')?.[0]?.[0] as Round[] | undefined;
    expect(wrapper.find('button.ghost').text()).toBe('답 저장하고 다음 질문');
    expect(emittedRounds?.[0]).toMatchObject({
      asker: 'Mina',
      question: 'What stayed with you?',
      answers: { Mina: { text: 'The train platform' } },
      format: 'three-scenes',
      questionId: 'question-1',
      questionRevision: 2,
      pathId: 'solo-today',
      pathStep: 0,
      review: { lensId: 'photo', lensRevision: 1, scope: { type: 'recent' } },
    });
    const currentRoundEvents = wrapper.emitted('update:currentRound') ?? [];
    expect(currentRoundEvents[currentRoundEvents.length - 1]?.[0]).toEqual({ question: '', formatId: '', answers: {} });
    expect(document.activeElement).toBe(wrapper.get('input.field').element);
    wrapper.unmount();
  });

  it('shows a read-only question and the same typed save path in quick presentation', async () => {
    // Given
    const quickRound: SoloIssueCurrentRoundDraft = {
      ...currentRound,
      formatId: 'letter-future',
      questionId: 'question-quick',
      questionRevision: 3,
      pathId: 'solo-next-action',
      pathStep: 1,
      review: { lensId: 'work', lensRevision: 1, scope: { type: 'month' } },
    };
    const wrapper = mount(RoundEditor, {
      props: {
        participants: ['Mina'],
        rounds: [],
        currentRound: quickRound,
        presentation: 'quick',
        saveLabel: '이 답 남기기',
      },
      attachTo: document.body,
    });

    // Then
    expect(wrapper.get('.quickQuestion').text()).toBe('What stayed with you?');
    expect(wrapper.get('.boxHead').text()).toContain('QUICK NOTE');
    expect(wrapper.find('input.field').exists()).toBe(false);
    expect(wrapper.find('.questionSources').exists()).toBe(false);
    expect(wrapper.find('.formatChips').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('다음 질문을 고르거나 직접 써요');

    // When
    wrapper.vm.focusAnswer();
    expect(document.activeElement).toBe(wrapper.get('textarea').element);
    await wrapper.get('textarea').setValue('Take the first step');
    await wrapper.setProps({
      currentRound: { ...quickRound, answers: { Mina: 'Take the first step' } },
    });
    await wrapper.get('button.ghost').trigger('click');

    // Then
    const emittedRounds = wrapper.emitted('update:rounds')?.[0]?.[0] as Round[] | undefined;
    expect(emittedRounds?.[0]).toEqual({
      asker: 'Mina',
      question: 'What stayed with you?',
      answers: { Mina: { text: 'Take the first step' } },
      format: 'letter-future',
      questionId: 'question-quick',
      questionRevision: 3,
      pathId: 'solo-next-action',
      pathStep: 1,
      review: { lensId: 'work', lensRevision: 1, scope: { type: 'month' } },
    });
    wrapper.unmount();
  });
});
