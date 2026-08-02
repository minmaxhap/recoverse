import type { Ref } from 'vue';
import { ref } from 'vue';
import {
  createEmptyReviewDraft,
  REVIEW_LENS_IDS,
  REVIEW_SCOPE_TYPES,
  type ReviewDraft,
  type ReviewItemDraft,
  type ReviewLensId,
  type ReviewScopeType,
  type SoloMode,
} from '../components/solo/reviewContent';
import { REVIEW_LENSES } from '../components/solo/reviewContent';
import type { SoloIssueDraftSummary } from './useSoloIssueDraft';

export const SOLO_FLOW_STATE_KEY = 'recoverse_solo_flow_v1';

type SoloFlowState = {
  readonly mode: SoloMode | '';
  readonly quickReady: boolean;
  readonly review: ReviewDraft;
  readonly updatedAt: string;
};

type UseSoloFlowState = {
  readonly mode: Ref<SoloMode | ''>;
  readonly quickReady: Ref<boolean>;
  readonly review: Ref<ReviewDraft>;
  readonly error: Ref<boolean>;
  readonly save: () => boolean;
  readonly reset: () => void;
};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLensId(value: unknown): value is ReviewLensId {
  return typeof value === 'string' && REVIEW_LENS_IDS.some((id) => id === value);
}

function isScopeType(value: unknown): value is ReviewScopeType {
  return typeof value === 'string' && REVIEW_SCOPE_TYPES.some((scope) => scope === value);
}

function isReviewPhase(value: unknown): value is ReviewDraft['phase'] {
  return value === 'lens' || value === 'context' || value === 'items' || value === 'complete';
}

function parseItem(value: unknown): ReviewItemDraft | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string' || typeof value.note !== 'string') {
    return null;
  }
  return { id: value.id, label: value.label, note: value.note };
}

function parseReview(value: unknown): ReviewDraft | null {
  if (!isRecord(value)) return null;
  if (!isReviewPhase(value.phase)) return null;
  if (value.lensId !== '' && !isLensId(value.lensId)) return null;
  if (!isScopeType(value.scopeType) || typeof value.scopeLabel !== 'string' || !Array.isArray(value.items)) return null;
  const items = value.items.map(parseItem);
  if (items.some((item) => item === null)) return null;
  return {
    phase: value.phase,
    lensId: value.lensId,
    scopeType: value.scopeType,
    scopeLabel: value.scopeLabel,
    items: items.filter((item): item is ReviewItemDraft => item !== null),
  };
}

function parseState(raw: string | null): SoloFlowState | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
  if (!isRecord(value)) return null;
  if (value.mode !== '' && value.mode !== 'quick' && value.mode !== 'review' && value.mode !== 'free') return null;
  if (typeof value.quickReady !== 'boolean') return null;
  const review = parseReview(value.review);
  if (!review) return null;
  return {
    mode: value.mode,
    quickReady: value.quickReady,
    review,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
  };
}

function readStoredState(): SoloFlowState | null {
  try {
    return parseState(localStorage.getItem(SOLO_FLOW_STATE_KEY));
  } catch (error) {
    if (error instanceof DOMException) return null;
    throw error;
  }
}

export function peekSoloFlowDraft(): SoloIssueDraftSummary | null {
  const state = readStoredState();
  if (!state || state.mode === '') return null;
  const hasFlowProgress =
    (state.mode === 'review' && state.review.phase !== 'lens') ||
    (state.mode === 'quick' && state.quickReady);
  if (!hasFlowProgress) return null;
  const lens = REVIEW_LENSES.find((candidate) => candidate.id === state.review.lensId);
  const title = state.mode === 'review' ? `${lens?.title ?? '대상'} 리뷰 쓰는 중` : state.mode === 'quick' ? '바로 쓰는 중' : '직접 엮는 중';
  return {
    resumable: true,
    kind: 'free',
    title,
    updatedAt: state.updatedAt,
    savedRoundCount: state.review.phase === 'complete' ? state.review.items.length : 0,
    hasPendingQuestion: state.mode === 'review' && state.review.phase !== 'lens',
  };
}

export function useSoloFlowState(): UseSoloFlowState {
  const restored = readStoredState();
  const mode = ref<SoloMode | ''>(restored?.mode ?? '');
  const quickReady = ref(restored?.quickReady ?? false);
  const review = ref<ReviewDraft>(restored?.review ?? createEmptyReviewDraft());
  const error = ref(false);

  function save(): boolean {
    try {
      localStorage.setItem(
        SOLO_FLOW_STATE_KEY,
        JSON.stringify({ mode: mode.value, quickReady: quickReady.value, review: review.value, updatedAt: new Date().toISOString() }),
      );
      error.value = false;
      return true;
    } catch (caught) {
      if (caught instanceof DOMException) {
        error.value = true;
        return false;
      }
      throw caught;
    }
  }

  function reset(): void {
    mode.value = '';
    quickReady.value = false;
    review.value = createEmptyReviewDraft();
    try {
      localStorage.removeItem(SOLO_FLOW_STATE_KEY);
      error.value = false;
    } catch (caught) {
      if (caught instanceof DOMException) {
        error.value = true;
        return;
      }
      throw caught;
    }
  }

  return { mode, quickReady, review, error, save, reset };
}
