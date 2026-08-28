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
  });
});
