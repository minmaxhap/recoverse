import type { Kind, Round } from '@recoverse/shared';

export const SOLO_ISSUE_DRAFT_V2_KEY = 'recoverse_solo_issue_draft_v2';
export const SOLO_ISSUE_DRAFT_VERSION = 2;

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
