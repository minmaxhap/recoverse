// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Round } from '@recoverse/shared';
import RoundEditor from './RoundEditor.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import type { SoloIssueCurrentRoundDraft } from '../composables/useSoloIssueDraft';

const currentRound: SoloIssueCurrentRoundDraft = {
  question: 'What stayed with you?',
  formatId: '',
  answers: { Mina: 'The train platform' },
};

describe('RoundEditor', () => {
  it('renders the controlled current round and emits typed updates when the answer changes', async () => {
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
    await wrapper.find('textarea').setValue('The late dinner');

    // Then
    expect((wrapper.find('input.field').element as HTMLInputElement).value).toBe('What stayed with you?');
    const currentRoundEvents = wrapper.emitted('update:currentRound') ?? [];
    expect(currentRoundEvents[currentRoundEvents.length - 1]?.[0]).toEqual({
      question: 'What stayed with you?',
      formatId: '',
      answers: { Mina: 'The late dinner' },
    });
  });

  it('adds a batch of pack questions as answer-less rounds, skipping ones already in the contents', () => {
    // Given — 이미 목차에 하나가 실려 있음
    const existing: Round = { asker: 'Mina', question: 'Already here?', answers: { Mina: { text: 'Yes' } } };
    const wrapper = mount(RoundEditor, {
      props: { participants: ['Mina'], rounds: [existing], kind: 'free', currentRound },
    });

    // When — 팩 질문 묶음을 담는다(중복 포함)
    wrapper.findComponent(QuestionSuggest).vm.$emit('pickAll', ['Already here?', '새 질문 A', '새 질문 B']);

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
        currentRound,
      },
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
    });
    const currentRoundEvents = wrapper.emitted('update:currentRound') ?? [];
    expect(currentRoundEvents[currentRoundEvents.length - 1]?.[0]).toEqual({ question: '', formatId: '', answers: {} });
  });
});
