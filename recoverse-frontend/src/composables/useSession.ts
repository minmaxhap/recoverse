import { onUnmounted, ref, shallowRef } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import { api, ApiError } from '../lib/api';

const POLL_MS = 2500;
const MAX_BACKOFF_MS = 10000;

/**
 * 2.5초 폴링 세션 상태.
 * - in-flight 가드: 이전 요청이 안 끝났으면 이번 틱 스킵
 * - document.hidden 이면 일시정지, 복귀 시 즉시 갱신
 * - 네트워크 에러 시 최대 10초까지 백오프, 성공하면 원복
 * - meta.phase === 'ended' 이면 폴링 중단
 */
export function useSession(code: string) {
  const state = shallowRef<SessionStateResponse | null>(null);
  const error = ref<string>('');
  const loading = ref(true);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let stopped = false;
  let backoff = POLL_MS;

  async function tick() {
    if (stopped) return;
    // 최초 로드는 숨김이어도 반드시 한 번 가져온다(백그라운드로 연 탭이 빈 화면 되지 않게).
    // 이후 자동 폴링만 숨김일 때 일시정지.
    if (inFlight || (document.hidden && state.value !== null)) {
      schedule(POLL_MS);
      return;
    }
    inFlight = true;
    try {
      const next = await api.state(code);
      state.value = next;
      error.value = '';
      loading.value = false;
      backoff = POLL_MS;
      if (next.meta.phase === 'ended') {
        // 마감 후 한 번 더 받은 상태로 멈춘다 (책장 저장 화면은 폴링 불필요)
        inFlight = false;
        return;
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        error.value = '세션을 찾지 못했어요.';
      } else {
        error.value = '연결이 불안정해요. 다시 시도하는 중…';
      }
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
    } finally {
      inFlight = false;
    }
    schedule(backoff);
  }

  function schedule(ms: number) {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(tick, ms);
  }

  function onVisible() {
    if (!document.hidden && !stopped) {
      schedule(0);
    }
  }

  function stop() {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
    document.removeEventListener('visibilitychange', onVisible);
  }

  document.addEventListener('visibilitychange', onVisible);
  tick();
  onUnmounted(stop);

  return {
    state,
    error,
    loading,
    stop,
    /** 액션 직후 서버가 돌려준 상태를 즉시 반영 (다음 폴링을 기다리지 않게) */
    apply(next: SessionStateResponse) {
      state.value = next;
      error.value = '';
      loading.value = false;
    },
    refreshNow() {
      error.value = '';
      loading.value = state.value === null;
      schedule(0);
    },
  };
}
