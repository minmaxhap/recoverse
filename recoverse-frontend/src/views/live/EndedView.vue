<template>
  <div class="center completing">
    <span class="eyebrow gold pressEyebrow">이번 호 발행</span>
    <div class="publishScene" aria-hidden="true">
      <div class="coverStack">
        <span class="coverSheet sheetOne" />
        <span class="coverSheet sheetTwo" />
        <div class="issueCover">
          <span class="coverKicker">RECOVERSE</span>
          <strong>{{ state.meta.date.slice(0, 4) }}</strong>
          <span>{{ kindLabel }}</span>
        </div>
      </div>
      <div class="shelfRail">
        <span class="shelfSpine muted" />
        <span class="shelfSpine active" />
        <span class="shelfSpine muted narrow" />
      </div>
    </div>
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
.publishScene {
  position: relative;
  width: min(220px, 68vw);
  height: 184px;
  display: grid;
  place-items: start center;
  opacity: 0;
  animation: sceneFade 0.35s ease 0.12s both;
}
.coverStack {
  position: relative;
  z-index: 1;
  width: 128px;
  height: 150px;
  transform-origin: 50% 100%;
  animation: shelveIssue 1.08s cubic-bezier(0.2, 0.86, 0.28, 1) 0.2s both;
}
.coverSheet,
.issueCover {
  position: absolute;
  inset: 0;
  background: var(--paper-card);
  border: 1px solid var(--ink);
}
.coverSheet {
  opacity: 0;
  transform-origin: 50% 100%;
}
.sheetOne {
  animation: gatherSheetOne 0.58s ease 0.2s both;
}
.sheetTwo {
  border-color: var(--hairline);
  animation: gatherSheetTwo 0.58s ease 0.28s both;
}
.issueCover {
  display: grid;
  align-content: space-between;
  justify-items: start;
  padding: 14px 12px;
  text-align: left;
  background: linear-gradient(180deg, var(--paper-card), var(--paper));
  overflow: hidden;
}
.issueCover::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 7px;
  background: var(--vermilion);
}
.issueCover::after {
  content: '';
  position: absolute;
  right: 12px;
  bottom: 16px;
  width: 52px;
  height: 2px;
  background: var(--vermilion);
  transform: scaleX(0);
  transform-origin: left;
  animation: printLine 0.42s ease 0.6s both;
}
.coverKicker {
  margin-left: 7px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--dim);
}
.issueCover strong {
  margin-left: 7px;
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1;
}
.issueCover span:last-child {
  margin-left: 7px;
  font-size: 12px;
  font-weight: 800;
  color: var(--dim-strong);
}
.shelfRail {
  position: absolute;
  z-index: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: 42px;
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 6px;
  padding-bottom: 7px;
  border-top: 3px solid var(--ink);
  border-bottom: 1px solid var(--hairline);
  opacity: 0;
  animation: fadeUp 0.36s ease 0.42s both;
}
.shelfSpine {
  display: block;
  width: 15px;
  height: 28px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
}
.shelfSpine.active {
  width: 18px;
  height: 32px;
  background: var(--vermilion);
}
.shelfSpine.narrow {
  width: 10px;
  height: 24px;
}
.shelfSpine.muted {
  border-color: var(--hairline);
}
.pressLine {
  width: 120px;
  height: 2px;
  background: var(--vermilion);
  transform: scaleX(0);
  transform-origin: center;
  /* 잉크 라인이 인쇄되듯 퍼짐 */
  animation: printLine 0.5s ease 0.9s both;
}
.d1 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.08s both;
}
.d2 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.24s both;
}
.d3 {
  opacity: 0;
  animation: pressPop 0.5s cubic-bezier(0.34, 1.3, 0.5, 1) 1.46s both;
}
.d4 {
  opacity: 0;
  animation: fadeUp 0.5s ease 1.68s both;
}

@keyframes sceneFade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes gatherSheetOne {
  from {
    opacity: 0;
    transform: translate(-24px, 10px) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: translate(-8px, 7px) rotate(-3deg);
  }
}
@keyframes gatherSheetTwo {
  from {
    opacity: 0;
    transform: translate(22px, 12px) rotate(7deg);
  }
  to {
    opacity: 1;
    transform: translate(8px, 4px) rotate(2deg);
  }
}
@keyframes shelveIssue {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.96);
  }
  42% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  72% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateY(28px) scale(0.78);
  }
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
