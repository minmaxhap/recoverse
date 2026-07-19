<template>
  <div class="roundEditor">
    <RoundContentsList :rounds="rounds" :participants="participants" editable @move="moveRound" @remove="removeRound" />

    <section class="qaBox" aria-labelledby="roundEditorTitle">
      <div class="boxHead">
        <div>
          <span class="eyebrow red">QUESTION {{ rounds.length + 1 }}</span>
          <h2 id="roundEditorTitle">다음 질문을 고르거나 직접 써요</h2>
        </div>
        <span class="draftState" aria-live="polite">{{ draftState }}</span>
      </div>

      <label class="fieldGroup">
        <span class="fieldLabel">질문</span>
        <input
          class="field"
          :value="q"
          :readonly="!!formatId"
          placeholder="지금의 나에게 묻고 싶은 것"
          @input="q = ($event.target as HTMLInputElement).value"
        />
      </label>

      <QuestionSuggest :kind="kind" :exclude="pastQuestions" @pick="q = $event" />

      <div v-for="(name, i) in participants" :key="name" class="answerLine">
        <ParticipantDot :color="colorAt(i)" />
        <label class="fieldGroup answerField">
          <span class="fieldLabel">{{ name }}의 답</span>
          <textarea
            class="field area short"
            :value="answers[name] ?? ''"
            :placeholder="answerHint(name)"
            @input="setAnswer(name, ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
      </div>

      <p class="helper">{{ roundHelp }}</p>
      <button class="ghost" :disabled="!qaReady" @click="addRound">목차에 싣기</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Kind, Round } from '@recoverse/shared';
import ParticipantDot from './ParticipantDot.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import RoundContentsList from './RoundContentsList.vue';
import { getFormat } from '../data/formats';
import { useDraft } from '../composables/useDraft';
import { colorAt } from '../lib/palette';

const props = withDefaults(
  defineProps<{ participants: string[]; rounds: Round[]; kind?: Kind }>(),
  { kind: 'free' },
);
const emit = defineEmits<{ 'update:rounds': [Round[]] }>();

const q = ref('');
const formatId = ref('');
const answers = ref<Record<string, string>>({});
const pastQuestions = computed(() => props.rounds.map((round) => round.question));
const hasDraftText = computed(
  () => q.value.trim().length > 0 || Object.values(answers.value).some((answer) => answer.trim().length > 0),
);
const { value: draftJson, clear: clearDraft, status: draftSaveStatus } = useDraft(
  () => `recoverse_draft_round_${props.kind}_${props.rounds.length}`,
);
const draftState = computed(() => {
  if (draftSaveStatus.value === 'error') return '저장하지 못했어요';
  if (draftSaveStatus.value === 'saved') return '자동 저장됨';
  return hasDraftText.value ? '저장 준비 중' : '새 질문';
});
let applyingDraft = false;

function applyDraft(json: string): void {
  applyingDraft = true;
  try {
    const parsed: unknown = json ? JSON.parse(json) : {};
    if (parsed && typeof parsed === 'object') {
      const draft = parsed as { q?: unknown; formatId?: unknown; answers?: unknown };
      q.value = typeof draft.q === 'string' ? draft.q : '';
      formatId.value = typeof draft.formatId === 'string' ? draft.formatId : '';
      answers.value = draft.answers && typeof draft.answers === 'object' ? (draft.answers as Record<string, string>) : {};
      return;
    }
    q.value = '';
    formatId.value = '';
    answers.value = {};
  } catch {
    q.value = '';
    formatId.value = '';
    answers.value = {};
  } finally {
    applyingDraft = false;
  }
}

watch(draftJson, (json) => applyDraft(json), { immediate: true });

watch(
  [q, formatId, answers],
  () => {
    if (applyingDraft) return;
    draftJson.value = JSON.stringify({ q: q.value, formatId: formatId.value, answers: answers.value });
  },
  { deep: true },
);

const qaReady = computed(
  () =>
    q.value.trim().length > 0 &&
    props.participants.length > 0 &&
    props.participants.every((name) => (answers.value[name] ?? '').trim().length > 0),
);
const roundHelp = computed(() => {
  if (props.participants.length === 0) return '이 호에 실릴 이름을 먼저 적어주세요.';
  if (!q.value.trim()) return '질문을 고르거나 직접 쓰면 답을 실을 수 있어요.';
  if (!qaReady.value) return '답을 적으면 이 질문을 목차에 실을 수 있어요.';
  return '좋아요. 이 질문을 목차에 실어두고 다음 질문으로 넘어갈 수 있어요.';
});

function selectFormat(id: string): void {
  formatId.value = id;
  const format = getFormat(id);
  if (format) q.value = format.prompt;
}

function answerHint(name: string): string {
  const format = getFormat(formatId.value);
  return format ? format.hint : `${name}의 답을 거칠게 적어도 괜찮아요`;
}

function setAnswer(name: string, value: string): void {
  answers.value = { ...answers.value, [name]: value };
}

function addRound(): void {
  if (!qaReady.value) return;

  const roundAnswers: Round['answers'] = {};
  for (const name of props.participants) {
    roundAnswers[name] = { text: (answers.value[name] ?? '').trim() };
  }
  const asker = props.participants[props.rounds.length % props.participants.length];
  const round: Round = { asker, question: q.value.trim(), answers: roundAnswers };
  if (formatId.value) round.format = formatId.value;

  emit('update:rounds', [...props.rounds, round]);
  clearDraft();
  applyingDraft = true;
  q.value = '';
  formatId.value = '';
  answers.value = {};
  applyingDraft = false;
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
