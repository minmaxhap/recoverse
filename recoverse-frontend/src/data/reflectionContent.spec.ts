import { describe, expect, it } from 'vitest';
import {
  isValidContentId,
  isValidPathStep,
  isValidRevision,
  parseReviewContext,
} from '@recoverse/shared';

describe('reflection content metadata validation', () => {
  it('accepts stable IDs, positive revisions, and zero-based path steps', () => {
    expect(isValidContentId('solo-today')).toBe(true);
    expect(isValidRevision(1)).toBe(true);
    expect(isValidPathStep(0)).toBe(true);
  });

  it('rejects malformed optional metadata at persistence boundaries', () => {
    expect(isValidContentId('Bad ID')).toBe(false);
    expect(isValidRevision(0)).toBe(false);
    expect(isValidPathStep(-1)).toBe(false);
    expect(parseReviewContext({ lensId: 'photo', lensRevision: 0, scope: { type: 'recent' } })).toBeNull();
    expect(parseReviewContext({ lensId: 'photo', lensRevision: 1, scope: { type: 'recent' }, subject: 3 })).toBeNull();
  });

  it('carries the scene name across a save and drops it when blank', () => {
    const base = { lensId: 'photo', lensRevision: 1, scope: { type: 'recent' } };

    expect(parseReviewContext({ ...base, subject: ' 한강 야경 사진 ' })).toEqual({
      lensId: 'photo',
      lensRevision: 1,
      scope: { type: 'recent' },
      subject: '한강 야경 사진',
    });
    // 빈 이름은 없는 것과 같다 — 화면에 빈 꼬리표가 남지 않게 여기서 떨군다.
    expect(parseReviewContext({ ...base, subject: '   ' })).toEqual(base);
  });
});
