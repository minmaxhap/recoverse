// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CoverEntryList from './CoverEntryList.vue';

describe('CoverEntryList', () => {
  it('prioritizes the together and solo jobs', () => {
    // Given / When
    const wrapper = mount(CoverEntryList);

    // Then
    const featured = wrapper.findAll('.entryBtn.featured').map((button) => button.text());
    expect(featured).toHaveLength(2);
    expect(featured[0]).toContain('친구들과 같이 해보기');
    expect(featured[0]).toContain('3명부터');
    expect(featured[1]).toContain('혼자 쓰기');
    // 이름이 곧 설명인 줄은 부제를 비워 세 줄이 같은 박자로 끝나지 않게 한다.
    expect(wrapper.findAll('.entryBtn')[1].find('.entrySub').exists()).toBe(false);
    expect(wrapper.get('.joinLine').text()).toContain('초대 코드를 받았나요?');
  });

  it('keeps navigation targets unchanged', async () => {
    // Given
    const wrapper = mount(CoverEntryList);

    // When
    await wrapper.findAll('.entryBtn.featured')[1].trigger('click');
    await wrapper.get('.joinLine').trigger('click');

    // Then
    expect(wrapper.emitted('navigate')).toEqual([['solo'], ['join']]);
  });
});
