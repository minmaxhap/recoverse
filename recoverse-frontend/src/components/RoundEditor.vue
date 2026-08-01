<template>
  <div class="roundEditor">
    <!-- 쓰는 칸이 먼저다. 목차를 위에 두면 질문을 저장할 때마다 목록이 자라 이 칸을 아래로 밀어낸다. -->
    <section class="qaBox" aria-labelledby="roundEditorTitle">
      <div class="boxHead">
        <div>
          <span class="eyebrow red">QUESTION {{ rounds.length + 1 }}</span>
          <h2 id="roundEditorTitle">다음 질문을 고르거나 직접 써요</h2>
        </div>
        <span class="draftState" aria-live="polite">{{ draftStateLabel }}</span>
      </div>

      <label class="fieldGroup">
        <span class="fieldLabel">질문</span>
        <input
          class="field"
          :value="currentRound.question"
          :readonly="!!currentRound.formatId"
          placeholder="지금의 나에게 묻고 싶은 것"
          @input="setQuestion"
        />
      </label>

      <!-- 질문을 얻는 두 갈래를 질문 칸 바로 밑에 나란히 — 고르면 곧장 이 칸이 채워진다. -->
      <div class="questionSources">
        <QuestionSuggest :kind="kind" :exclude="pastQuestions" @pick="setQuestion" @pick-all="addQuestions" />
        <PastQuestionPick v-if="pastIssues.length > 0" :issues="pastIssues" :exclude="takenQuestions" @pick="setQuestion" />
      </div>

      <div v-for="(name, i) in participants" :key="name" class="answerLine">
        <ParticipantDot :color="colorAt(i)" />
        <label class="fieldGroup answerField">
          <span class="fieldLabel">{{ name }}의 답</span>
          <textarea
            class="field area short"
            :value="currentRound.answers[name] ?? ''"
            :placeholder="answerHint(name)"
            @input="setAnswer(name, $event)"
          />
        </label>
      </div>

      <button class="ghost" :disabled="!qaReady" @click="addRound">답 저장하고 다음 질문</button>
    </section>

    <RoundContentsList
      :rounds="rounds"
      :participants="participants"
      editable
      @edit="editRound"
      @move="moveRound"
      @remove="removeRound"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Issue, Kind, Round } from '@recoverse/shared';
import ParticipantDot from './ParticipantDot.vue';
import PastQuestionPick from './PastQuestionPick.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import RoundContentsList from './RoundContentsList.vue';
import { getFormat } from '../data/formats';
import { colorAt } from '../lib/palette';
import type { SoloIssueCurrentRoundDraft } from '../lib/soloIssueDraftTypes';

const props = withDefaults(
  defineProps<{
    participants: string[];
    rounds: Round[];
    currentRound: SoloIssueCurrentRoundDraft;
    kind?: Kind;
    draftStateLabel?: string;
    /** 책장의 지난 호 — 있으면 질문 칸 밑에서 한 질문만 골라 다시 쓸 수 있다. */
    pastIssues?: readonly Issue[];
  }>(),
  { kind: 'free', draftStateLabel: '새 질문', pastIssues: () => [] },
);
const emit = defineEmits<{ 'update:rounds': [Round[]]; 'update:currentRound': [SoloIssueCurrentRoundDraft] }>();

const pastQuestions = computed(() => props.rounds.map((round) => round.question));
const takenQuestions = computed(() => [...pastQuestions.value, props.currentRound.question]);

const qaReady = computed(
  () =>
    props.currentRound.question.trim().length > 0 &&
    props.participants.length > 0 &&
    props.participants.every((name) => (props.currentRound.answers[name] ?? '').trim().length > 0),
);
function eventValue(event: Event): string {
  return event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
    ? event.target.value
    : '';
}

function updateCurrentRound(next: SoloIssueCurrentRoundDraft): void {
  emit('update:currentRound', next);
}

function setQuestion(value: string | Event): void {
  updateCurrentRound({
    ...props.currentRound,
    question: typeof value === 'string' ? value : eventValue(value),
  });
}

function selectFormat(id: string): void {
  const format = getFormat(id);
  updateCurrentRound({
    ...props.currentRound,
    formatId: id,
    question: format ? format.prompt : props.currentRound.question,
  });
}

function answerHint(name: string): string {
  const format = getFormat(props.currentRound.formatId);
  return format ? format.hint : `${name}의 답을 거칠게 적어도 괜찮아요`;
}

function setAnswer(name: string, event: Event): void {
  updateCurrentRound({
    ...props.currentRound,
    answers: { ...props.currentRound.answers, [name]: eventValue(event) },
  });
}

/** 팩 질문을 "답 대기" 라운드로 목차에 한 번에 담는다. 이미 실린 질문은 건너뛴다. */
function addQuestions(questions: string[]): void {
  if (props.participants.length === 0) return;
  const existing = new Set(pastQuestions.value.map((question) => question.trim()));
  const additions: Round[] = [];
  for (const raw of questions) {
    const question = raw.trim();
    if (!question || existing.has(question)) continue;
    existing.add(question);
    const asker = props.participants[(props.rounds.length + additions.length) % props.participants.length];
    additions.push({ asker, question, answers: {} });
  }
  if (additions.length > 0) emit('update:rounds', [...props.rounds, ...additions]);
}

function addRound(): void {
  if (!qaReady.value) return;

  const roundAnswers: Round['answers'] = {};
  for (const name of props.participants) {
    roundAnswers[name] = { text: (props.currentRound.answers[name] ?? '').trim() };
  }
  const asker = props.participants[props.rounds.length % props.participants.length];
  const round: Round = { asker, question: props.currentRound.question.trim(), answers: roundAnswers };
  if (props.currentRound.formatId) round.format = props.currentRound.formatId;

  emit('update:rounds', [...props.rounds, round]);
  updateCurrentRound({ question: '', formatId: '', answers: {} });
}

function moveRound(index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (target < 0 || target >= props.rounds.length) return;
  const next = [...props.rounds];
  const current = next[index];
  const swapped = next[target];
  if (!current || !swapped) return;
  next[index] = swapped;
  next[target] = current;
  emit('update:rounds', next);
}

function editRound(index: number, round: Round): void {
  const next = [...props.rounds];
  if (!next[index]) return;
  next[index] = round;
  emit('update:rounds', next);
}

function removeRound(index: number): void {
  emit('update:rounds', props.rounds.filter((_, itemIndex) => itemIndex !== index));
}
</script>

<style scoped>
.roundEditor {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.qaBox {
  border: 1px solid var(--ink);
  padding: 16px;
  display: grid;
  gap: 12px;
  background: var(--paper-card);
}

.boxHead {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.boxHead > div {
  min-width: 0;
}

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

/* 닫혀 있을 땐 링크 두 개가 한 줄에, 펼쳐지면 그 패널이 한 줄을 다 쓴다. */
.questionSources {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 4px 18px;
}

.questionSources > :deep(.open) {
  flex: 1 0 100%;
}

.formatChips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

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

.fchip:hover,
.fchip.active {
  background: var(--ink);
  color: var(--paper);
}

.fchip:active {
  transform: translate(1px, 1px);
}

.answerLine {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: flex-start;
}

.answerLine > :deep(.dot) {
  margin-top: 34px;
}

.answerField {
  min-width: 0;
}

@media (min-width: 520px) {
  .boxHead {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .draftState {
    justify-self: end;
  }
}
</style>
