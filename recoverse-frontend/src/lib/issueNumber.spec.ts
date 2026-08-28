import { describe, expect, it } from 'vitest';
import { issueNumberLabel } from './issueNumber';

describe('issueNumberLabel', () => {
  it('calls the first issue a founding issue rather than number one', () => {
    expect(issueNumberLabel(1)).toBe('창간호');
  });

  it('counts the ones after it', () => {
    expect(issueNumberLabel(2)).toBe('제2호');
    expect(issueNumberLabel(17)).toBe('제17호');
  });

  it('says nothing specific before the issue is on the shelf', () => {
    // 아직 꽂히지 않았으면 번호가 없다 — 없는 번호를 지어내지 않는다.
    expect(issueNumberLabel(0)).toBe('이번 호');
    expect(issueNumberLabel(-1)).toBe('이번 호');
    expect(issueNumberLabel(Number.NaN)).toBe('이번 호');
  });
});
