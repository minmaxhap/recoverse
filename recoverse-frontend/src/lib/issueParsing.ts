import { isKind, type Answer, type Issue, type Round } from '@recoverse/shared';

const MAX_ISSUES = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return null;
  return value;
}

function parseAnswer(value: unknown): Answer | null {
  if (!isRecord(value) || typeof value.text !== 'string' || value.text.trim().length === 0) {
    return null;
  }
  const answer: Answer = { text: value.text };
  if (Array.isArray(value.followUps)) {
    const followUps = value.followUps.filter(
      (item): item is { q: string; a: string } =>
        isRecord(item) && typeof item.q === 'string' && typeof item.a === 'string',
    );
    if (followUps.length > 0) answer.followUps = followUps;
  }
  const media = parseStringArray(value.media);
  if (media) answer.media = media;
  return answer;
}

function parseAnswers(value: unknown): Record<string, Answer> | null {
  if (!isRecord(value)) return null;
  const answers: Record<string, Answer> = {};
  for (const [name, rawAnswer] of Object.entries(value)) {
    const answer = parseAnswer(rawAnswer);
    if (!answer) return null;
    answers[name] = answer;
  }
  return answers;
}

function parseRound(value: unknown): Round | null {
  if (
    !isRecord(value) ||
    typeof value.asker !== 'string' ||
    typeof value.question !== 'string'
  ) {
    return null;
  }
  const answers = parseAnswers(value.answers);
  if (!answers) return null;
  const round: Round = {
    asker: value.asker,
    question: value.question,
    answers,
  };
  if (typeof value.format === 'string') round.format = value.format;
  return round;
}

function parseIssue(value: unknown): Issue | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isKind(value.kind) ||
    typeof value.date !== 'string' ||
    !DATE_RE.test(value.date) ||
    typeof value.title !== 'string'
  ) {
    return null;
  }
  const participants = parseStringArray(value.participants);
  if (!participants || !Array.isArray(value.rounds)) return null;
  const rounds: Round[] = [];
  for (const rawRound of value.rounds) {
    const round = parseRound(rawRound);
    if (!round) return null;
    rounds.push(round);
  }
  const issue: Issue = {
    id: value.id,
    kind: value.kind,
    date: value.date,
    title: value.title,
    participants,
    rounds,
  };
  const pages = parseStringArray(value.pages);
  if (pages) issue.pages = pages;
  if (
    value.source === 'live' ||
    value.source === 'solo' ||
    value.source === 'paper' ||
    value.source === 'scan' ||
    value.source === 'import'
  ) {
    issue.source = value.source;
  }
  if (typeof value.shareId === 'string') issue.shareId = value.shareId;
  return issue;
}

export function parseIssues(value: unknown): Issue[] {
  if (!Array.isArray(value)) return [];
  const issues: Issue[] = [];
  for (const rawIssue of value.slice(0, MAX_ISSUES)) {
    const issue = parseIssue(rawIssue);
    if (issue) issues.push(issue);
  }
  return issues;
}
