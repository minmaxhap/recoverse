import { isKind } from '@recoverse/shared';
import { listLocalStorageKeys, readLocalStorageValue, writeLocalStorageValue } from './safeLocalStorage';
import { parseJson, parseLegacyCurrentRound, parseSoloIssueDraftV2 } from './soloIssueDraftParser';
import {
  createDefaultSoloIssueDraft,
  draftHasContent,
  SOLO_ISSUE_DRAFT_V2_KEY,
  type SoloIssueDraftFailureReason,
  type SoloIssueDraftLoadOptions,
  type SoloIssueDraftLoadResult,
  type SoloIssueDraftSummary,
  type SoloIssueDraftV2,
  type SoloIssueDraftWriteResult,
  type SoloIssueLegacyDraftRequest,
} from './soloIssueDraftTypes';

const EMPTY_SUMMARY: SoloIssueDraftSummary = {
  resumable: false,
  kind: 'free',
  title: '',
  updatedAt: '',
  savedRoundCount: 0,
  hasPendingQuestion: false,
};

const LEGACY_KEY_PATTERN = /^recoverse_draft_round_(.+)_(\d+)$/;

function legacyKey(request: SoloIssueLegacyDraftRequest): string {
  return `recoverse_draft_round_${request.kind}_${request.roundCount}`;
}

/**
 * 레거시 키는 저장 당시의 rounds.length를 포함하므로, 마운트 시점의 호출자 힌트만으로는
 * 찾지 못할 수 있다. 저장소 키를 훑어 후보를 모으고, 라운드 수가 큰(최신) 것부터 시도한다.
 */
function discoverLegacyRequests(): SoloIssueLegacyDraftRequest[] {
  const requests: SoloIssueLegacyDraftRequest[] = [];
  for (const key of listLocalStorageKeys()) {
    const match = LEGACY_KEY_PATTERN.exec(key);
    if (!match) continue;
    const kind = match[1];
    if (!isKind(kind)) continue;
    requests.push({ kind, roundCount: Number(match[2]) });
  }
  return requests.sort((a, b) => b.roundCount - a.roundCount);
}

function failure(reason: SoloIssueDraftFailureReason): SoloIssueDraftLoadResult {
  return {
    ok: false,
    reason,
    draft: createDefaultSoloIssueDraft(new Date().toISOString()),
    migratedFromLegacy: false,
  };
}

function writeDraft(nextDraft: SoloIssueDraftV2, savedAt: string): SoloIssueDraftWriteResult {
  const draft = { ...nextDraft, updatedAt: savedAt };
  const result = writeLocalStorageValue(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(draft));
  return result.ok ? { ok: true, savedAt } : result;
}

function migrateLegacy(request: SoloIssueLegacyDraftRequest): SoloIssueDraftLoadResult {
  const key = legacyKey(request);
  const legacy = readLocalStorageValue(key);
  if (!legacy.ok) return failure(legacy.reason);
  if (legacy.value == null || legacy.value === '') return failure('not_found');
  const json = parseJson(legacy.value);
  if (!json.ok) return failure('malformed');
  const currentRound = parseLegacyCurrentRound(json.value);
  if (!currentRound) return failure('malformed');
  const savedAt = new Date().toISOString();
  const draft: SoloIssueDraftV2 = {
    ...createDefaultSoloIssueDraft(savedAt),
    kind: request.kind,
    currentRound,
  };
  const write = writeDraft(draft, savedAt);
  if (!write.ok) return failure(write.reason);
  const clearLegacy = writeLocalStorageValue(key, '');
  return clearLegacy.ok ? { ok: true, draft, migratedFromLegacy: true } : failure(clearLegacy.reason);
}

export function loadSoloIssueDraft(options: SoloIssueDraftLoadOptions = {}): SoloIssueDraftLoadResult {
  const stored = readLocalStorageValue(SOLO_ISSUE_DRAFT_V2_KEY);
  if (!stored.ok) return failure(stored.reason);
  if (stored.value == null || stored.value === '') {
    const candidates = options.legacy
      ? [options.legacy, ...discoverLegacyRequests()]
      : discoverLegacyRequests();
    const tried = new Set<string>();
    for (const request of candidates) {
      const key = legacyKey(request);
      if (tried.has(key)) continue;
      tried.add(key);
      const migrated = migrateLegacy(request);
      if (migrated.ok) return migrated;
      // 비어 있거나 깨진 후보는 건너뛰고, 저장소 오류는 그대로 알린다.
      if (migrated.reason !== 'not_found' && migrated.reason !== 'malformed') return migrated;
    }
    return failure('not_found');
  }
  const json = parseJson(stored.value);
  if (!json.ok) return failure('malformed');
  const draft = parseSoloIssueDraftV2(json.value);
  if (!draft) return failure('malformed');
  return { ok: true, draft, migratedFromLegacy: false };
}

/**
 * 저장된 v2 드래프트를 읽기 전용으로 훑어 이어쓰기 카드용 요약을 만든다.
 * loadSoloIssueDraft와 달리 저장소에 아무것도 쓰지 않고 레거시 마이그레이션도 하지 않는다 —
 * 홈 화면이 부작용 없이 "이어쓸 초안이 있는지"만 알 수 있어야 하기 때문이다.
 * 레거시(v1)만 있는 경우는 요약에 잡히지 않지만, 혼자 쓰기로 진입하면 그때 정상 마이그레이션된다.
 */
export function peekSoloIssueDraft(): SoloIssueDraftSummary {
  const stored = readLocalStorageValue(SOLO_ISSUE_DRAFT_V2_KEY);
  if (!stored.ok || stored.value == null || stored.value === '') return EMPTY_SUMMARY;
  const json = parseJson(stored.value);
  if (!json.ok) return EMPTY_SUMMARY;
  const draft = parseSoloIssueDraftV2(json.value);
  if (!draft || !draftHasContent(draft)) return EMPTY_SUMMARY;
  return {
    resumable: true,
    kind: draft.kind,
    title: draft.title.trim(),
    updatedAt: draft.updatedAt,
    savedRoundCount: draft.rounds.length,
    hasPendingQuestion: draft.currentRound.question.trim().length > 0,
  };
}

export function saveSoloIssueDraft(nextDraft: SoloIssueDraftV2): SoloIssueDraftWriteResult {
  return writeDraft(nextDraft, new Date().toISOString());
}

export function clearSoloIssueDraft(): SoloIssueDraftWriteResult {
  const savedAt = new Date().toISOString();
  const result = writeLocalStorageValue(SOLO_ISSUE_DRAFT_V2_KEY, '');
  return result.ok ? { ok: true, savedAt } : result;
}
