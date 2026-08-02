<template>
  <div class="roundEditor">
    <!-- 목차는 화면 아래에 있어 담긴 질문이 바로 안 보인다. 다음 할 일을 여기서 먼저 말한다. -->
    <p v-if="waitingCount > 0" class="waitingBar" role="status">
      <span>답을 기다리는 질문 {{ waitingCount }}개</span>
      <button type="button" class="waitingGo" @click="openFirstWaiting">첫 질문부터 답 쓰기 →</button>
    </p>

    <!-- 쓰는 칸이 먼저다. 목차를 위에 두면 질문을 저장할 때마다 목록이 자라 이 칸을 아래로 밀어낸다. -->
    <section class="qaBox" aria-labelledby="roundEditorTitle">
      <div class="boxHead">
        <div>
          <span class="eyebrow red">QUESTION {{ rounds.length + 1 }}</span>
          <h2 id="roundEditorTitle">다음 질문을 고르거나 직접 써요</h2>
        </div>
        <span class="draftState" aria-live="polite">{{ draftStateLabel }}</span>
      </div>

      <!-- 첫 질문 앞에서는 빈 칸만 두지 않는다 — 어디서 질문을 데려올지 세 갈래로 편다. -->
      <div v-if="blankStart" class="startRoutes">
        <span class="startLead">어디서 시작할까요?</span>
        <button type="button" class="startRoute" @click="$emit('browse-sets')">
          <b>질문 세트에서</b><small>저장한 세트나 지난 호 구성을 그대로 목차에</small>
        </button>
        <button v-if="pastIssues.length > 0" type="button" class="startRoute" @click="pastPickEl?.open()">
          <b>지난 호 질문에서</b><small>그때 그 질문에 지금의 나로 답하기</small>
        </button>
        <button type="button" class="startRoute" @click="suggestEl?.open()">
          <b>추천 질문에서</b><small>오늘 답할 만한 질문을 골라 받기</small>
        </button>
        <span class="startOr">또는 아래에 직접 써요</span>
      </div>

      <label class="fieldGroup">
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

      <!-- 질문을 얻는 두 갈래를 질문 칸 바로 밑에 나란히 — 고르면 곧장 이 칸이 채워진다. -->
      <div class="questionSources">
        <QuestionSuggest
          ref="suggestEl"
          :kind="kind"
          :exclude="pastQuestions"
          @pick="setQuestion"
          @pick-all="addQuestions"
        />
        <PastQuestionPick
          v-if="pastIssues.length > 0"
          ref="pastPickEl"
          :issues="pastIssues"
          :exclude="takenQuestions"
          @pick="setQuestion"
        />
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
      ref="contentsEl"
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
import { computed, nextTick, ref } from 'vue';
import type { Issue, Kind, Round } from '@recoverse/shared';
import ParticipantDot from './ParticipantDot.vue';
import PastQuestionPick from './PastQuestionPick.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import RoundContentsList from './RoundContentsList.vue';
import { getFormat } from '../data/formats';
import { roundIsAnswered } from '../lib/issueBuilder';
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
const emit = defineEmits<{
  'update:rounds': [Round[]];
  'update:currentRound': [SoloIssueCurrentRoundDraft];
  'browse-sets': [];
}>();

const pastQuestions = computed(() => props.rounds.map((round) => round.question));
const takenQuestions = computed(() => [...pastQuestions.value, props.currentRound.question]);

const contentsEl = ref<InstanceType<typeof RoundContentsList> | null>(null);
const questionEl = ref<HTMLInputElement | null>(null);
const suggestEl = ref<InstanceType<typeof QuestionSuggest> | null>(null);
const pastPickEl = ref<InstanceType<typeof PastQuestionPick> | null>(null);

/** 아직 아무것도 없는 첫 화면 — 빈 칸 하나만 두면 무엇부터 할지 알 수 없다. */
const blankStart = computed(
  () => props.rounds.length === 0 && props.currentRound.question.trim() === '' && !props.currentRound.formatId,
);
const waitingIndexes = computed(() =>
  props.rounds.flatMap((round, index) => (roundIsAnswered(round) ? [] : [index])),
);
const waitingCount = computed(() => waitingIndexes.value.length);

// 바깥에서 이 화면으로 들어올 때(예: 바로 쓰기에서 질문을 고른 직후) 커서를 질문 칸에 둔다.
defineExpose({ focusQuestion: () => questionEl.value?.focus() });

function openFirstWaiting(): void {
  const first = waitingIndexes.value[0];
  if (first === undefined) return;
  contentsEl.value?.openRound(first);
}

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
  if (props.currentRound.questionId) round.questionId = props.currentRound.questionId;
  if (props.currentRound.questionRevision !== undefined) round.questionRevision = props.currentRound.questionRevision;
  if (props.currentRound.pathId) round.pathId = props.currentRound.pathId;
  if (props.currentRound.pathStep !== undefined) round.pathStep = props.currentRound.pathStep;
  if (props.currentRound.review) round.review = props.currentRound.review;

  emit('update:rounds', [...props.rounds, round]);
  updateCurrentRound({ question: '', formatId: '', answers: {} });
  // 버튼이 약속한 "다음 질문" 자리로 커서를 옮긴다 — 모바일에서 키보드가 닫혔다 다시 열리지 않게.
  void nextTick(() => questionEl.value?.focus());
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

/* 담긴 질문이 화면 밖에 있어도 다음 할 일은 여기서 보인다. */
.waitingBar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
  padding: 11px 13px;
  background: var(--paper-card);
  border: 1px solid var(--vermilion);
  font-size: 13px;
  font-weight: 700;
  color: var(--dim-strong);
}

.waitingGo {
  flex: 0 0 auto;
  padding: 8px 10px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  color: var(--vermilion);
  text-decoration: underline;
  cursor: pointer;
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

.startRoutes {
  display: grid;
  gap: 8px;
  margin-bottom: 4px;
}

.startLead,
.startOr {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--dim);
}

.startOr {
  margin-top: 2px;
  font-weight: 700;
}

.startRoute {
  display: grid;
  gap: 3px;
  text-align: left;
  padding: 11px 13px;
  background: var(--paper);
  border: 1px solid var(--ink);
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.startRoute:hover {
  background: var(--ink);
  color: var(--paper);
}

.startRoute b {
  font-size: 14px;
  font-weight: 800;
}

.startRoute small {
  font-size: 12px;
  line-height: 1.5;
  color: var(--dim);
}

.startRoute:hover small {
  color: var(--on-ink-dim);
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
