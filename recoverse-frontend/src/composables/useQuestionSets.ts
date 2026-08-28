import { ref } from 'vue';
import { readLocalStorageValue, writeLocalStorageValue } from '../lib/safeLocalStorage';

export const QUESTION_SETS_KEY = 'recoverse_question_sets_v1';

/**
 * 발행 직후 "내년에도 물어볼까요?"에 담긴 질문이 모이는 세트.
 * 알림도 계정도 서버도 없이 다시 물을 질문을 기억하는 유일한 자리라, 이름으로 찾는다 —
 * 사람이 세트 정리 화면에서 이름을 바꾸면 그 세트는 평범한 세트가 되고 새 세트가 생긴다.
 */
export const ASK_AGAIN_SET_NAME = '다시 물을 질문';

/** 이름 붙여 저장해둔 질문 묶음 — 다음 호를 같은 구성으로 열 때 그대로 불러온다. */
export interface QuestionSet {
  readonly id: string;
  readonly name: string;
  readonly questions: readonly string[];
  readonly updatedAt: string;
}

const sets = ref<QuestionSet[]>([]);
let loaded = false;

function parseSets(raw: unknown): QuestionSet[] {
  if (!Array.isArray(raw)) return [];
  const parsed: QuestionSet[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, name, questions, updatedAt } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string' || !Array.isArray(questions)) continue;
    const cleaned = questions.filter((question): question is string => typeof question === 'string' && !!question.trim());
    if (cleaned.length === 0) continue;
    parsed.push({
      id,
      name,
      questions: cleaned,
      updatedAt: typeof updatedAt === 'string' ? updatedAt : '',
    });
  }
  return parsed;
}

function sortByRecent(list: readonly QuestionSet[]): QuestionSet[] {
  return [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

function load(): void {
  const result = readLocalStorageValue(QUESTION_SETS_KEY);
  if (!result.ok || !result.value) {
    loaded = true;
    return;
  }
  try {
    sets.value = sortByRecent(parseSets(JSON.parse(result.value)));
  } catch {
    sets.value = [];
  }
  loaded = true;
}

/**
 * id를 주면 그 세트를 고친다(이름을 바꿔도 같은 세트). id가 없으면 같은 이름을 덮어쓴다 —
 * 매달 같은 세트를 다듬어 쓰는 흐름에서 "월간 회고 (2)" 같은 사본이 쌓이지 않게.
 */
function saveSet(name: string, questions: readonly string[], id?: string): boolean {
  const trimmedName = name.trim();
  const cleaned = [...new Set(questions.map((question) => question.trim()).filter(Boolean))];
  if (!trimmedName || cleaned.length === 0) return false;

  const existing = id ? sets.value.find((set) => set.id === id) : sets.value.find((set) => set.name === trimmedName);
  const saved: QuestionSet = {
    id: existing?.id ?? `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    questions: cleaned,
    updatedAt: new Date().toISOString(),
  };
  return commit([saved, ...sets.value.filter((set) => set.id !== saved.id)]);
}

function commit(next: readonly QuestionSet[]): boolean {
  const sorted = sortByRecent(next);
  if (!writeLocalStorageValue(QUESTION_SETS_KEY, JSON.stringify(sorted)).ok) return false;
  sets.value = sorted;
  return true;
}

export function useQuestionSets() {
  if (!loaded) load();

  return {
    sets,
    save: saveSet,
    /**
     * 다시 물을 질문에 더한다. 덮어쓰지 않고 이어 붙이는 이유는, 이 세트가 여러 호에 걸쳐
     * 쌓이는 약속이기 때문이다 — 이번 호에서 고른 둘이 지난 호에서 고른 셋을 지우면 안 된다.
     * 새로 고른 것을 앞에 둔다: 방금 마음먹은 질문을 다음에 쓸 때 먼저 만난다.
     */
    keepForNextTime(questions: readonly string[]): boolean {
      const existing = sets.value.find((set) => set.name === ASK_AGAIN_SET_NAME);
      return saveSet(ASK_AGAIN_SET_NAME, [...questions, ...(existing?.questions ?? [])], existing?.id);
    },
    remove(id: string): boolean {
      return commit(sets.value.filter((set) => set.id !== id));
    },
  };
}
