<template>
  <section v-if="rounds.length > 0" class="contentsBlock" aria-labelledby="contentsTitle">
    <div class="contentsHead">
      <span class="eyebrow">CONTENTS</span>
      <strong id="contentsTitle">{{ rounds.length }}개 질문을 실었어요</strong>
    </div>
    <ol class="contentsList">
      <li v-for="(round, i) in rounds" :key="`${round.question}-${i}`">
        <span class="pageNo">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="contentText">
          <b>{{ round.question }}</b>
          <small>{{ answerPreview(round) }}</small>
        </span>
        <span v-if="editable" class="contentsActions">
          <button type="button" :disabled="i === 0" aria-label="질문을 위로" @click="$emit('move', i, -1)"><ArrowUp :size="14" /></button>
          <button type="button" :disabled="i === rounds.length - 1" aria-label="질문을 아래로" @click="$emit('move', i, 1)"><ArrowDown :size="14" /></button>
          <button type="button" aria-label="질문 삭제" @click="$emit('remove', i)"><Trash2 :size="14" /></button>
        </span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-vue-next';
import type { Round } from '@recoverse/shared';

const props = defineProps<{
  rounds: Round[];
  participants: string[];
  editable?: boolean;
}>();
defineEmits<{ move: [number, -1 | 1]; remove: [number] }>();

function answerPreview(round: Round): string {
  const first = props.participants[0] ?? Object.keys(round.answers)[0];
  const text = first ? round.answers[first]?.text.trim() : '';
  if (!text) return '답이 실렸어요.';
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}
</script>

<style scoped>
.contentsBlock {
  display: grid;
  gap: 10px;
  padding: 14px 0 0;
  border-top: 3px solid var(--ink);
}

.contentsHead {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.contentsHead strong {
  font-size: 13px;
  color: var(--dim-strong);
  min-width: 0;
  overflow-wrap: anywhere;
}

.contentsList {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--hairline);
}

.contentsList li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--hairline);
}
.contentsActions { display: flex; align-items: start; gap: 3px; }
.contentsActions button { display: grid; place-items: center; width: 25px; height: 25px; padding: 0; border: 1px solid var(--hairline); background: var(--paper-card); color: var(--dim-strong); cursor: pointer; }
.contentsActions button:hover:not(:disabled) { color: var(--vermilion); border-color: var(--vermilion); }
.contentsActions button:disabled { opacity: .35; cursor: default; }

.pageNo {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--hairline);
}

.contentText {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.contentText b {
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.contentText small {
  color: var(--dim);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (min-width: 520px) {
  .contentsHead {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: baseline;
  }

  .contentsHead strong {
    text-align: right;
  }
}
</style>
