// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { QuestionGroup, RediscoveryMoment } from '../lib/rediscover';
import RediscoverView from './RediscoverView.vue';

const groups: readonly QuestionGroup[] = [
  {
    key: 'featured-question',
    question: '오늘 다시 볼 질문?',
    years: ['2025'],
    entries: [{ date: '2025-08-05', year: '2025', issueTitle: '지난여름', question: '오늘 다시 볼 질문?', participants: ['민아'], answers: { 민아: { text: '검색 가능한 답' } } }],
  },
  {
    key: 'ordinary-question',
    question: '다른 질문?',
    years: ['2024'],
    entries: [{ date: '2024-01-01', year: '2024', issueTitle: '겨울', question: '다른 질문?', participants: ['민아'], answers: { 민아: { text: '다른 답' } } }],
  },
];

const moment: RediscoveryMoment = {
  groupKey: 'featured-question',
  question: '오늘 다시 볼 질문?',
  date: '2025-08-05',
  year: '2025',
  yearsAgo: 1,
  issueTitle: '지난여름',
  participants: ['민아'],
  answers: { 민아: { text: '검색 가능한 답' } },
  anniversary: true,
};

function mountView() {
  return mount(RediscoverView, { props: { groups: [...groups], hasSamples: false, moment } });
}

describe('RediscoverView', () => {
  it('does not repeat the featured group in ordinary rows before searching', () => {
    const wrapper = mountView();

    expect(wrapper.get('.momentCard').text()).toContain('오늘 다시 볼 질문?');
    expect(wrapper.findAll('.redisRow')).toHaveLength(1);
    expect(wrapper.get('.redisRow').text()).toContain('다른 질문?');
    expect(wrapper.text()).not.toContain('찾는 결과가 없어요.');
  });

  it('searches the full group set so the featured group can return as a usable row', async () => {
    const wrapper = mountView();

    await wrapper.get('input[aria-label="다시 발견 검색"]').setValue('검색 가능한 답');

    const rows = wrapper.findAll('.redisRow');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.text()).toContain('오늘 다시 볼 질문?');
    await rows[0]?.trigger('click');
    expect(wrapper.emitted('open-group')).toContainEqual(['featured-question']);
  });

  it('shows no-result copy only for an actual non-empty search', async () => {
    const wrapper = mountView();

    await wrapper.get('input[aria-label="다시 발견 검색"]').setValue('없는 내용');

    expect(wrapper.findAll('.redisRow')).toHaveLength(0);
    expect(wrapper.text()).toContain('찾는 결과가 없어요.');
  });
});
