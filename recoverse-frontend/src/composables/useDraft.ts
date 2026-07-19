import { ref, watch, type Ref } from 'vue';
import { readLocalStorageValue, writeLocalStorageValue } from '../lib/safeLocalStorage';

export interface UseDraftResult {
  /** 드래프트 값(양방향 바인딩 가능). key()가 null이면 저장/복원 없이 그냥 로컬 상태로만 동작. */
  value: Ref<string>;
  /** 제출/발행 완료 등으로 드래프트가 더 이상 필요 없을 때 명시적으로 지움 */
  clear: () => void;
  status: Ref<'idle' | 'saved' | 'error'>;
}

/**
 * 텍스트 드래프트를 localStorage에 자동 저장하고, 마운트/키 변경 시 복원하는 범용 훅.
 * key()가 null을 반환하면 비활성 상태로 동작(저장/복원 없음) — 세션 코드·라운드처럼
 * 아직 정해지지 않은 값에 의존하는 키를 대비.
 */
export function useDraft(key: () => string | null): UseDraftResult {
  const value = ref('');
  const status = ref<'idle' | 'saved' | 'error'>('idle');
  let currentKey: string | null = null;

  function restore(nextKey: string | null) {
    currentKey = nextKey;
    if (!nextKey) {
      value.value = '';
      return;
    }
    const result = readLocalStorageValue(nextKey);
    value.value = result.ok && result.value != null ? result.value : '';
    status.value = result.ok ? 'idle' : 'error';
  }

  restore(key());

  watch(key, (nextKey) => {
    if (nextKey !== currentKey) restore(nextKey);
  });

  watch(value, (next) => {
    if (!currentKey) return;
    status.value = writeLocalStorageValue(currentKey, next).ok ? 'saved' : 'error';
  });

  function clear() {
    if (!currentKey) return;
    status.value = writeLocalStorageValue(currentKey, '').ok ? 'idle' : 'error';
    value.value = '';
  }

  return { value, clear, status };
}
