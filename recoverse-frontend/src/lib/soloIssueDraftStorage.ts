import { isKind } from '@recoverse/shared';
import { listLocalStorageKeys, readLocalStorageValue, writeLocalStorageValue } from './safeLocalStorage';
import { parseJson, parseLegacyCurrentRound, parseSoloIssueDraftV2 } from './soloIssueDraftParser';
import {
  createDefaultSoloIssueDraft,
  SOLO_ISSUE_DRAFT_V2_KEY,
  type SoloIssueDraftFailureReason,
  type SoloIssueDraftLoadOptions,
  type SoloIssueDraftLoadResult,
  type SoloIssueDraftV2,
  type SoloIssueDraftWriteResult,
  type SoloIssueLegacyDraftRequest,
} from './soloIssueDraftTypes';

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

export function saveSoloIssueDraft(nextDraft: SoloIssueDraftV2): SoloIssueDraftWriteResult {
  return writeDraft(nextDraft, new Date().toISOString());
}

export function clearSoloIssueDraft(): SoloIssueDraftWriteResult {
  const savedAt = new Date().toISOString();
  const result = writeLocalStorageValue(SOLO_ISSUE_DRAFT_V2_KEY, '');
  return result.ok ? { ok: true, savedAt } : result;
}
