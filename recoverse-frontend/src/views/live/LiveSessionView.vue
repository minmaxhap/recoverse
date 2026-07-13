<template>
  <AppShell :variant="readingVariant">
    <template v-if="state">
      <div class="liveBar">
        <span class="eyebrow">{{ state.meta.date.slice(0, 4) }} ISSUE · {{ state.meta.code }}</span>
        <span class="eyebrow red">{{ roundLabel }}</span>
      </div>
      <div class="rule" />
      <div class="gap" />

      <div v-if="syncMessage" class="statusBanner" :class="{ danger: Boolean(error) }" role="status">
        <span>{{ syncMessage }}</span>
        <button v-if="error" type="button" class="statusRetry" @click="refreshNow">다시 확인</button>
      </div>

      <LobbyPhase
        v-if="state.meta.phase === 'lobby'"
        :state="state"
        :is-host="isHost"
        :me="me"
        :player-token="playerToken"
        @applied="apply"
      />

      <QuestionPhase
        v-else-if="state.meta.phase === 'question'"
        :state="state"
        :me="me"
        :player-token="playerToken"
        @applied="apply"
      />

      <RevealSpread
        v-else-if="showReveal"
        :state="state"
        :me="me"
        :is-host="isHost"
        :player-token="playerToken"
        @applied="apply"
      />

      <AnswerPhase
        v-else-if="state.meta.phase === 'answer'"
        :state="state"
        :me="me"
        :player-token="playerToken"
        @applied="apply"
      />

      <GuessPhase
        v-else-if="state.meta.phase === 'guess'"
        :state="state"
        :me="me"
        :is-host="isHost"
        :player-token="playerToken"
        @applied="apply"
      />

      <EndedView v-else-if="state.meta.phase === 'ended'" :state="state" @done="$emit('exit')" />

      <template v-if="isHost && state.meta.phase !== 'ended'">
        <div class="gap big" />
        <p v-if="endError" class="error" role="alert">{{ endError }}</p>
        <button class="endLink" :disabled="ending" @click="onEnd">세션 종료하기</button>
      </template>
    </template>

    <div v-else-if="error" class="centerStatus" role="status">
      <p class="waiting">{{ error }}</p>
      <button type="button" class="ghost retryBtn" @click="refreshNow">다시 확인</button>
    </div>
    <MagazineSkeleton v-else />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import AppShell from '../../components/AppShell.vue';
import MagazineSkeleton from '../../components/MagazineSkeleton.vue';
import LobbyPhase from './LobbyPhase.vue';
import QuestionPhase from './QuestionPhase.vue';
import AnswerPhase from './AnswerPhase.vue';
import GuessPhase from './GuessPhase.vue';
import RevealSpread from './RevealSpread.vue';
import EndedView from './EndedView.vue';
import { useSession } from '../../composables/useSession';
import { api } from '../../lib/api';

const props = defineProps<{ code: string; me: string; isHost: boolean; playerToken: string }>();
defineEmits<{ exit: [] }>();

const { state, error, loading, apply, refreshNow } = useSession(props.code);
const me = computed(() => props.me);
const isHost = computed(() => props.isHost);
const playerToken = computed(() => props.playerToken);
const ending = ref(false);
const endError = ref('');

const syncMessage = computed(() => {
  if (error.value) return error.value;
  if (loading.value && state.value) return '최신 세션 상태를 확인하고 있어요.';
  return '';
});

// 탭 타이틀로 "내 차례" 신호
let originalTitle = '';

const isMyTurn = computed(() => {
  const s = state.value;
  if (!s) return false;
  const phase = s.meta.phase;
  if (phase === 'question') return s.meta.asker === me.value;
  if (phase === 'answer') return !s.answered.includes(me.value);
  if (phase === 'guess') return !s.guessed.includes(me.value);
  return false;
});

function syncTitle() {
  document.title = isMyTurn.value ? '● 내 차례 — Recoverse' : originalTitle;
}

onMounted(() => {
  originalTitle = document.title;
  syncTitle();
});

watch(
  () => [state.value?.meta.phase, state.value?.meta.asker, state.value?.answered, state.value?.guessed],
  () => syncTitle(),
);

onUnmounted(() => {
  document.title = originalTitle;
});

const roundLabel = computed(() => {
  const s = state.value;
  if (!s) return '';
  if (s.meta.phase === 'ended') return 'CLOSED';
  if (s.meta.phase === 'lobby') return 'LOBBY';
  return `ROUND ${String(s.meta.roundIdx + 1).padStart(2, '0')}`;
});

// 공개 조건: (2인 && 전원 답) || 전원 추측 || (강제 공개 && 전원 답)
const showReveal = computed(() => {
  const s = state.value;
  if (!s) return false;
  if (s.meta.phase === 'answer') return s.players.length === 2 && s.allAnswered;
  if (s.meta.phase === 'guess') return s.allGuessed || (s.revealed && s.allAnswered);
  return false;
});

// 읽는 화면(공개/열람)만 데스크톱 펼침면, 나머지는 원고지
const readingVariant = computed<'read' | 'write'>(() => (showReveal.value ? 'read' : 'write'));

async function onEnd() {
  const s = state.value;
  if (!s || ending.value) return;
  if (!window.confirm('세션을 종료할까요? 진행 중이던 라운드는 공개된 경우에만 저장돼요.')) return;
  ending.value = true;
  endError.value = '';
  try {
    apply(await api.end(s.meta.code, props.me, props.playerToken));
  } catch (e) {
    if (e instanceof Error) {
      endError.value = '세션을 종료하지 못했어요. 연결을 확인하고 다시 시도해주세요.';
    } else {
      endError.value = '세션을 종료하지 못했어요. 잠시 후 다시 시도해주세요.';
    }
  } finally {
    ending.value = false;
  }
}
</script>

<style scoped>
.liveBar {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
}
.centerStatus {
  display: grid;
  justify-items: center;
  gap: 10px;
}
.retryBtn {
  max-width: 180px;
}
</style>
