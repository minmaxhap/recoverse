// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CoverResumeDraft from './CoverResumeDraft.vue';
import type { SoloIssueDraftSummary } from '../composables/useSoloIssueDraft';

function summary(overrides: Partial<SoloIssueDraftSummary> = {}): SoloIssueDraftSummary {
  return {
    resumable: true,
    kind: 'reading',
    title: '',
    updatedAt: '',
    savedRoundCount: 0,
    hasPendingQuestion: false,
    leadQuestion: '',
    answeredRoundCount: 0,
    ...overrides,
  };
}

describe('CoverResumeDraft', () => {
  it('renders nothing when there is no resumable draft', () => {
    const wrapper = mount(CoverResumeDraft, { props: { summary: summary({ resumable: false }) } });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows the draft title and saved-round progress, and emits resume on click', async () => {
    const wrapper = mount(CoverResumeDraft, {
      props: { summary: summary({ title: '2026 독서 특집호', savedRoundCount: 2, answeredRoundCount: 2 }) },
    });

    expect(wrapper.text()).toContain('2026 독서 특집호');
    expect(wrapper.text()).toContain('질문 2개 실었어요');

    await wrapper.get('.resumeCard').trigger('click');
    expect(wrapper.emitted('resume')).toHaveLength(1);
  });

  it('asks before throwing the draft away, and lets the writer back out', async () => {
    // Given: 초고는 하나뿐이라 버리기가 되돌릴 수 없다 — 그래서 한 번 묻는다
    const wrapper = mount(CoverResumeDraft, { props: { summary: summary({ savedRoundCount: 1 }) } });

    // When
    await wrapper.get('.discardLink').trigger('click');

    // Then
    expect(wrapper.get('.discardConfirm').text()).toContain('쓰던 초고를 버릴까요?');
    expect(wrapper.emitted('discard')).toBeUndefined();

    // When: 마음이 바뀌면 그 자리에서 물러난다
    await wrapper.get('.discardNo').trigger('click');

    // Then
    expect(wrapper.find('.discardConfirm').exists()).toBe(false);
    expect(wrapper.find('.discardLink').exists()).toBe(true);
    expect(wrapper.emitted('discard')).toBeUndefined();

    // When
    await wrapper.get('.discardLink').trigger('click');
    await wrapper.get('.discardYes').trigger('click');

    // Then
    expect(wrapper.emitted('discard')).toHaveLength(1);
  });

  it('never puts the discard control inside the button that resumes writing', () => {
    // 이어 쓰려던 손이 버리기를 스치면 안 된다 — 카드 안에 넣으면 중첩 버튼이라 눌리는 곳도 불분명해진다.
    const wrapper = mount(CoverResumeDraft, { props: { summary: summary() } });
    expect(wrapper.get('.resumeCard').find('.discardLink').exists()).toBe(false);
  });

  it('says so when the draft could not be emptied', () => {
    const wrapper = mount(CoverResumeDraft, {
      props: { summary: summary(), error: '초고를 비우지 못했어요.' },
    });

    expect(wrapper.get('[role="alert"]').text()).toBe('초고를 비우지 못했어요.');
    expect(wrapper.find('.discardLink').exists()).toBe(false);
  });

  it('says a question is still waiting rather than claiming it was carried', () => {
    const wrapper = mount(CoverResumeDraft, {
      props: { summary: summary({ savedRoundCount: 2, answeredRoundCount: 0 }) },
    });
    expect(wrapper.text()).toContain('질문 2개 답 기다리는 중');
  });

  it('calls the draft by the question being written when it has no title', () => {
    const wrapper = mount(CoverResumeDraft, {
      props: { summary: summary({ title: '', leadQuestion: '올해 가장 잘한 선택은?' }) },
    });
    expect(wrapper.text()).toContain('올해 가장 잘한 선택은?');
    expect(wrapper.text()).not.toContain('독서 쓰는 중');
  });

  it('falls back to a kind-based title when there is no title and no question yet', () => {
    const wrapper = mount(CoverResumeDraft, { props: { summary: summary({ title: '', leadQuestion: '' }) } });
    expect(wrapper.text()).toContain('독서 쓰는 중');
  });

  it('describes an in-progress question when no rounds are saved yet', () => {
    const wrapper = mount(CoverResumeDraft, {
      props: { summary: summary({ savedRoundCount: 0, hasPendingQuestion: true }) },
    });
    expect(wrapper.text()).toContain('질문을 쓰는 중');
  });
});
