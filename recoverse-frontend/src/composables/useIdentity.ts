import { reactive, readonly } from 'vue';

/**
 * 세션 신원 — 탭별(sessionStorage). 탭 3개 = 3인 로컬 테스트가 공짜로 된다.
 * 새로고침해도 유지되어 폴링만으로 상태 복구 가능.
 */
interface Identity {
  code: string;
  name: string;
  isHost: boolean;
  playerToken: string;
}

const KEY = 'recoverse_identity_v1';

function load(): Identity {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'code' in parsed &&
        'name' in parsed &&
        'isHost' in parsed &&
        'playerToken' in parsed &&
        typeof parsed.code === 'string' &&
        typeof parsed.name === 'string' &&
        typeof parsed.isHost === 'boolean' &&
        typeof parsed.playerToken === 'string'
      ) {
        return {
          code: parsed.code,
          name: parsed.name,
          isHost: parsed.isHost,
          playerToken: parsed.playerToken,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { code: '', name: '', isHost: false, playerToken: '' };
}

const state = reactive<Identity>(load());

function persist() {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        code: state.code,
        name: state.name,
        isHost: state.isHost,
        playerToken: state.playerToken,
      }),
    );
  } catch {
    /* ignore */
  }
}

export function useIdentity() {
  return {
    identity: readonly(state),
    set(code: string, name: string, isHost: boolean, playerToken: string) {
      state.code = code;
      state.name = name;
      state.isHost = isHost;
      state.playerToken = playerToken;
      persist();
    },
    clear() {
      state.code = '';
      state.name = '';
      state.isHost = false;
      state.playerToken = '';
      persist();
    },
  };
}
