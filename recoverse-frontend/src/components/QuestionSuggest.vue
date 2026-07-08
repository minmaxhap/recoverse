<template>
  <div class="suggest">
    <button v-if="!open" type="button" class="suggestOpen" @click="openPanel">
      질문이 생각 안 나요
    </button>

    <div v-else class="panel">
      <div class="panelHead">
        <span class="eyebrow">이런 질문은 어때요</span>
        <button type="button" class="close" @click="open = false" aria-label="닫기">✕</button>
      </div>

      <div class="diffChips" role="radiogroup" aria-label="질문 난이도">
        <button
          v-for="d in DIFFICULTIES"
          :key="d"
          type="button"
          role="radio"
          :aria-checked="d === difficulty"
          class="chip"
          :class="{ active: d === difficulty }"
          @click="setDifficulty(d)"
        >
          {{ DIFFICULTY_LABELS[d] }}
        </button>
      </div>

      <ul class="list">
        <li v-for="q in suggestions" :key="q">
          <button type="button" class="pick" @click="choose(q)">{{ q }}</button>
        </li>
      </ul>

      <button type="button" class="reshuffle" @click="refresh">다른 질문 보기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Kind } from '@recoverse/shared';
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  suggestQuestions,
  type Difficulty,
} from '../data/questionPacks';

const props = withDefaults(
  defineProps<{ kind: Kind; exclude?: string[] }>(),
  { exclude: () => [] },
);
const emit = defineEmits<{ pick: [string] }>();

const open = ref(false);
const difficulty = ref<Difficulty>('medium');
const suggestions = ref<string[]>([]);

function refresh() {
  suggestions.value = suggestQuestions(props.kind, difficulty.value, props.exclude, 4);
}
function openPanel() {
  open.value = true;
  refresh();
}
function setDifficulty(d: Difficulty) {
  difficulty.value = d;
  refresh();
}
function choose(q: string) {
  emit('pick', q);
  open.value = false;
}
</script>

<style scoped>
.suggestOpen {
  background: none;
  border: none;
  padding: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--vermilion);
  text-decoration: underline;
  cursor: pointer;
}
.panel {
  margin-top: 12px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  padding: 14px;
  display: grid;
  gap: 12px;
}
.panelHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.close {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--dim);
  cursor: pointer;
  padding: 0 2px;
}
.diffChips {
  display: flex;
  gap: 6px;
}
.chip {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  background: var(--paper);
  color: var(--ink);
  border: 1px solid var(--ink);
  cursor: pointer;
}
.chip.active {
  background: var(--ink);
  color: var(--paper);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
}
.pick {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-top: 1px solid var(--hairline);
  padding: 12px 2px;
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink);
  cursor: pointer;
}
.list li:first-child .pick {
  border-top: none;
}
.pick:hover {
  color: var(--vermilion);
}
.reshuffle {
  justify-self: start;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--dim);
  text-decoration: underline;
  cursor: pointer;
}
</style>
