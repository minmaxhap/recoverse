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
          <span class="eyebrow red">{{ presentation === 'quick' ? 'QUICK NOTE' : `QUESTION ${rounds.length + 1}` }}</span>
          <h2 v-if="presentation === 'quick'" id="roundEditorTitle" class="quickQuestion">
            {{ currentRound.question }}
          </h2>
          <h2 v-else id="roundEditorTitle">다음 질문을 고르거나 직접 써요</h2>
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

      <!--
        질문을 어디서 데려올지는 결정 하나다. 빈 화면에서 시작 카드와 링크가 같은 곳을
        두 번씩 가리켜 문이 여섯 개로 보였다 — 한 버튼 뒤에 세 갈래로 접어 둔다.
      -->
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
          <button type="button" class="sourceRoute" @click="$emit('browse-sets')">저장한 질문 세트</button>
          <button v-if="pastIssues.length > 0" type="button" class="sourceRoute" @click="openPastPick">
            지난 호 질문
          </button>
          <button type="button" class="sourceRoute close" @click="sourcesOpen = false">닫기</button>
        </div>

        <QuestionSuggest
          ref="suggestEl"
          :kind="kind"
          :exclude="pastQuestions"
          hide-trigger
          @pick="setQuestion"
          @pick-all="addQuestions"
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

      <div v-for="(name, i) in participants" :key="name" class="answerLine">
        <ParticipantDot :color="colorAt(i)" />
        <label class="fieldGroup answerField">
          <span class="fieldLabel">{{ name }}의 답</span>
          <textarea
            :ref="(el) => setAnswerEl(i, el)"
            class="field area short"
            :value="currentRound.answers[name] ?? ''"
            :placeholder="answerHint(name)"
            @input="setAnswer(name, $event)"
          />
        </label>
      </div>

      <button class="ghost" :disabled="!qaReady" @click="addRound">{{ saveLabel }}</button>
    </section>

    <!-- 발행은 쓰는 자리 바로 아래. 목차 뒤에 두면 답을 저장해 발행이 열린 순간이 화면 밖이다. -->
    <slot name="publish" />

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
import { FORMATS, getFormat } from '../data/formats';
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
    /** 답을 저장하는 버튼 문구 — 한 질문만 쓰는 흐름은 "다음 질문"을 약속하지 않는다. */
    saveLabel?: string;
    /** 같은 초고 상태를 표준 편집기 또는 답 하나에 집중한 Quick 화면으로 보여준다. */
    presentation?: 'standard' | 'quick';
  }>(),
  {
    kind: 'free',
    draftStateLabel: '새 질문',
    pastIssues: () => [],
    saveLabel: '답 저장하고 다음 질문',
    presentation: 'standard',
  },
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
const answerEls = ref<(HTMLTextAreaElement | null)[]>([]);
const suggestEl = ref<InstanceType<typeof QuestionSuggest> | null>(null);
const pastPickEl = ref<InstanceType<typeof PastQuestionPick> | null>(null);

function setAnswerEl(index: number, el: unknown): void {
  answerEls.value[index] = el instanceof HTMLTextAreaElement ? el : null;
}

// 질문 출처 목록은 고르는 동안만 편다 — 고른 뒤에는 쓰는 칸이 화면을 되찾는다.
const sourcesOpen = ref(false);

function openSuggest(): void {
  sourcesOpen.value = false;
  suggestEl.value?.open();
}

function openPastPick(): void {
  sourcesOpen.value = false;
  pastPickEl.value?.open();
}

const waitingIndexes = computed(() =>
  props.rounds.flatMap((round, index) => (roundIsAnswered(round) ? [] : [index])),
);
const waitingCount = computed(() => waitingIndexes.value.length);

// 바깥에서 이 화면으로 들어올 때 커서를 데려온다. 질문을 이미 받아 온 흐름(바로 쓰기)은
// 답 칸으로 — 남은 일이 답 쓰기뿐인데 질문 칸에 커서를 두면 받은 질문을 지우기 쉽다.
defineExpose({
  focusQuestion: () => questionEl.value?.focus(),
  focusAnswer: () => answerEls.value[0]?.focus(),
});

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

/* 닫혀 있을 땐 버튼 하나가 한 줄에, 펼쳐지면 그 패널이 한 줄을 다 쓴다. */
.questionSources {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 4px 18px;
}

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

.sourceList {
  flex: 1 0 100%;
  display: grid;
  border-top: 1px solid var(--hairline);
}

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

.sourceRoute:hover {
  color: var(--vermilion);
}

.sourceRoute.close {
  color: var(--dim);
  font-size: 13px;
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
