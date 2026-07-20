// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Round } from '@recoverse/shared';
import RoundEditor from './RoundEditor.vue';
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
