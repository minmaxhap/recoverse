import { isKind, type Answer, type Round } from '@recoverse/shared';
import {
  SOLO_ISSUE_DRAFT_VERSION,
  type SoloIssueCurrentRoundDraft,
  type SoloIssueDraftV2,
} from './soloIssueDraftTypes';

type JsonParseResult = { readonly ok: true; readonly value: unknown } | { readonly ok: false };

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoString(value: string): boolean {
  return !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

export function parseJson(value: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false };
    throw error;
  }
}

function parseStringRecord(value: unknown): Readonly<Record<string, string>> | null {
  if (!isRecord(value)) return null;
  const values: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue !== 'string') return null;
    values[key] = rawValue;
  }
  return values;
}

function parseStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const items: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    items.push(item);
  }
  return items;
}

function parseFollowUps(value: unknown): Answer['followUps'] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const followUps: { q: string; a: string }[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.q !== 'string' || typeof item.a !== 'string') return null;
    followUps.push({ q: item.q, a: item.a });
  }
  return followUps;
}

function parseAnswer(value: unknown): Answer | null {
  if (!isRecord(value) || typeof value.text !== 'string') return null;
  const media = value.media === undefined ? [] : parseStringArray(value.media);
  const followUps = parseFollowUps(value.followUps);
  if (!media || !followUps) return null;
  const answer: Answer = { text: value.text };
  if (media.length > 0) answer.media = [...media];
  if (followUps.length > 0) answer.followUps = followUps;
  return answer;
}

function parseRoundAnswers(value: unknown): Record<string, Answer> | null {
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
  if (!isRecord(value) || typeof value.asker !== 'string' || typeof value.question !== 'string') return null;
  const answers = parseRoundAnswers(value.answers);
  if (!answers) return null;
  if (value.format !== undefined && typeof value.format !== 'string') return null;
  const round: Round = { asker: value.asker, question: value.question, answers };
  if (typeof value.format === 'string') round.format = value.format;
  return round;
}

function parseRounds(value: unknown): readonly Round[] | null {
  if (!Array.isArray(value)) return null;
  const rounds: Round[] = [];
  for (const rawRound of value) {
    const round = parseRound(rawRound);
    if (!round) return null;
    rounds.push(round);
  }
  return rounds;
}

export function parseCurrentRound(value: unknown): SoloIssueCurrentRoundDraft | null {
  if (!isRecord(value) || typeof value.question !== 'string' || typeof value.formatId !== 'string') return null;
  const answers = parseStringRecord(value.answers);
  if (!answers) return null;
  return { question: value.question, formatId: value.formatId, answers };
}

export function parseLegacyCurrentRound(value: unknown): SoloIssueCurrentRoundDraft | null {
  if (!isRecord(value) || typeof value.q !== 'string' || typeof value.formatId !== 'string') return null;
  const answers = parseStringRecord(value.answers);
  if (!answers) return null;
  return { question: value.q, formatId: value.formatId, answers };
}

export function parseSoloIssueDraftV2(value: unknown): SoloIssueDraftV2 | null {
  if (
    !isRecord(value) ||
    value.version !== SOLO_ISSUE_DRAFT_VERSION ||
    typeof value.updatedAt !== 'string' ||
    !isIsoString(value.updatedAt) ||
    !isKind(value.kind) ||
    typeof value.title !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.sourceIssueId !== 'string'
  ) {
    return null;
  }
  const rounds = parseRounds(value.rounds);
  const currentRound = parseCurrentRound(value.currentRound);
  if (!rounds || !currentRound) return null;
  return {
    version: SOLO_ISSUE_DRAFT_VERSION,
    updatedAt: value.updatedAt,
    kind: value.kind,
    title: value.title,
    name: value.name,
    sourceIssueId: value.sourceIssueId,
    rounds,
    currentRound,
  };
}
