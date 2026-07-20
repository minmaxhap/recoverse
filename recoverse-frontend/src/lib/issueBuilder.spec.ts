import { describe, expect, it } from 'vitest';
import type { Round } from '@recoverse/shared';
import { issueFromDraft, roundIsAnswered, type EditorDraft } from './issueBuilder';

const answered: Round = {
  asker: '나',
  question: '답이 있는 질문',
  answers: { 나: { text: '채운 답' } },
};
const pending: Round = { asker: '나', question: '답 대기 질문', answers: {} };
const blankText: Round = { asker: '나', question: '공백만 있는 답', answers: { 나: { text: '   ' } } };

function draft(rounds: Round[]): EditorDraft {
  return { kind: 'free', date: '2026-07-20', title: '', participants: ['나'], rounds };
}

describe('roundIsAnswered', () => {
  it('is true only when some answer has non-whitespace text', () => {
    expect(roundIsAnswered(answered)).toBe(true);
    expect(roundIsAnswered(pending)).toBe(false);
    expect(roundIsAnswered(blankText)).toBe(false);
  });
});

describe('issueFromDraft', () => {
  it('drops answer-less rounds and keeps answered ones in order', () => {
    const issue = issueFromDraft(draft([pending, answered, blankText]), 'solo');
    expect(issue.rounds).toHaveLength(1);
    expect(issue.rounds[0]?.question).toBe('답이 있는 질문');
    expect(issue.source).toBe('solo');
  });

  it('falls back to the default title and can produce an empty round list', () => {
    const issue = issueFromDraft(draft([pending]), 'solo');
    expect(issue.rounds).toHaveLength(0);
    expect(issue.title).toBe('2026 자유호');
  });
});
