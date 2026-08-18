// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SoloQuickCompletion from './SoloQuickCompletion.vue';

function mountCompletion(overrides: Partial<InstanceType<typeof SoloQuickCompletion>['$props']> = {}) {
  return mount(SoloQuickCompletion, {
    props: {
      latestAnswer: '마지막 답',
      publishHelp: '지금 발행하면 이 호가 내 책장에 저장돼요.',
      error: '',
      canPublish: true,
      publishing: false,
      ...overrides,
    },
  });
}

describe('SoloQuickCompletion', () => {
  it('keeps the full saved answer as the quote and accessible name', () => {
    const latestAnswer = '첫 줄\n\n중간 빈 줄도 그대로';
    const wrapper = mountCompletion({ latestAnswer });

    const quote = wrapper.get('blockquote.quickAnswer');
    expect(quote.element.textContent).toBe(latestAnswer);
    expect(quote.attributes('aria-label')).toBe(latestAnswer);
  });

  it('omits the quote when there is no solo answer', () => {
    const wrapper = mountCompletion({ latestAnswer: '' });

    expect(wrapper.find('blockquote.quickAnswer').exists()).toBe(false);
  });

  it('disables publish while unavailable or publishing', async () => {
    const wrapper = mountCompletion({ canPublish: false });
    expect(wrapper.get<HTMLButtonElement>('.cta').element.disabled).toBe(true);

    await wrapper.setProps({ canPublish: true, publishing: true });
    expect(wrapper.get<HTMLButtonElement>('.cta').element.disabled).toBe(true);
  });

  it('announces an error without removing the completion actions', () => {
    const wrapper = mountCompletion({ error: '저장 공간을 확인해주세요.' });

    expect(wrapper.get('[role="alert"]').text()).toBe('저장 공간을 확인해주세요.');
    expect(wrapper.findAll('button')).toHaveLength(3);
  });

  it('emits the exact action selected by the writer', async () => {
    const wrapper = mountCompletion();

    await wrapper.get('.cta').trigger('click');
    expect(wrapper.emitted('publish')).toHaveLength(1);
    expect(wrapper.emitted('continue')).toBeUndefined();
    expect(wrapper.emitted('edit')).toBeUndefined();

    await wrapper.get('.ghost').trigger('click');
    expect(wrapper.emitted('continue')).toHaveLength(1);
    expect(wrapper.emitted('edit')).toBeUndefined();

    await wrapper.get('.linkAction').trigger('click');
    expect(wrapper.emitted('edit')).toHaveLength(1);
  });
});
