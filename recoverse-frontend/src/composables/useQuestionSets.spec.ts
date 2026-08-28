// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASK_AGAIN_SET_NAME, QUESTION_SETS_KEY, type QuestionSet } from './useQuestionSets';

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

/** 모듈 수준 싱글턴이라 테스트마다 새로 읽어들인다. */
async function freshSets() {
  vi.resetModules();
  const module = await import('./useQuestionSets');
  return module.useQuestionSets();
}

function stored(): readonly QuestionSet[] {
  return JSON.parse(localStorage.getItem(QUESTION_SETS_KEY) ?? '[]') as QuestionSet[];
}

describe('keepForNextTime', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: createMemoryStorage() });
  });

  it('gathers questions from several issues into one standing set', async () => {
    // Given
    const first = await freshSets();
    expect(first.keepForNextTime(['올해 가장 잘한 선택은?'])).toBe(true);

    // When: 다음 호에서 또 하나를 담는다
    const later = await freshSets();
    expect(later.keepForNextTime(['무엇이 마음에 붙잡혀 있나요?'])).toBe(true);

    // Then: 세트는 하나이고, 방금 마음먹은 질문이 앞에 온다 — 다음에 쓸 때 먼저 만나도록
    const sets = stored();
    expect(sets).toHaveLength(1);
    expect(sets[0].name).toBe(ASK_AGAIN_SET_NAME);
    expect(sets[0].questions).toEqual(['무엇이 마음에 붙잡혀 있나요?', '올해 가장 잘한 선택은?']);
  });

  it('does not pile up a second copy of a question already standing', async () => {
    // Given
    const questionSets = await freshSets();
    questionSets.keepForNextTime(['올해 가장 잘한 선택은?']);

    // When
    questionSets.keepForNextTime(['올해 가장 잘한 선택은?', '  올해 가장 잘한 선택은?  ']);

    // Then
    expect(stored()[0].questions).toEqual(['올해 가장 잘한 선택은?']);
  });

  it('leaves the shelf of sets alone when nothing was picked', async () => {
    const questionSets = await freshSets();
    expect(questionSets.keepForNextTime([])).toBe(false);
    expect(stored()).toEqual([]);
  });
});
