// @vitest-environment jsdom

import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Issue } from '@recoverse/shared';
import { QUESTION_SETS_KEY, type QuestionSet } from '../composables/useQuestionSets';

function issue(id: string, title: string, questions: string[]): Issue {
  return {
    id,
    kind: 'yearend',
    date: '2025-12-31',
    title,
    participants: ['Mina'],
    rounds: questions.map((question) => ({ asker: 'Mina', question, answers: { Mina: { text: '답' } } })),
    source: 'solo',
  };
}

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

async function mountManager(props: Record<string, unknown> = {}): Promise<VueWrapper> {
  vi.resetModules();
  const component = await import('./QuestionSetManager.vue');
  return mount(component.default, { props: { defaultName: '내 질문 세트', ...props } });
}

/** 편집기의 n번째 입력칸 — 0은 세트 이름, 1부터는 질문 줄. */
async function setField(wrapper: VueWrapper, index: number, value: string): Promise<void> {
  await wrapper.findAll('input.field')[index].setValue(value);
}

function storedSets(): QuestionSet[] {
  return JSON.parse(localStorage.getItem(QUESTION_SETS_KEY) ?? '[]') as QuestionSet[];
}

/** 이름 + 질문들로 세트 하나를 만들어 저장한다. */
async function writeSet(wrapper: VueWrapper, name: string, questions: string[]): Promise<void> {
  await wrapper.get('.newSetBtn').trigger('click');
  await setField(wrapper, 0, name);
  for (let i = 0; i < questions.length; i += 1) {
    if (i > 0) await wrapper.get('.setEditor .linkBtn').trigger('click');
    await setField(wrapper, i + 1, questions[i]);
  }
  await wrapper.get('.setEditor').trigger('submit');
}

describe('QuestionSetManager', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: createMemoryStorage() });
  });

  it('writes a set from scratch, one question at a time', async () => {
    // Given
    const wrapper = await mountManager();

    // When
    await writeSet(wrapper, '월간 회고', ['이번 달 가장 좋았던 순간은?', '다음 달에 바라는 것은?']);

    // Then
    const stored = storedSets();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('월간 회고');
    expect(stored[0].questions).toEqual(['이번 달 가장 좋았던 순간은?', '다음 달에 바라는 것은?']);
    expect(wrapper.get('.setRow').text()).toContain('월간 회고');
  });

  it('reorders the questions in the set being written', async () => {
    // Given
    const wrapper = await mountManager();
    await writeSet(wrapper, '월간 회고', ['첫째', '둘째', '셋째']);
    await wrapper.get('.setRow').trigger('click');

    // When: 셋째를 한 칸 위로
    await wrapper.get('[aria-label="질문 3 위로"]').trigger('click');
    await wrapper.get('.setEditor').trigger('submit');

    // Then
    expect(storedSets()[0].questions).toEqual(['첫째', '셋째', '둘째']);
  });

  it('locks the move buttons at the ends of the list', async () => {
    // Given
    const wrapper = await mountManager();
    await writeSet(wrapper, '월간 회고', ['첫째', '둘째']);

    // When
    await wrapper.get('.setRow').trigger('click');

    // Then
    expect((wrapper.get('[aria-label="질문 1 위로"]').element as HTMLButtonElement).disabled).toBe(true);
    expect((wrapper.get('[aria-label="질문 2 아래로"]').element as HTMLButtonElement).disabled).toBe(true);
    expect((wrapper.get('[aria-label="질문 1 아래로"]').element as HTMLButtonElement).disabled).toBe(false);
  });

  it('opens a saved set for fixing and keeps it one set even when renamed', async () => {
    // Given
    const wrapper = await mountManager();
    await writeSet(wrapper, '월간 회고', ['이번 달 가장 좋았던 순간은?']);

    // When
    await wrapper.get('.setRow').trigger('click');
    expect((wrapper.findAll('input.field')[1].element as HTMLInputElement).value).toBe('이번 달 가장 좋았던 순간은?');
    await setField(wrapper, 0, '분기 회고');
    await wrapper.get('.setEditor').trigger('submit');

    // Then
    const stored = storedSets();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('분기 회고');
    expect(wrapper.findAll('.setRow')).toHaveLength(1);
  });

  it('drops a question row from the set being written', async () => {
    // Given
    const wrapper = await mountManager();
    await writeSet(wrapper, '월간 회고', ['질문 하나?', '질문 둘?']);
    await wrapper.get('.setRow').trigger('click');

    // When
    await wrapper.findAll('.qDrop')[0].trigger('click');
    await wrapper.get('.setEditor').trigger('submit');

    // Then
    expect(storedSets()[0].questions).toEqual(['질문 둘?']);
  });

  it('falls back to a default name when the name is left blank', async () => {
    // Given
    const wrapper = await mountManager();

    // When
    await wrapper.get('.newSetBtn').trigger('click');
    await setField(wrapper, 1, '질문?');
    await wrapper.get('.setEditor').trigger('submit');

    // Then
    expect(wrapper.get('.setRow').text()).toContain('내 질문 세트');
  });

  it('asks before dropping a saved set', async () => {
    // Given
    const wrapper = await mountManager();
    await writeSet(wrapper, '버릴 세트', ['질문?']);

    // When: 지우기를 눌러도 확인 전에는 남아 있다
    await wrapper.get('.rowDelete').trigger('click');

    // Then
    expect(wrapper.get('.confirm').text()).toContain('버릴 세트');
    expect(storedSets()).toHaveLength(1);

    // When
    await wrapper.get('.confirmYes').trigger('click');

    // Then
    expect(wrapper.find('.setRow').exists()).toBe(false);
    expect(storedSets()).toHaveLength(0);
  });

  it('picks a past question into the set instead of making the writer retype it', async () => {
    // Given
    const wrapper = await mountManager({ issues: [issue('a', '2025 연말호', ['올해 가장 오래 남은 장면은?'])] });
    await wrapper.get('.newSetBtn').trigger('click');
    await setField(wrapper, 0, '월간 회고');

    // When
    await wrapper.get('.pickOpen').trigger('click');
    await wrapper.get('.pick').trigger('click');

    // Then: 빈 줄이 그 질문으로 채워진다
    expect(wrapper.findAll('.qEditList input.field').map((input) => (input.element as HTMLInputElement).value)).toEqual([
      '올해 가장 오래 남은 장면은?',
    ]);

    await wrapper.get('.setEditor').trigger('submit');
    expect(storedSets()[0].questions).toEqual(['올해 가장 오래 남은 장면은?']);
  });

  it('starts a new set from a past issue rather than a blank form', async () => {
    // Given
    const wrapper = await mountManager({ issues: [issue('a', '2025 연말호', ['첫 질문?', '둘째 질문?'])] });

    // When
    await wrapper.get('.starter .setRow').trigger('click');

    // Then: 그 호의 질문과 제목이 채워진 채로 열린다
    const values = wrapper.findAll('input.field').map((input) => (input.element as HTMLInputElement).value);
    expect(values).toEqual(['2025 연말호', '첫 질문?', '둘째 질문?']);

    await wrapper.get('.setEditor').trigger('submit');
    expect(storedSets()[0].questions).toEqual(['첫 질문?', '둘째 질문?']);
  });

  it('keeps the set being written on screen when it cannot be stored', async () => {
    // Given
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        ...storage,
        setItem(key: string) {
          if (key === QUESTION_SETS_KEY) throw new Error('quota exceeded');
        },
      } satisfies Storage,
    });
    const wrapper = await mountManager();

    // When
    await wrapper.get('.newSetBtn').trigger('click');
    await setField(wrapper, 1, '질문?');
    await wrapper.get('.setEditor').trigger('submit');

    // Then
    expect(wrapper.get('[role="status"]').text()).toContain('저장 공간');
    expect(wrapper.find('.setEditor').exists()).toBe(true);
  });
});
