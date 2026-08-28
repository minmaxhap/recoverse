// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RediscoverDetailView from './RediscoverDetailView.vue';
import type { QuestionGroup } from '../lib/rediscover';

const THIS_YEAR = '2026';

function group(years: readonly string[]): QuestionGroup {
  return {
    key: '올해가장잘한선택은',
    question: '올해 가장 잘한 선택은?',
    years: [...years],
    entries: years.map((year) => ({
      date: `${year}-12-31`,
      year,
      issueTitle: `${year} 연말호`,
      question: '올해 가장 잘한 선택은?',
      participants: ['나'],
      answers: { 나: { text: `${year}년에 적어둔 문장` } },
    })),
  };
}

describe('RediscoverDetailView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${THIS_YEAR}-08-22T09:00:00`));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('seals the answers from earlier years and leaves this year open', () => {
    // Given / When
    const wrapper = mount(RediscoverDetailView, { props: { group: group(['2024', '2025', THIS_YEAR]) } });

    // Then — 올해 답은 방금 쓴 것이라 가리지 않는다
    const sealed = wrapper.findAll('.sealed');
    expect(sealed).toHaveLength(2);
    expect(sealed[0].text()).toContain('2024년의 나는');
    expect(wrapper.text()).not.toContain('2024년에 적어둔 문장');
    expect(wrapper.text()).not.toContain('2025년에 적어둔 문장');
    expect(wrapper.text()).toContain(`${THIS_YEAR}년에 적어둔 문장`);
  });

  it('opens one sealed year without disturbing the others', async () => {
    // Given
    const wrapper = mount(RediscoverDetailView, { props: { group: group(['2024', '2025', THIS_YEAR]) } });

    // When
    await wrapper.findAll('.sealed')[0].trigger('click');

    // Then
    expect(wrapper.text()).toContain('2024년에 적어둔 문장');
    expect(wrapper.text()).not.toContain('2025년에 적어둔 문장');
    expect(wrapper.findAll('.sealed')).toHaveLength(1);
  });

  it('offers the seal as a real button so it can be opened from the keyboard', () => {
    const wrapper = mount(RediscoverDetailView, { props: { group: group(['2024', THIS_YEAR]) } });
    expect(wrapper.get('.sealed').element.tagName).toBe('BUTTON');
  });

  it('seals a lone past year, which is the whole point of opening this page', () => {
    const wrapper = mount(RediscoverDetailView, { props: { group: group(['2025']) } });
    expect(wrapper.findAll('.sealed')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('2025년에 적어둔 문장');
  });

  it('still hands the writer back to this year’s answer', async () => {
    const wrapper = mount(RediscoverDetailView, { props: { group: group(['2025']) } });
    await wrapper.get('.againCta').trigger('click');
    expect(wrapper.emitted('write')?.[0]).toEqual(['올해 가장 잘한 선택은?']);
  });
});
