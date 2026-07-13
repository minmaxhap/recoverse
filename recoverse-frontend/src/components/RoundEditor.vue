<template>
  <div class="roundEditor">
    <div v-if="rounds.length > 0" class="pastQ">
      <div v-for="(r, i) in rounds" :key="i">✓ {{ i + 1 }}. {{ r.question }}</div>
    </div>

    <div class="qaBox">
      <span class="eyebrow red">질문 {{ rounds.length + 1 }}</span>

      <div class="formatChips" role="radiogroup" aria-label="회고 포맷">
        <button
          type="button"
          role="radio"
          :aria-checked="formatId === ''"
          class="fchip"
          :class="{ active: formatId === '' }"
          @click="selectFormat('')"
        >
          자유 질문
        </button>
        <button
          v-for="f in FORMATS"
          :key="f.id"
          type="button"
          role="radio"
          :aria-checked="formatId === f.id"
          class="fchip"
          :class="{ active: formatId === f.id }"
          @click="selectFormat(f.id)"
        >
          {{ f.label }}
        </button>
      </div>

      <input
        class="field"
        :value="q"
        :readonly="!!formatId"
        placeholder="질문"
        @input="q = ($event.target as HTMLInputElement).value"
      />
      <QuestionSuggest v-if="!formatId" :kind="kind" :exclude="pastQuestions" @pick="q = $event" />
      <div v-for="(name, i) in participants" :key="name" class="answerLine">
        <ParticipantDot :color="colorAt(i)" />
        <textarea
          class="field area short"
          :value="answers[name] ?? ''"
          :placeholder="answerHint(name)"
          @input="setAnswer(name, ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
      <button class="ghost" :disabled="!qaReady" @click="addRound">이 질문 추가</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Kind, Round } from '@recoverse/shared';
import ParticipantDot from './ParticipantDot.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import { colorAt } from '../lib/palette';
import { FORMATS, getFormat } from '../data/formats';
import { useDraft } from '../composables/useDraft';

const props = withDefaults(
  defineProps<{ participants: string[]; rounds: Round[]; kind?: Kind }>(),
  { kind: 'free' },
);
const emit = defineEmits<{ 'update:rounds': [Round[]] }>();

const q = ref('');
const formatId = ref('');
const answers = ref<Record<string, string>>({});
const pastQuestions = computed(() => props.rounds.map((r) => r.question));

// 탭을 벗어났다 돌아와도 현재 작성 중인 라운드 입력이 살아있도록 저장(완벽한 세션 단위 유니크 키까지는 아님)
const { value: draftJson, clear: clearDraft } = useDraft(
  () => `recoverse_draft_round_${props.kind}_${props.rounds.length}`,
);
let applyingDraft = false;

function applyDraft(json: string) {
  applyingDraft = true;
  try {
    const parsed = json ? JSON.parse(json) : {};
    q.value = typeof parsed.q === 'string' ? parsed.q : '';
    formatId.value = typeof parsed.formatId === 'string' ? parsed.formatId : '';
    answers.value = parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {};
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

function selectFormat(id: string) {
  formatId.value = id;
  const format = getFormat(id);
  // 포맷을 고르면 질문은 그 포맷의 고정 프롬프트로 (자유 질문이면 그대로 둠)
  if (format) q.value = format.prompt;
}

function answerHint(name: string): string {
  const format = getFormat(formatId.value);
  return format ? format.hint : `${name}의 답`;
}

const qaReady = computed(
  () =>
    q.value.trim().length > 0 &&
    props.participants.length > 0 &&
    props.participants.every((n) => (answers.value[n] ?? '').trim().length > 0),
);

function setAnswer(name: string, value: string) {
  answers.value = { ...answers.value, [name]: value };
}

function addRound() {
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
</script>

<style scoped>
.pastQ {
  margin-top: 16px;
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: var(--dim);
  line-height: 1.6;
}
.qaBox {
  border: 1px solid var(--ink);
  padding: 16px;
  display: grid;
  gap: 10px;
  margin-top: 16px;
  background: var(--paper-card);
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
}
.fchip.active {
  background: var(--ink);
  color: var(--paper);
}
.answerLine {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.answerLine > :deep(.dot) {
  margin-top: 14px;
}
</style>
