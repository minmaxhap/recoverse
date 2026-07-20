import { describe, expect, it } from 'vitest';
import type { Issue } from '@recoverse/shared';
import { issueToMarkdown, shelfToMarkdown } from './markdownExport';

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    kind: 'yearend',
    date: '2026-12-31',
    title: '2026 연말호',
    participants: ['민희', '지원'],
    rounds: [
      {
        asker: '민희',
        question: '올해 가장 큰 변화는?',
        answers: { 민희: { text: '이사했다.' }, 지원: { text: '이직했다.' } },
      },
    ],
    ...overrides,
  };
}

describe('issueToMarkdown', () => {
  it('renders the title heading, byline, question heading, and answers as blockquotes', () => {
    const md = issueToMarkdown(issue());
    expect(md).toContain('# 2026 연말호');
    expect(md).toContain('2026-12-31 · 민희, 지원');
    expect(md).toContain('## 올해 가장 큰 변화는?');
    expect(md).toContain('> **민희**\n> 이사했다.');
    expect(md).toContain('> **지원**\n> 이직했다.');
  });

  it('falls back to the default kind-based title when none is set', () => {
    const md = issueToMarkdown(issue({ title: '   ' }));
    expect(md).toContain('# 2026 연말호');
  });

  it('keeps multi-line answers inside the quote block', () => {
    const md = issueToMarkdown(
      issue({
        rounds: [
          { asker: '민희', question: 'Q', answers: { 민희: { text: '첫 줄\n둘째 줄' } } },
        ],
      }),
    );
    expect(md).toContain('> **민희**\n> 첫 줄\n> 둘째 줄');
  });

  it('marks a round with no answers instead of dropping it', () => {
    const md = issueToMarkdown(
      issue({ rounds: [{ asker: '민희', question: '빈 질문', answers: {} }] }),
    );
    expect(md).toContain('## 빈 질문');
    expect(md).toContain('_(아직 빈 답)_');
  });

  it('ends with a single trailing newline', () => {
    const md = issueToMarkdown(issue());
    expect(md.endsWith('\n')).toBe(true);
    expect(md.endsWith('\n\n')).toBe(false);
  });
});

describe('shelfToMarkdown', () => {
  it('joins multiple issues with a horizontal rule', () => {
    const md = shelfToMarkdown([issue({ id: 'a', title: '호 A' }), issue({ id: 'b', title: '호 B' })]);
    expect(md).toContain('# 호 A');
    expect(md).toContain('# 호 B');
    expect(md).toContain('\n---\n');
  });

  it('produces a friendly placeholder for an empty shelf', () => {
    const md = shelfToMarkdown([]);
    expect(md).toContain('아직 꽂힌 호가 없어요');
  });
});
