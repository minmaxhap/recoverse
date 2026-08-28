export type Audience = 'solo' | 'pair' | 'friends';
export type CognitiveDepth = 0 | 1 | 2 | 3;
export type SocialExposure = 0 | 1 | 2 | 3;
export type ActivityType =
  | 'prompt'
  | 'choice'
  | 'memory'
  | 'predict-reveal'
  | 'cooperate'
  | 'appreciation'
  | 'plan';

export type SoloMode = 'quick' | 'review' | 'free';

export const REVIEW_LENS_IDS = [
  'diary',
  'content',
  'doodle',
  'meal',
  'spending',
  'experience',
  'people',
  'work',
  'conversation',
  'place',
  'photo',
  'routine',
] as const;
export type ReviewLensId = (typeof REVIEW_LENS_IDS)[number];

export const REVIEW_SCOPE_TYPES = [
  'today',
  'recent',
  'week',
  'month',
  'year',
  'trip',
  'project',
  'relationship',
  'custom',
] as const;
export type ReviewScopeType = (typeof REVIEW_SCOPE_TYPES)[number];

export interface ReviewScope {
  type: ReviewScopeType;
  label?: string;
  from?: string;
  to?: string;
}

export interface ReviewLensDefinition {
  id: ReviewLensId;
  revision: number;
  title: string;
  promise: string;
  sourceHints: string[];
  selectionPrompts: string[];
  reflectionQuestionIds: string[];
  completionQuestionIds: string[];
  tags: string[];
}

/**
 * 리뷰 렌즈로 쓴 라운드의 출처. `subject`는 그 답이 붙은 장면 이름("한강 야경 사진")이다.
 * 장면 이름을 question에 붙이면 해마다 글자가 달라져 재발견이 절대 묶이지 않는다 —
 * question은 렌즈의 고정 질문만 두고, 매번 달라지는 이름은 여기로 옮긴다.
 */
export interface ReviewContext {
  lensId: ReviewLensId;
  lensRevision: number;
  scope: ReviewScope;
  subject?: string;
}

export interface QuestionDefinition {
  id: string;
  revision: number;
  text: string;
  audience: Audience[];
  intents: string[];
  stage: string;
  cognitiveDepth: CognitiveDepth;
  socialExposure: SocialExposure;
  activityType: ActivityType;
  answerMode: 'short-text' | 'long-text' | 'choice' | 'one-line';
  estimatedSeconds: number;
  safety: 'general' | 'optional-sensitive';
  repeatKey?: string;
  followUpIds?: string[];
  tags: string[];
}

export interface PathDefinition {
  id: string;
  revision: number;
  audience: Audience;
  title: string;
  promise: string;
  estimatedMinutes: number;
  steps: Array<{
    stage: string;
    candidateQuestionIds: string[];
    optional: boolean;
  }>;
}

const CONTENT_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isValidContentId(value: unknown): value is string {
  return typeof value === 'string' && CONTENT_ID_RE.test(value);
}

export function isValidRevision(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1;
}

export function isValidPathStep(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isReviewLensId(value: unknown): value is ReviewLensId {
  return typeof value === 'string' && REVIEW_LENS_IDS.some((id) => id === value);
}

export function isReviewScopeType(value: unknown): value is ReviewScopeType {
  return typeof value === 'string' && REVIEW_SCOPE_TYPES.some((type) => type === value);
}

export function parseReviewContext(value: unknown): ReviewContext | null {
  if (!isRecord(value) || !isReviewLensId(value.lensId)) return null;
  if (!isValidRevision(value.lensRevision)) return null;
  if (!isRecord(value.scope) || !isReviewScopeType(value.scope.type)) return null;
  if (value.scope.label !== undefined && typeof value.scope.label !== 'string') return null;
  if (value.scope.from !== undefined && typeof value.scope.from !== 'string') return null;
  if (value.scope.to !== undefined && typeof value.scope.to !== 'string') return null;

  if (value.subject !== undefined && typeof value.subject !== 'string') return null;

  const scope: ReviewScope = { type: value.scope.type };
  if (typeof value.scope.label === 'string') scope.label = value.scope.label;
  if (typeof value.scope.from === 'string') scope.from = value.scope.from;
  if (typeof value.scope.to === 'string') scope.to = value.scope.to;
  const context: ReviewContext = { lensId: value.lensId, lensRevision: value.lensRevision, scope };
  // 빈 문자열은 없는 것과 같다 — 화면에 빈 꼬리표가 남지 않게 여기서 떨군다.
  if (typeof value.subject === 'string' && value.subject.trim()) context.subject = value.subject.trim();
  return context;
}
