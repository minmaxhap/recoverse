<template>
  <div class="boxHead">
    <div>
      <span class="eyebrow red">{{ presentation === 'quick' ? 'QUICK NOTE' : `QUESTION ${questionNumber}` }}</span>
      <h2 v-if="presentation === 'quick'" id="roundEditorTitle" class="quickQuestion">
        {{ currentRound.question }}
      </h2>
      <!-- 첫 질문 앞에서 "다음 질문"이라고 하면 있지도 않은 앞 질문을 가리킨다. -->
      <h2 v-else id="roundEditorTitle">
        {{ questionNumber === 1 ? '첫 질문을 고르거나 직접 써요' : '다음 질문을 고르거나 직접 써요' }}
      </h2>
    </div>
    <span class="draftState" aria-live="polite">{{ draftStateLabel }}</span>
  </div>

  <label v-if="presentation === 'standard'" class="fieldGroup">
    <span class="fieldLabel">질문</span>
    <input
      ref="questionEl"
      class="field"
      :value="currentRound.question"
      :readonly="!!currentRound.formatId"
      placeholder="지금의 나에게 묻고 싶은 것"
      @input="setQuestion"
    />
  </label>

  <div v-if="presentation === 'standard'" class="formatChips" role="radiogroup" aria-label="회고 포맷">
    <button
      type="button"
      role="radio"
      :aria-checked="currentRound.formatId === ''"
      class="fchip"
      :class="{ active: currentRound.formatId === '' }"
      @click="selectFormat('')"
    >
      자유 질문
    </button>
    <button
      v-for="format in FORMATS"
      :key="format.id"
      type="button"
      role="radio"
      :aria-checked="currentRound.formatId === format.id"
      class="fchip"
      :class="{ active: currentRound.formatId === format.id }"
      @click="selectFormat(format.id)"
    >
      {{ format.label }}
    </button>
  </div>

  <div v-if="presentation === 'standard'" class="questionSources">
    <button
      v-if="!sourcesOpen"
      type="button"
      class="sourcesToggle"
      :aria-expanded="false"
      @click="sourcesOpen = true"
    >질문 고르기</button>

    <div v-else class="sourceList">
      <button type="button" class="sourceRoute" @click="openSuggest">추천 질문</button>
      <button type="button" class="sourceRoute" @click="emit('browse-sets')">저장한 질문 세트</button>
      <button v-if="pastIssues.length > 0" type="button" class="sourceRoute" @click="openPastPick">
        지난 호 질문
      </button>
      <button type="button" class="sourceRoute close" @click="sourcesOpen = false">닫기</button>
    </div>

    <QuestionSuggest
      ref="suggestEl"
      :kind="kind"
      :exclude="[...pastQuestions]"
      hide-trigger
      @pick="setQuestion"
      @pick-all="emit('add-questions', $event)"
    />
    <PastQuestionPick
      v-if="pastIssues.length > 0"
      ref="pastPickEl"
      :issues="pastIssues"
      :exclude="takenQuestions"
      hide-trigger
      @pick="setQuestion"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Issue, Kind } from '@recoverse/shared';
import { FORMATS, getFormat } from '../data/formats';
import type { SoloIssueCurrentRoundDraft } from '../lib/soloIssueDraftTypes';
import PastQuestionPick from './PastQuestionPick.vue';
import QuestionSuggest from './QuestionSuggest.vue';

const props = defineProps<{
  readonly presentation: 'standard' | 'quick';
  readonly questionNumber: number;
  readonly currentRound: SoloIssueCurrentRoundDraft;
  readonly kind: Kind;
  readonly pastIssues: readonly Issue[];
  readonly pastQuestions: readonly string[];
  readonly draftStateLabel: string;
}>();
const emit = defineEmits<{
  'update:currentRound': [SoloIssueCurrentRoundDraft];
  'add-questions': [string[]];
  'browse-sets': [];
}>();

const questionEl = ref<HTMLInputElement | null>(null);
const suggestEl = ref<InstanceType<typeof QuestionSuggest> | null>(null);
const pastPickEl = ref<InstanceType<typeof PastQuestionPick> | null>(null);
const sourcesOpen = ref(false);
const takenQuestions = computed(() => [...props.pastQuestions, props.currentRound.question]);

function setQuestion(value: string | Event): void {
  const question = typeof value === 'string'
    ? value
    : value.target instanceof HTMLInputElement
      ? value.target.value
      : '';
  emit('update:currentRound', { ...props.currentRound, question });
}

function selectFormat(id: string): void {
  const format = getFormat(id);
  emit('update:currentRound', {
    ...props.currentRound,
    formatId: id,
    question: format ? format.prompt : props.currentRound.question,
  });
}

function openSuggest(): void {
  sourcesOpen.value = false;
  suggestEl.value?.open();
}

function openPastPick(): void {
  sourcesOpen.value = false;
  pastPickEl.value?.open();
}

defineExpose({ focusQuestion: () => questionEl.value?.focus() });
</script>

<style scoped>
.boxHead { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.boxHead > div { min-width: 0; }
.boxHead h2 {
  margin: 3px 0 0;
  font-family: var(--font-display);
  font-size: 19px;
  line-height: 1.4;
}
.draftState {
  justify-self: start;
  padding: 4px 6px;
  border: 1px solid var(--hairline);
  color: var(--dim);
  font-size: 11px;
  font-weight: 800;
}
.questionSources { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 4px 18px; }
.sourcesToggle {
  min-height: 44px;
  padding: 8px 0;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--vermilion);
  text-decoration: underline;
  cursor: pointer;
}
.sourceList { flex: 1 0 100%; display: grid; border-top: 1px solid var(--hairline); }
.sourceRoute {
  min-height: 44px;
  padding: 11px 2px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--hairline);
  color: inherit;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.12s ease;
}
.sourceRoute:hover { color: var(--vermilion); }
.sourceRoute.close { color: var(--dim); font-size: 13px; }
.questionSources > :deep(.open) { flex: 1 0 100%; }
.formatChips { display: flex; flex-wrap: wrap; gap: 6px; }
.fchip {
  padding: 6px 11px;
  font-size: 12px;
  font-weight: 700;
  background: var(--paper);
  color: var(--ink);
  border: 1px solid var(--ink);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, transform 0.1s ease;
}
.fchip:hover, .fchip.active { background: var(--ink); color: var(--paper); }
.fchip:active { transform: translate(1px, 1px); }
@media (min-width: 520px) {
  .boxHead { grid-template-columns: minmax(0, 1fr) auto; align-items: start; }
  .draftState { justify-self: end; }
}
</style>
