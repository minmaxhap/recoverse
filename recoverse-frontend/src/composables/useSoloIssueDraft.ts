import { ref, type Ref } from 'vue';
import {
  clearSoloIssueDraft,
  loadSoloIssueDraft,
  saveSoloIssueDraft,
} from '../lib/soloIssueDraftStorage';
import type {
  SoloIssueDraftFailureReason,
  SoloIssueDraftLoadOptions,
  SoloIssueDraftLoadResult,
  SoloIssueDraftV2,
  SoloIssueDraftWriteResult,
} from '../lib/soloIssueDraftTypes';

export {
  clearSoloIssueDraft,
  loadSoloIssueDraft,
  peekSoloIssueDraft,
  saveSoloIssueDraft,
} from '../lib/soloIssueDraftStorage';
export {
  createDefaultSoloIssueDraft,
  draftHasContent,
  SOLO_DEFAULT_NAME,
  SOLO_ISSUE_DRAFT_V2_KEY,
  SOLO_ISSUE_DRAFT_VERSION,
} from '../lib/soloIssueDraftTypes';
export type {
  SoloIssueCurrentRoundDraft,
  SoloIssueDraftFailureReason,
  SoloIssueDraftLoadOptions,
  SoloIssueDraftLoadResult,
  SoloIssueDraftSummary,
  SoloIssueDraftV2,
  SoloIssueDraftWriteResult,
  SoloIssueLegacyDraftRequest,
} from '../lib/soloIssueDraftTypes';

type SoloIssueDraftStatus = 'idle' | 'saved' | 'error';

export type UseSoloIssueDraftResult = {
  readonly status: Ref<SoloIssueDraftStatus>;
  readonly savedAt: Ref<string>;
  readonly error: Ref<SoloIssueDraftFailureReason | ''>;
  readonly load: (options?: SoloIssueDraftLoadOptions) => SoloIssueDraftLoadResult;
  readonly save: (draft: SoloIssueDraftV2) => SoloIssueDraftWriteResult;
  readonly clear: () => SoloIssueDraftWriteResult;
};

export function useSoloIssueDraft(): UseSoloIssueDraftResult {
  const status = ref<SoloIssueDraftStatus>('idle');
  const savedAt = ref('');
  const error = ref<SoloIssueDraftFailureReason | ''>('');

  function load(options?: SoloIssueDraftLoadOptions): SoloIssueDraftLoadResult {
    const result = loadSoloIssueDraft(options);
    if (result.ok) {
      status.value = 'saved';
      savedAt.value = result.draft.updatedAt;
      error.value = '';
      return result;
    }
    status.value = result.reason === 'not_found' ? 'idle' : 'error';
    savedAt.value = '';
    error.value = result.reason === 'not_found' ? '' : result.reason;
    return result;
  }

  function save(draft: SoloIssueDraftV2): SoloIssueDraftWriteResult {
    const result = saveSoloIssueDraft(draft);
    status.value = result.ok ? 'saved' : 'error';
    savedAt.value = result.ok ? result.savedAt : '';
    error.value = result.ok ? '' : result.reason;
    return result;
  }

  function clear(): SoloIssueDraftWriteResult {
    const result = clearSoloIssueDraft();
    status.value = result.ok ? 'idle' : 'error';
    savedAt.value = '';
    error.value = result.ok ? '' : result.reason;
    return result;
  }

  return { status, savedAt, error, load, save, clear };
}
