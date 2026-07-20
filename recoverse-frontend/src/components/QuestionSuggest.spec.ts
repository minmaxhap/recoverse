// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import QuestionSuggest from './QuestionSuggest.vue';

describe('QuestionSuggest', () => {
  it('shows the question count and estimated time once opened', async () => {
    const wrapper = mount(QuestionSuggest, { props: { kind: 'yearend' } });

    // 패널을 열기 전에는 힌트가 없다.
    expect(wrapper.find('.packHint').exists()).toBe(false);

    await wrapper.get('.suggestOpen').trigger('click');

    // 기본 난이도(적당히)는 문항당 2분 — 4문항이면 약 8분.
    const hint = wrapper.get('.packHint').text();
    expect(hint).toContain('4문항');
    expect(hint).toContain('약 8분');
  });

  it('re-estimates the time when the difficulty changes', async () => {
    const wrapper = mount(QuestionSuggest, { props: { kind: 'yearend' } });
    await wrapper.get('.suggestOpen').trigger('click');

    const chips = wrapper.findAll('.chip');
    const deepChip = chips.find((chip) => chip.text() === '깊게');
    expect(deepChip).toBeDefined();
    await deepChip!.trigger('click');

    // 깊게는 문항당 3분 — 4문항이면 약 12분.
    expect(wrapper.get('.packHint').text()).toContain('약 12분');
  });

  it('emits the whole shown set and closes the panel when batching', async () => {
    const wrapper = mount(QuestionSuggest, { props: { kind: 'yearend' } });
    await wrapper.get('.suggestOpen').trigger('click');

    const shown = wrapper.findAll('.pick').map((button) => button.text());
    await wrapper.get('.addAll').trigger('click');

    const pickAll = wrapper.emitted('pickAll');
    expect(pickAll).toHaveLength(1);
    expect(pickAll![0][0]).toEqual(shown);
    expect(wrapper.find('.panel').exists()).toBe(false);
  });

  it('emits the chosen question and closes the panel', async () => {
    const wrapper = mount(QuestionSuggest, { props: { kind: 'yearend' } });
    await wrapper.get('.suggestOpen').trigger('click');

    await wrapper.get('.pick').trigger('click');

    expect(wrapper.emitted('pick')).toHaveLength(1);
    expect(typeof wrapper.emitted('pick')![0][0]).toBe('string');
    expect(wrapper.find('.panel').exists()).toBe(false);
  });
});
