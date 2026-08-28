import { describe, expect, it } from 'vitest';
import { todaysLenses, TODAYS_LENS_COUNT } from './todaysLenses';
import { REVIEW_LENSES } from '../components/solo/reviewContent';

describe('todaysLenses', () => {
  it('offers three, and never the same lens twice', () => {
    const picked = todaysLenses('2026-08-28');
    expect(picked).toHaveLength(TODAYS_LENS_COUNT);
    expect(new Set(picked.map((lens) => lens.id)).size).toBe(TODAYS_LENS_COUNT);
  });

  it('holds the same three all day', () => {
    // 화면을 다시 열 때마다 추천이 바뀌면 방금 본 렌즈를 다시 찾지 못한다.
    const first = todaysLenses('2026-08-28').map((lens) => lens.id);
    const again = todaysLenses('2026-08-28').map((lens) => lens.id);
    expect(again).toEqual(first);
  });

  it('turns over between days', () => {
    const days = ['2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30']
      .map((day) => todaysLenses(day).map((lens) => lens.id).join(','));
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it('only ever offers real lenses', () => {
    const known = new Set(REVIEW_LENSES.map((lens) => lens.id));
    for (const lens of todaysLenses('2026-01-01')) expect(known.has(lens.id)).toBe(true);
  });

  it('cannot be asked for more lenses than exist', () => {
    const picked = todaysLenses('2026-08-28', 99);
    expect(picked).toHaveLength(REVIEW_LENSES.length);
    expect(new Set(picked.map((lens) => lens.id)).size).toBe(REVIEW_LENSES.length);
  });
});
