import {
  isKind,
  isReviewLensId,
  isReviewScopeType,
  isValidContentId,
  isValidPathStep,
  isValidRevision,
  parseReviewContext,
  type Answer,
  type Round,
  type SoloMode,
} from '@recoverse/shared';
import type { ReviewDraft, ReviewItemDraft } from '../components/solo/reviewContent';
import {
  SOLO_ISSUE_DRAFT_VERSION,
  type SoloIssueCurrentRoundDraft,
  type SoloIssueDraftV2,
  type SoloGuidedPathState,
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
  if (typeof value.skipped === 'boolean') answer.skipped = value.skipped;
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
  if (isValidContentId(value.questionId)) round.questionId = value.questionId;
  if (isValidRevision(value.questionRevision)) round.questionRevision = value.questionRevision;
  if (isValidContentId(value.pathId)) round.pathId = value.pathId;
  if (isValidPathStep(value.pathStep)) round.pathStep = value.pathStep;
  const review = parseReviewContext(value.review);
  if (review) round.review = review;
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
  const review = parseReviewContext(value.review);
  return {
    question: value.question,
    formatId: value.formatId,
    answers,
    ...(isValidContentId(value.questionId) ? { questionId: value.questionId } : {}),
    ...(isValidRevision(value.questionRevision) ? { questionRevision: value.questionRevision } : {}),
    ...(isValidContentId(value.pathId) ? { pathId: value.pathId } : {}),
    ...(isValidPathStep(value.pathStep) ? { pathStep: value.pathStep } : {}),
    ...(review ? { review } : {}),
  };
}

export function parseLegacyCurrentRound(value: unknown): SoloIssueCurrentRoundDraft | null {
  if (!isRecord(value) || typeof value.q !== 'string' || typeof value.formatId !== 'string') return null;
  const answers = parseStringRecord(value.answers);
  if (!answers) return null;
  return { question: value.q, formatId: value.formatId, answers };
}

function parseSoloMode(value: unknown): SoloMode | '' {
  return value === 'quick' || value === 'review' || value === 'free' ? value : '';
}

function parseReviewItem(value: unknown): ReviewItemDraft | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string' || typeof value.note !== 'string') {
    return null;
  }
  return { id: value.id, label: value.label, note: value.note };
}

function parseReviewComposer(value: unknown): ReviewDraft | undefined {
  if (!isRecord(value)) return undefined;
  if (value.phase !== 'lens' && value.phase !== 'context' && value.phase !== 'items' && value.phase !== 'complete') {
    return undefined;
  }
  if (value.lensId !== '' && !isReviewLensId(value.lensId)) return undefined;
  if (!isReviewScopeType(value.scopeType) || typeof value.scopeLabel !== 'string' || !Array.isArray(value.items)) {
    return undefined;
  }
  const items = value.items.map(parseReviewItem);
  if (items.some((item) => item === null)) return undefined;
  return {
    phase: value.phase,
    lensId: value.lensId,
    scopeType: value.scopeType,
    scopeLabel: value.scopeLabel,
    items: items.filter((item): item is ReviewItemDraft => item !== null),
  };
}

function parseGuidedPath(value: unknown): SoloGuidedPathState | undefined {
  if (!isRecord(value) || !isValidContentId(value.pathId)) return undefined;
  if (!isValidRevision(value.pathRevision)) return undefined;
  if (value.mode !== 'short' && value.mode !== 'standard' && value.mode !== 'extended') return undefined;
  if (!isValidPathStep(value.step)) return undefined;
  return {
    pathId: value.pathId,
    pathRevision: value.pathRevision,
    mode: value.mode,
    step: value.step,
  };
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
  const soloMode = parseSoloMode(value.soloMode);
  const guidedPath = parseGuidedPath(value.guidedPath);
  const reviewComposer = parseReviewComposer(value.reviewComposer);
  return {
    version: SOLO_ISSUE_DRAFT_VERSION,
    updatedAt: value.updatedAt,
    kind: value.kind,
    title: value.title,
    name: value.name,
    sourceIssueId: value.sourceIssueId,
    rounds,
    currentRound,
    ...(soloMode ? { soloMode } : {}),
    ...(typeof value.quickReady === 'boolean' ? { quickReady: value.quickReady } : {}),
    ...(guidedPath ? { guidedPath } : {}),
    ...(reviewComposer ? { reviewComposer } : {}),
  };
}
