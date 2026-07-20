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
      props: { summary: summary({ title: '2026 독서 특집호', savedRoundCount: 2 }) },
    });

    expect(wrapper.text()).toContain('2026 독서 특집호');
    expect(wrapper.text()).toContain('질문 2개 실었어요');

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('resume')).toHaveLength(1);
  });

  it('falls back to a kind-based title when the draft has no title yet', () => {
    const wrapper = mount(CoverResumeDraft, { props: { summary: summary({ title: '' }) } });
    expect(wrapper.text()).toContain('독서 쓰는 중');
  });

  it('describes an in-progress question when no rounds are saved yet', () => {
    const wrapper = mount(CoverResumeDraft, {
      props: { summary: summary({ savedRoundCount: 0, hasPendingQuestion: true }) },
    });
    expect(wrapper.text()).toContain('질문을 쓰는 중');
  });
});
