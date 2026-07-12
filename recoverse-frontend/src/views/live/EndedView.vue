<template>
  <div class="center completing">
    <span class="eyebrow gold pressEyebrow">이번 호 발행</span>
    <div class="stampEnd">閉</div>
    <div class="pressLine" />
    <h1 class="pageTitle centered d1">{{ state.meta.date.slice(0, 4) }} {{ kindLabel }},<br />발행 완료</h1>
    <p class="waiting d2">질문 {{ state.meta.history.length }}개 · {{ state.players.join(' · ') }}</p>

    <div v-if="readers.names.length > 0" class="mindReader d3">
      <span class="eyebrow gold">올해의 독심술사</span>
      <p class="readerName">{{ readers.names.join(' · ') }}</p>
      <p class="fineprint">{{ readers.score }}번 적중</p>
    </div>

    <button class="cta d4" :disabled="saved" @click="onSave">
      {{ saved ? '책장에 꽂혔어요' : '내 책장에 이번 호 꽂기' }}
    </button>
    <button v-if="saved" class="endLink" @click="$emit('done')">표지로 돌아가기</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { KIND_LABELS, type SessionStateResponse } from '@recoverse/shared';
import { totalScores, mindReaders } from '../../lib/guessing';
import { issueFromSession } from '../../lib/issueBuilder';
import { useShelf } from '../../composables/useShelf';

const props = defineProps<{ state: SessionStateResponse }>();
const emit = defineEmits<{ done: [] }>();

const shelf = useShelf();
const saved = ref(false);

const kindLabel = computed(() => `${KIND_LABELS[props.state.meta.kind]}호`);
const readers = computed(() => mindReaders(totalScores(props.state.pastGuesses)));

function onSave() {
  if (saved.value) return;
  shelf.add(issueFromSession(props.state));
  saved.value = true;
}
</script>

<style scoped>
.center {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding-top: 6vh;
  text-align: center;
}

/* ── 잡지 완성 시퀀스 ── */
.pressEyebrow {
  opacity: 0;
  animation: fadeUp 0.5s ease 0.05s both;
}
.stampEnd {
  font-family: var(--font-display);
  font-size: 44px;
  color: var(--vermilion);
  border: 2px solid var(--vermilion);
  border-radius: 50%;
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  /* 도장이 눌리는 연출 */
  animation: stampIn 0.55s cubic-bezier(0.34, 1.3, 0.5, 1) 0.25s both;
}
.pressLine {
  width: 120px;
  height: 2px;
  background: var(--vermilion);
  transform: scaleX(0);
  transform-origin: center;
  /* 잉크 라인이 인쇄되듯 퍼짐 */
  animation: printLine 0.5s ease 0.7s both;
}
.d1 {
  opacity: 0;
  animation: fadeUp 0.5s ease 0.95s both;
}
.d2 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.15s both;
}
.d3 {
  opacity: 0;
  animation: pressPop 0.5s cubic-bezier(0.34, 1.3, 0.5, 1) 1.4s both;
}
.d4 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.65s both;
}

@keyframes printLine {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes pressPop {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  60% {
    opacity: 1;
    transform: scale(1.04);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.mindReader {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 16px 0;
}
.readerName {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  margin: 2px 0 0;
}
</style>
