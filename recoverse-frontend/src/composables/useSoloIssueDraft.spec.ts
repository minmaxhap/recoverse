import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Round } from '@recoverse/shared';
import {
  clearSoloIssueDraft,
  createDefaultSoloIssueDraft,
  loadSoloIssueDraft,
  saveSoloIssueDraft,
  SOLO_ISSUE_DRAFT_V2_KEY,
  useSoloIssueDraft,
  type SoloIssueDraftV2,
} from './useSoloIssueDraft';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function completeDraft(updatedAt: string): SoloIssueDraftV2 {
  const rounds: readonly Round[] = [
    {
      asker: 'Mina',
      question: 'What changed this year?',
      format: 'three-scenes',
      answers: { Mina: { text: 'Moved cities' } },
    },
  ];
  return {
    version: 2,
    updatedAt,
    kind: 'yearend',
    title: '2026 Year End',
    name: 'Mina',
    sourceIssueId: 'issue-2025',
    rounds,
    currentRound: {
      question: 'What scene stayed with me?',
      formatId: 'keyword',
      answers: { Mina: 'Train station', Joon: 'Late dinner' },
    },
  };
}

describe('useSoloIssueDraft', () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it('restores every v2 draft field when a complete fixture exists', () => {
    // Given
    const fixture = completeDraft('2026-07-19T12:00:00.000Z');
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));

    // When
    const result = loadSoloIssueDraft();

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft).toEqual(fixture);
      expect(result.migratedFromLegacy).toBe(false);
    }
  });

  it('returns a typed malformed failure and default draft when v2 JSON is invalid', () => {
    // Given
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, '{bad json');

    // When
    const result = loadSoloIssueDraft();

    // Then
    expect(result).toMatchObject({
      ok: false,
      reason: 'malformed',
      migratedFromLegacy: false,
      draft: createDefaultSoloIssueDraft(result.draft.updatedAt),
    });
  });

  it('keeps a clean first visit idle when no draft exists', () => {
    // Given
    const adapter = useSoloIssueDraft();

    // When
    const result = adapter.load();

    // Then
    expect(result).toMatchObject({ ok: false, reason: 'not_found', migratedFromLegacy: false });
    expect(adapter.status.value).toBe('idle');
    expect(adapter.savedAt.value).toBe('');
    expect(adapter.error.value).toBe('');
  });

  it('marks malformed draft restores as errors', () => {
    // Given
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, '{bad json');
    const adapter = useSoloIssueDraft();

    // When
    const result = adapter.load();

    // Then
    expect(result).toMatchObject({ ok: false, reason: 'malformed', migratedFromLegacy: false });
    expect(adapter.status.value).toBe('error');
    expect(adapter.savedAt.value).toBe('');
    expect(adapter.error.value).toBe('malformed');
  });

  it('saves a complete v2 fixture and exposes the saved timestamp through a new composable instance', async () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T12:34:56.000Z'));
    const adapter = useSoloIssueDraft();
    const fixture = completeDraft('2026-07-19T12:00:00.000Z');

    // When
    const save = adapter.save(fixture);
    await nextTick();
    const loaded = useSoloIssueDraft();
    const restore = loaded.load();

    // Then
    expect(save).toEqual({ ok: true, savedAt: '2026-07-19T12:34:56.000Z' });
    expect(adapter.status.value).toBe('saved');
    expect(adapter.savedAt.value).toBe('2026-07-19T12:34:56.000Z');
    expect(restore.ok).toBe(true);
    if (restore.ok) expect(restore.draft).toEqual({ ...fixture, updatedAt: '2026-07-19T12:34:56.000Z' });
  });

  it('marks a restored v2 draft as saved with its updated timestamp', () => {
    // Given
    const storage = createMemoryStorage();
    const fixture = completeDraft('2026-07-19T12:00:00.000Z');
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
    const adapter = useSoloIssueDraft();

    // When
    const restore = adapter.load();

    // Then
    expect(restore.ok).toBe(true);
    expect(adapter.status.value).toBe('saved');
    expect(adapter.savedAt.value).toBe(fixture.updatedAt);
    expect(adapter.error.value).toBe('');
  });

  it('clears a restored saved timestamp after a later write failure', () => {
    // Given
    const storage = createMemoryStorage();
    const fixture = completeDraft('2026-07-19T12:00:00.000Z');
    storage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
    const adapter = useSoloIssueDraft();
    const restore = adapter.load();
    expect(restore.ok).toBe(true);
    expect(adapter.savedAt.value).toBe(fixture.updatedAt);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem() {
          throw new Error('quota exceeded');
        },
      } satisfies Storage,
    });

    // When
    const result = adapter.save(completeDraft('2026-07-19T12:05:00.000Z'));

    // Then
    expect(adapter.status.value).toBe('error');
    expect(result).toEqual({ ok: false, reason: 'write_failed' });
    expect(adapter.savedAt.value).toBe('');
    expect(adapter.error.value).toBe('write_failed');
  });

  it('returns a typed write failure when localStorage setItem throws', () => {
    // Given
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...createMemoryStorage(),
        setItem() {
          throw new Error('quota exceeded');
        },
      } satisfies Storage,
    });

    // When
    const adapter = useSoloIssueDraft();
    const result = adapter.save(completeDraft('2026-07-19T12:00:00.000Z'));

    // Then
    expect(result).toEqual({ ok: false, reason: 'write_failed' });
    expect(adapter.status.value).toBe('error');
    expect(adapter.error.value).toBe('write_failed');
  });

  it('migrates a legacy current round only when v2 is missing and clears legacy after v2 write succeeds', () => {
    // Given
    const legacyKey = 'recoverse_draft_round_yearend_1';
    localStorage.setItem(
      legacyKey,
      JSON.stringify({ q: 'Legacy question', formatId: 'letter', answers: { Mina: 'Legacy answer' } }),
    );

    // When
    const result = loadSoloIssueDraft({ legacy: { kind: 'yearend', roundCount: 1 } });

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migratedFromLegacy).toBe(true);
      expect(result.draft.kind).toBe('yearend');
      expect(result.draft.currentRound).toEqual({
        question: 'Legacy question',
        formatId: 'letter',
        answers: { Mina: 'Legacy answer' },
      });
    }
    expect(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY)).toBe(JSON.stringify(result.draft));
    expect(localStorage.getItem(legacyKey)).toBe('');
  });

  it('discovers legacy drafts across supported kinds and plausible round counts without caller hints', () => {
    // Given
    const legacyKey = 'recoverse_draft_round_reading_12';
    localStorage.setItem(
      legacyKey,
      JSON.stringify({ q: 'Book that changed me?', formatId: 'quote', answers: { Mina: 'The left page' } }),
    );

    // When
    const result = loadSoloIssueDraft();

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migratedFromLegacy).toBe(true);
      expect(result.draft.kind).toBe('reading');
      expect(result.draft.currentRound).toEqual({
        question: 'Book that changed me?',
        formatId: 'quote',
        answers: { Mina: 'The left page' },
      });
    }
    expect(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY)).toBe(JSON.stringify(result.draft));
    expect(localStorage.getItem(legacyKey)).toBe('');
  });

  it('keeps discovered legacy drafts untouched when a valid v2 draft exists', () => {
    // Given
    const legacyKey = 'recoverse_draft_round_reading_12';
    const fixture = completeDraft('2026-07-19T12:00:00.000Z');
    const legacyValue = JSON.stringify({
      q: 'Stale discovered legacy question',
      formatId: 'quote',
      answers: { Mina: 'Stale discovered answer' },
    });
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    localStorage.setItem(legacyKey, legacyValue);

    // When
    const result = loadSoloIssueDraft();

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft).toEqual(fixture);
      expect(result.migratedFromLegacy).toBe(false);
    }
    expect(localStorage.getItem(legacyKey)).toBe(legacyValue);
  });

  it('keeps a stale legacy draft untouched when a valid v2 draft exists', () => {
    // Given
    const legacyKey = 'recoverse_draft_round_yearend_1';
    const fixture = completeDraft('2026-07-19T12:00:00.000Z');
    const legacyValue = JSON.stringify({
      q: 'Stale legacy question',
      formatId: 'letter',
      answers: { Mina: 'Stale legacy answer' },
    });
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(fixture));
    localStorage.setItem(legacyKey, legacyValue);

    // When
    const result = loadSoloIssueDraft({ legacy: { kind: 'yearend', roundCount: 1 } });

    // Then
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft).toEqual(fixture);
      expect(result.migratedFromLegacy).toBe(false);
    }
    expect(localStorage.getItem(legacyKey)).toBe(legacyValue);
  });

  it('does not clear legacy when migration cannot write v2', () => {
    // Given
    const memoryStorage = createMemoryStorage();
    const legacyKey = 'recoverse_draft_round_travel_2';
    memoryStorage.setItem(legacyKey, JSON.stringify({ q: 'Keep me', formatId: '', answers: { Mina: 'Still here' } }));
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...memoryStorage,
        setItem(key: string, value: string) {
          if (key === SOLO_ISSUE_DRAFT_V2_KEY) throw new Error('quota exceeded');
          memoryStorage.setItem(key, value);
        },
      } satisfies Storage,
    });

    // When
    const result = loadSoloIssueDraft({ legacy: { kind: 'travel', roundCount: 2 } });

    // Then
    expect(result).toMatchObject({ ok: false, reason: 'write_failed', migratedFromLegacy: false });
    expect(localStorage.getItem(legacyKey)).toBe(
      JSON.stringify({ q: 'Keep me', formatId: '', answers: { Mina: 'Still here' } }),
    );
  });

  it('clears the v2 draft with a successful empty boundary write', () => {
    // Given
    localStorage.setItem(SOLO_ISSUE_DRAFT_V2_KEY, JSON.stringify(completeDraft('2026-07-19T12:00:00.000Z')));

    // When
    const result = clearSoloIssueDraft();

    // Then
    expect(result.ok).toBe(true);
    expect(localStorage.getItem(SOLO_ISSUE_DRAFT_V2_KEY)).toBe('');
  });
});
