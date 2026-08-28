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
    expect(featured[0]).toContain('3명부터 답의 주인을 맞히는 ‘누가 썼게’가 열려요.');
    expect(featured[1]).toContain('혼자 쓰기');
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
