import { describe, expect, it } from 'vitest';
import type { ReviewContext } from '@recoverse/shared';
import { reviewSubjectLabel } from './reviewLabel';

describe('reviewSubjectLabel', () => {
  it('reads the scene name and where it came from', () => {
    const review: ReviewContext = {
      lensId: 'photo',
      lensRevision: 1,
      scope: { type: 'recent' },
      subject: '한강 야경 사진',
    };

    expect(reviewSubjectLabel(review)).toEqual({ subject: '한강 야경 사진', source: '요즘 · 사진' });
  });

  it('uses the writer\'s own words for a scope they named themselves', () => {
    const review: ReviewContext = {
      lensId: 'place',
      lensRevision: 1,
      scope: { type: 'custom', label: '제주 3박' },
      subject: '돌담길',
    };

    expect(reviewSubjectLabel(review)?.source).toBe('제주 3박 · 장소');
  });

  it('stays silent for rounds written before the scene name moved out of the question', () => {
    // 옛 형식은 장면 이름이 질문 문장 안에 있다 — 이미 발행된 글자를 건드리지 않고 꼬리표만 접는다.
    expect(reviewSubjectLabel(undefined)).toBeNull();
    expect(reviewSubjectLabel({ lensId: 'photo', lensRevision: 1, scope: { type: 'recent' } })).toBeNull();
  });
});
