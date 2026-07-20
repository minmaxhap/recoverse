import { describe, expect, it } from 'vitest';
import { estimateWritingMinutes, suggestQuestions } from './questionPacks';

describe('estimateWritingMinutes', () => {
  it('scales with difficulty weight', () => {
    expect(estimateWritingMinutes('light', 4)).toBe(4);
    expect(estimateWritingMinutes('medium', 4)).toBe(8);
    expect(estimateWritingMinutes('deep', 4)).toBe(12);
  });

  it('is zero for an empty pack', () => {
    expect(estimateWritingMinutes('medium', 0)).toBe(0);
  });

  it('never returns a negative estimate', () => {
    expect(estimateWritingMinutes('deep', -3)).toBe(0);
  });
});

describe('suggestQuestions', () => {
  it('returns at most the requested count and excludes seen questions', () => {
    const first = suggestQuestions('yearend', 'medium', [], 4);
    expect(first.length).toBeLessThanOrEqual(4);
    const excluded = suggestQuestions('yearend', 'medium', first, 4);
    for (const question of excluded) {
      expect(first).not.toContain(question);
    }
  });
});
