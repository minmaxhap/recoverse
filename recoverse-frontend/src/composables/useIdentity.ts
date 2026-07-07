import { reactive, readonly } from 'vue';

/**
 * 세션 신원 — 탭별(sessionStorage). 탭 3개 = 3인 로컬 테스트가 공짜로 된다.
 * 새로고침해도 유지되어 폴링만으로 상태 복구 가능.
 */
interface Identity {
  code: string;
  name: string;
  isHost: boolean;
}

const KEY = 'recoverse_identity_v1';

function load(): Identity {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Identity;
  } catch {
    /* ignore */
  }
  return { code: '', name: '', isHost: false };
}

const state = reactive<Identity>(load());

function persist() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ code: state.code, name: state.name, isHost: state.isHost }));
  } catch {
    /* ignore */
  }
}

export function useIdentity() {
  return {
    identity: readonly(state),
    set(code: string, name: string, isHost: boolean) {
      state.code = code;
      state.name = name;
      state.isHost = isHost;
      persist();
    },
    clear() {
      state.code = '';
      state.name = '';
      state.isHost = false;
      persist();
    },
  };
}
