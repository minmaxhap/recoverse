import { describe, expect, it } from 'vitest';
import type { Issue } from '@recoverse/shared';
import { pickRediscoveryMoment } from './rediscover';

const TODAY = new Date('2026-08-05T09:00:00');

function issue(id: string, date: string, question = '올해 가장 큰 변화는?'): Issue {
  return {
    id,
    kind: 'yearend',
    date,
    title: `${date.slice(0, 4)} 회고`,
    participants: ['민아'],
    rounds: [{ asker: '민아', question, answers: { 민아: { text: '이사' } } }],
    source: 'solo',
  };
}

describe('pickRediscoveryMoment', () => {
  it('does not offer an issue published today as something to rediscover', () => {
    // Given — 첫 호를 방금 발행한 사람
    const issues = [issue('fresh', '2026-08-05')];

    // Then — 재발견할 만큼 지나지 않았다
    expect(pickRediscoveryMoment(issues, TODAY)).toBeNull();
  });

  it('keeps quiet until enough time has passed, then speaks up', () => {
    // Given / Then — 29일은 아직 이르고
    expect(pickRediscoveryMoment([issue('recent', '2026-07-08')], TODAY)).toBeNull();

    // 30일이 지나면 후보가 된다
    const moment = pickRediscoveryMoment([issue('aged', '2026-07-06')], TODAY);
    expect(moment?.question).toBe('올해 가장 큰 변화는?');
  });

  it('still prefers a past year around today over an older random pick', () => {
    // Given — 작년 오늘 즈음의 호와, 한참 전의 호
    const issues = [
      issue('long-ago', '2024-02-11', '그때 나는 무엇을 기다렸나?'),
      issue('anniversary', '2025-08-04', '작년 오늘의 나는?'),
    ];

    // When
    const moment = pickRediscoveryMoment(issues, TODAY);

    // Then
    expect(moment?.question).toBe('작년 오늘의 나는?');
    expect(moment?.anniversary).toBe(true);
    expect(moment?.yearsAgo).toBe(1);
  });

  it('picks nothing from a shelf whose only issue has no answers', () => {
    const empty: Issue = { ...issue('blank', '2025-01-01'), rounds: [{ asker: '민아', question: '답 없는 질문?', answers: {} }] };
    expect(pickRediscoveryMoment([empty], TODAY)).toBeNull();
  });
});
