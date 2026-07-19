import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useDraft } from './useDraft';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); },
  };
}

describe('useDraft', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it('stores a draft and restores it for a new editor instance', async () => {
    const first = useDraft(() => 'recoverse_draft_test');
    first.value.value = JSON.stringify({ q: 'What scene stayed with me?', answers: { me: 'A note' } });
    await nextTick();

    expect(first.status.value).toBe('saved');
    expect(localStorage.getItem('recoverse_draft_test')).toBe(first.value.value);

    const restored = useDraft(() => 'recoverse_draft_test');
    expect(restored.value.value).toBe(first.value.value);
    expect(restored.status.value).toBe('idle');
  });

  it('restores the matching draft when the editor key changes', async () => {
    localStorage.setItem('recoverse_draft_second', 'saved second draft');
    const key = ref('recoverse_draft_first');
    const draft = useDraft(() => key.value);

    draft.value.value = 'saved first draft';
    await nextTick();
    key.value = 'recoverse_draft_second';
    await nextTick();

    expect(draft.value.value).toBe('saved second draft');
  });

  it('clears a published or discarded draft', async () => {
    const draft = useDraft(() => 'recoverse_draft_clear');
    draft.value.value = 'temporary draft';
    await nextTick();

    draft.clear();

    expect(draft.value.value).toBe('');
    expect(draft.status.value).toBe('idle');
    expect(localStorage.getItem('recoverse_draft_clear')).toBe('');
  });
});
