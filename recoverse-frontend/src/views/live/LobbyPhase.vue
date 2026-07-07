<template>
  <div>
    <div class="codeBox">
      <span class="eyebrow">INVITE CODE</span>
      <span class="bigCode">{{ state.meta.code }}</span>
      <span class="fineprint">친구들에게 이 코드를 알려주세요</span>
    </div>

    <div class="sectionHead">
      <h2>합류한 사람</h2>
      <span class="count">{{ state.players.length }}명</span>
    </div>
    <div class="stack">
      <div v-for="name in state.players" :key="name" class="playerRow">
        <ParticipantDot :color="colorFor(name, state.players)" />
        <span>{{ name }}</span>
        <span v-if="state.meta.host === name" class="hostTag">발행인</span>
      </div>
    </div>

    <div class="gap" />
    <button v-if="isHost" class="cta" :disabled="state.players.length < 2 || busy" @click="onStart">
      {{ state.players.length < 2 ? '2명 이상 모이면 시작할 수 있어요' : '이번 호 시작하기' }}
    </button>
    <p v-else class="waiting">발행인이 시작하길 기다리는 중…</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import ParticipantDot from '../../components/ParticipantDot.vue';
import { colorFor } from '../../lib/palette';
import { api } from '../../lib/api';

const props = defineProps<{ state: SessionStateResponse; isHost: boolean; me: string }>();
const emit = defineEmits<{ applied: [SessionStateResponse] }>();

const busy = ref(false);

async function onStart() {
  if (busy.value) return;
  busy.value = true;
  try {
    const next = await api.start(props.state.meta.code, props.me);
    emit('applied', next);
  } catch {
    /* 폴링이 곧 상태를 복구 */
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.codeBox {
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
  border: 1px solid var(--ink);
  padding: 22px;
  margin: 12px 0 26px;
  background: var(--paper-card);
}
.bigCode {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 0.3em;
  margin-left: 0.3em;
}
.sectionHead {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.sectionHead h2 {
  font-size: 15px;
  font-weight: 800;
  margin: 0;
}
.count {
  font-size: 12px;
  color: var(--dim);
}
.playerRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--hairline);
  font-size: 16px;
  font-weight: 600;
}
.hostTag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--vermilion);
  margin-left: auto;
}
</style>
