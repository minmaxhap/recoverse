import type { Kind, Round } from '@recoverse/shared';

export const SOLO_ISSUE_DRAFT_V2_KEY = 'recoverse_solo_issue_draft_v2';
export const SOLO_ISSUE_DRAFT_VERSION = 2;

/** 혼자 쓰기 첫 진입의 기본 필자명. 이 값 그대로면 아직 "내 이름"을 정하지 않은 것으로 본다. */
export const SOLO_DEFAULT_NAME = '나';

export type SoloIssueCurrentRoundDraft = {
  readonly question: string;
  readonly formatId: string;
  readonly answers: Readonly<Record<string, string>>;
};

export type SoloIssueDraftV2 = {
  readonly version: typeof SOLO_ISSUE_DRAFT_VERSION;
  readonly updatedAt: string;
  readonly kind: Kind;
  readonly title: string;
  readonly name: string;
  readonly sourceIssueId: string;
  readonly rounds: readonly Round[];
  readonly currentRound: SoloIssueCurrentRoundDraft;
};

export type SoloIssueDraftFailureReason =
  | 'not_found'
  | 'read_failed'
  | 'storage_unavailable'
  | 'malformed'
  | 'write_failed';

export type SoloIssueDraftLoadResult =
  | { readonly ok: true; readonly draft: SoloIssueDraftV2; readonly migratedFromLegacy: boolean }
  | {
      readonly ok: false;
      readonly reason: SoloIssueDraftFailureReason;
      readonly draft: SoloIssueDraftV2;
      readonly migratedFromLegacy: false;
    };

export type SoloIssueDraftWriteResult =
  | { readonly ok: true; readonly savedAt: string }
  | { readonly ok: false; readonly reason: SoloIssueDraftFailureReason };

export type SoloIssueLegacyDraftRequest = {
  readonly kind: Kind;
  readonly roundCount: number;
};

export type SoloIssueDraftLoadOptions = {
  readonly legacy?: SoloIssueLegacyDraftRequest;
};

/**
 * 홈 화면이 드래프트를 "에디터로 불러오지 않고" 이어쓰기 카드에 요약만 띄우기 위한 읽기 전용 형태.
 * 저장소를 건드리지 않는 peek 경로 전용 — 전체 복원/마이그레이션은 loadSoloIssueDraft가 담당한다.
 */
export type SoloIssueDraftSummary = {
  readonly resumable: boolean;
  readonly kind: Kind;
  readonly title: string;
  readonly updatedAt: string;
  readonly savedRoundCount: number;
  readonly hasPendingQuestion: boolean;
};

/**
 * 드래프트에 "이어서 쓸 만한" 내용이 있는지 판단한다. 종류만 고른 빈 초안(기본 이름·빈 제목·
 * 라운드 없음·작성 중 질문 없음)은 이어쓰기 대상이 아니다. 홈의 peek와 혼자 쓰기의 자동저장
 * 상태 라벨이 같은 기준을 쓰도록 이 술어를 공유한다.
 */
export function draftHasContent(draft: SoloIssueDraftV2): boolean {
  const name = draft.name.trim();
  return (
    draft.title.trim().length > 0 ||
    (name.length > 0 && name !== SOLO_DEFAULT_NAME) ||
    draft.sourceIssueId.length > 0 ||
    draft.rounds.length > 0 ||
    draft.currentRound.question.trim().length > 0 ||
    Object.values(draft.currentRound.answers).some((answer) => answer.trim().length > 0)
  );
}

export function createDefaultSoloIssueDraft(updatedAt: string): SoloIssueDraftV2 {
  return {
    version: SOLO_ISSUE_DRAFT_VERSION,
    updatedAt,
    kind: 'free',
    title: '',
    name: '',
    sourceIssueId: '',
    rounds: [],
    currentRound: { question: '', formatId: '', answers: {} },
  };
}
