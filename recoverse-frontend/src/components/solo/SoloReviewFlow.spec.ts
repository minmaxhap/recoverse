// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SoloReviewFlow from './SoloReviewFlow.vue';
import { createEmptyReviewDraft, REVIEW_LENS_IDS, REVIEW_LENSES, type ReviewDraft } from './reviewContent';

/** 부모가 하는 일(상태 보관)을 대신해 emit된 draft를 그대로 되먹인다 — 한 state machine을 그대로 검증한다. */
function mountFlow(initial: ReviewDraft = createEmptyReviewDraft()): VueWrapper {
  const wrapper = mount(SoloReviewFlow, { props: { draft: initial } });
  wrapper.vm.$.subTree; // noop touch to keep types honest
  return wrapper;
}

async function applyEmitted(wrapper: VueWrapper): Promise<void> {
  const updates = wrapper.emitted('update:draft');
  if (!updates) return;
  await wrapper.setProps({ draft: updates[updates.length - 1][0] as ReviewDraft });
}

async function pickLens(wrapper: VueWrapper, title: string): Promise<void> {
  const lens = wrapper.findAll('.lensOption').find((button) => button.text().includes(title));
  expect(lens, `${title} 렌즈가 있어야 한다`).toBeDefined();
  await lens!.trigger('click');
  await applyEmitted(wrapper);
}

describe('SoloReviewFlow', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('offers all twelve lenses once, as one catalog', () => {
    // Given / When
    const wrapper = mountFlow();

    // Then
    expect(wrapper.findAll('.lensOption')).toHaveLength(12);
    expect(new Set(REVIEW_LENS_IDS)).toHaveLength(12);
    expect(REVIEW_LENSES.every((lens) => lens.sourceHints.length > 0 && lens.selectionPrompt && lens.reflectionPrompt)).toBe(true);
  });

  it('moves one chosen lens into scope, and only that lens', async () => {
    // Given
    const wrapper = mountFlow();

    // When
    await pickLens(wrapper, '사진');

    // Then: 렌즈 목록은 사라지고(한 번에 하나) 범위 단계가 열린다
    expect(wrapper.findAll('.lensOption')).toHaveLength(0);
    expect(wrapper.get('.scopeList').attributes('role')).toBe('radiogroup');
    const checked = wrapper.findAll('[role="radio"]').filter((button) => button.attributes('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0].text()).toBe('요즘');
  });

  it('shows the lens source hint without asking for any external access', async () => {
    // Given / When
    const wrapper = mountFlow();
    await pickLens(wrapper, '사진');

    // Then
    const guide = wrapper.get('.sourceGuide').text();
    expect(guide).toContain('사진첩');
    expect(guide).toContain('자동으로 읽거나 가져오지는 않아요');
  });

  it('holds the writer at a custom scope until it is named', async () => {
    // Given
    const wrapper = mountFlow();
    await pickLens(wrapper, '소비');

    // When
    const custom = wrapper.findAll('.scopeOption').find((button) => button.text() === '직접 정하기');
    await custom!.trigger('click');
    await applyEmitted(wrapper);

    // Then
    expect((wrapper.get('.reviewFlow .cta').element as HTMLButtonElement).disabled).toBe(true);

    // When
    await wrapper.get('.fieldGroup input.field').setValue('포항 여행');
    await applyEmitted(wrapper);

    // Then
    expect((wrapper.get('.reviewFlow .cta').element as HTMLButtonElement).disabled).toBe(false);
  });

  it('takes one to three scenes and no more', async () => {
    // Given
    const wrapper = mountFlow();
    await pickLens(wrapper, '식사');
    await wrapper.get('.reviewFlow .cta').trigger('click');
    await applyEmitted(wrapper);

    // Then: 한 장면으로 시작한다
    expect(wrapper.findAll('.reviewItem')).toHaveLength(1);

    // When: 세 개까지 늘린다
    for (let i = 0; i < 2; i += 1) {
      await wrapper.get('.addItem').trigger('click');
      await applyEmitted(wrapper);
    }

    // Then: 네 번째를 권하지 않는다
    expect(wrapper.findAll('.reviewItem')).toHaveLength(3);
    expect(wrapper.find('.addItem').exists()).toBe(false);
  });

  it('finishes on a single one-line observation, with no lesson or action asked', async () => {
    // Given
    const wrapper = mountFlow();
    await pickLens(wrapper, '대화');
    await wrapper.get('.reviewFlow .cta').trigger('click');
    await applyEmitted(wrapper);

    // Then: 아직 실을 게 없으면 안내만 하고 막는다
    expect((wrapper.get('.reviewFlow .cta').element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.get('.fineprint').text()).toContain('교훈이나 다음 행동은 없어도 돼요');

    // When
    await wrapper.get('.itemLabel').setValue('퇴근길 통화');
    await applyEmitted(wrapper);
    await wrapper.get('.itemNote').setValue('말끝을 흐린 게 계속 남는다');
    await applyEmitted(wrapper);
    await wrapper.get('.reviewFlow .cta').trigger('click');

    // Then: 평범한 질문/답 한 줄로만 나간다 — format 같은 다른 계약 필드를 빌려 쓰지 않는다
    const completed = wrapper.emitted('complete');
    expect(completed).toHaveLength(1);
    const rounds = completed![0][0] as Array<{ question: string; answer: string; review: unknown }>;
    expect(rounds).toHaveLength(1);
    expect(rounds[0].question).toContain('퇴근길 통화');
    expect(rounds[0].question).toContain('요즘');
    expect(rounds[0].answer).toBe('말끝을 흐린 게 계속 남는다');
    expect(Object.keys(rounds[0])).toEqual(['question', 'answer', 'review']);
    expect(rounds[0].review).toEqual({
      lensId: 'conversation',
      lensRevision: 1,
      scope: { type: 'recent' },
    });
  });

  it('walks back one step at a time and hands the way out to the parent', async () => {
    // Given
    const wrapper = mountFlow();
    await pickLens(wrapper, '장소');
    await wrapper.get('.reviewFlow .cta').trigger('click');
    await applyEmitted(wrapper);

    // When: 장면 → 범위
    await wrapper.get('.backChoice').trigger('click');
    await applyEmitted(wrapper);

    // Then
    expect(wrapper.find('.scopeList').exists()).toBe(true);

    // When: 범위 → 렌즈
    await wrapper.get('.backChoice').trigger('click');
    await applyEmitted(wrapper);

    // Then
    expect(wrapper.findAll('.lensOption')).toHaveLength(12);
    expect(wrapper.emitted('back')).toBeUndefined();

    // When: 렌즈에서 한 번 더 뒤로 가면 모드 선택은 부모가 처리한다
    await wrapper.get('.backChoice').trigger('click');
    expect(wrapper.emitted('back')).toHaveLength(1);
  });

  it('takes keyboard focus when the flow opens, not just when a step changes', () => {
    // Given / When: 모드를 고른 직후처럼 이 화면이 처음 열린다
    const wrapper = mount(SoloReviewFlow, { props: { draft: createEmptyReviewDraft() }, attachTo: document.body });

    // Then: 포커스가 body로 떨어지지 않고 단계 제목에 있다
    expect(document.activeElement).toBe(wrapper.get('h2').element);
    wrapper.unmount();
  });

  it('names each step for screen readers without turning the form into a live region', async () => {
    // Given
    const wrapper = mountFlow();

    // Then
    expect(wrapper.get('.reviewFlow').attributes('aria-live')).toBeUndefined();
    expect(wrapper.get('[role="status"]').text()).toContain('1단계');

    // When
    await pickLens(wrapper, '루틴');

    // Then
    expect(wrapper.get('[role="status"]').text()).toContain('2단계');
  });
});
