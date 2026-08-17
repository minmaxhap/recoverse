import { defaultTitle, type Kind, type Round, type SoloMode } from '@recoverse/shared';
import { describe, expect, it } from 'vitest';
import { deriveSoloTitle } from './soloTitle';

const DATE = '2026-08-18';
const KIND: Kind = 'free';

function answeredRound(metadata: Pick<Round, 'pathId' | 'review'> = {}): Round {
  return {
    asker: '나',
    question: '무엇이 남았나요?',
    answers: { 나: { text: '한 장면' } },
    ...metadata,
  };
}

function titleFor(mode: SoloMode, answeredRounds: readonly Round[]): string {
  return deriveSoloTitle({ kind: KIND, date: DATE, mode, answeredRounds });
}

describe('deriveSoloTitle', () => {
  it.each([
    ['solo-today', '8월 18일의 장면'],
    ['solo-hard-moment', '넘기지 않고 본 장면 · 8월 18일'],
    ['solo-next-action', '다음 한 걸음 · 8월 18일'],
  ])('maps the first answered Quick path %s to its writing intent', (pathId, expected) => {
    expect(titleFor('quick', [answeredRound({ pathId }), answeredRound({ pathId: 'solo-next-action' })])).toBe(expected);
  });

  it('falls back exactly to the shared title for missing or unknown Quick metadata', () => {
    const fallback = defaultTitle(KIND, DATE);

    expect(titleFor('quick', [answeredRound()])).toBe(fallback);
    expect(titleFor('quick', [answeredRound({ pathId: 'unknown-path' })])).toBe(fallback);
  });

  it('names a one-lens review from REVIEW_LENSES', () => {
    expect(titleFor('review', [answeredRound({ review: { lensId: 'photo', lensRevision: 1, scope: { type: 'recent' } } })])).toBe(
      '사진 리뷰 · 8월 18일',
    );
  });

  it('counts unique review lenses in first-seen order', () => {
    expect(
      titleFor('review', [
        answeredRound({ review: { lensId: 'work', lensRevision: 1, scope: { type: 'recent' } } }),
        answeredRound({ review: { lensId: 'work', lensRevision: 1, scope: { type: 'month' } } }),
        answeredRound({ review: { lensId: 'meal', lensRevision: 1, scope: { type: 'today' } } }),
      ]),
    ).toBe('업무 외 1개 리뷰 · 8월 18일');
  });

  it('falls back exactly for missing review metadata and free/query/import entry modes', () => {
    const fallback = defaultTitle(KIND, DATE);

    expect(titleFor('review', [answeredRound()])).toBe(fallback);
    expect(titleFor('free', [answeredRound({ pathId: 'solo-today' })])).toBe(fallback);
  });
});
