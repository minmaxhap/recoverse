<template>
  <div>
    <SpreadLayout :two-col="answerOrder.length >= 4">
      <template #left>
        <Headline :no="roundNo" :question="state.meta.question ?? ''" :asker="state.meta.asker ?? ''" />
        <p v-if="hasGuesses" class="myScore">
          이번 라운드 <b>{{ myCorrect }}/{{ otherCount }}</b> 적중
        </p>
      </template>
      <template #right>
        <figure
          v-for="(owner, i) in answerOrder"
          :key="owner"
          class="quote"
          :style="{ animationDelay: `${0.15 + i * 0.25}s` }"
        >
          <blockquote>{{ state.answers?.[owner]?.text }}</blockquote>
          <figcaption class="stampRow" :style="{ animationDelay: `${0.35 + i * 0.25}s` }">
            <ParticipantDot :color="colorFor(owner, state.players)" small />
            <span class="byName">{{ owner }}</span>
            <span v-if="hasGuesses" class="hit">· {{ ownerHits(owner) }}명 적중</span>
          </figcaption>
        </figure>
      </template>
    </SpreadLayout>

    <div v-if="isHost" class="stack hostActions">
      <button class="cta" :disabled="busy" @click="onNext">
        다음 헤드라인으로 ({{ nextAsker }} 차례)
      </button>
      <button class="ghost" :disabled="busy" @click="onEnd">이번 호 마감하기</button>
    </div>
    <p v-else class="waiting">발행인이 다음 페이지를 넘기길 기다리는 중…</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SessionStateResponse } from '@recoverse/shared';
import Headline from '../../components/Headline.vue';
import ParticipantDot from '../../components/ParticipantDot.vue';
import SpreadLayout from '../../components/SpreadLayout.vue';
import { colorFor } from '../../lib/palette';
import { api } from '../../lib/api';

const props = defineProps<{ state: SessionStateResponse; me: string; isHost: boolean }>();
const emit = defineEmits<{ applied: [SessionStateResponse] }>();

const busy = ref(false);
const roundNo = computed(() => props.state.meta.roundIdx + 1);
// 발표는 합류 순으로 (셔플하지 않음 — 익명이 아니므로)
const answerOrder = computed(() => props.state.players.filter((n) => props.state.answers?.[n]));
const hasGuesses = computed(() => !!props.state.guesses && Object.keys(props.state.guesses).length > 0);
const otherCount = computed(() => props.state.players.length - 1);

const myCorrect = computed(() => {
  const g = props.state.guesses?.[props.me];
  if (!g) return 0;
  return Object.entries(g).filter(([owner, guessed]) => owner === guessed).length;
});

function ownerHits(owner: string): number {
  const guesses = props.state.guesses;
  if (!guesses) return 0;
  let n = 0;
  for (const g of Object.values(guesses)) {
    if (g[owner] === owner) n++;
  }
  return n;
}

const nextAsker = computed(() => {
  const players = props.state.players;
  return players[(props.state.meta.roundIdx + 1) % players.length];
});

async function onNext() {
  if (busy.value) return;
  busy.value = true;
  try {
    emit('applied', await api.next(props.state.meta.code, props.me));
  } catch {
    /* 폴링 복구 */
  } finally {
    busy.value = false;
  }
}

async function onEnd() {
  if (busy.value) return;
  busy.value = true;
  try {
    emit('applied', await api.end(props.state.meta.code, props.me));
  } catch {
    /* 폴링 복구 */
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.quote {
  margin: 0;
  padding: 16px 2px;
  border-bottom: 1px solid var(--hairline);
  animation: rise 0.55s ease both;
}
.quote blockquote {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.75;
}
.stampRow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--dim);
  animation: stampIn 0.4s ease both;
}
.byName {
  color: var(--ink);
}
.hit {
  color: var(--vermilion);
  font-weight: 800;
}
.myScore {
  font-size: 15px;
  color: var(--dim);
  margin: 4px 0 0;
}
.myScore b {
  color: var(--vermilion);
  font-size: 18px;
}
.hostActions {
  margin-top: 26px;
}
</style>
