<template>
  <AppShell :variant="readingVariant">
    <template v-if="state">
      <div class="liveBar">
        <span class="eyebrow">{{ state.meta.date.slice(0, 4) }} ISSUE · {{ state.meta.code }}</span>
        <span class="eyebrow red">{{ roundLabel }}</span>
      </div>
      <div class="rule" />
      <div class="gap" />

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
        <button class="endLink" :disabled="ending" @click="onEnd">세션 종료하기</button>
      </template>
    </template>

    <p v-else class="waiting">{{ error || '불러오는 중…' }}</p>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import AppShell from '../../components/AppShell.vue';
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

const { state, error, apply } = useSession(props.code);
const me = computed(() => props.me);
const isHost = computed(() => props.isHost);
const playerToken = computed(() => props.playerToken);
const ending = ref(false);

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
  try {
    apply(await api.end(s.meta.code, props.me, props.playerToken));
  } catch {
    /* 폴링 복구 */
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
</style>
