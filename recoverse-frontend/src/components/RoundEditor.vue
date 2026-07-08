<template>
  <div class="roundEditor">
    <div v-if="rounds.length > 0" class="pastQ">
      <div v-for="(r, i) in rounds" :key="i">✓ {{ i + 1 }}. {{ r.question }}</div>
    </div>

    <div class="qaBox">
      <span class="eyebrow red">질문 {{ rounds.length + 1 }}</span>
      <input
        class="field"
        :value="q"
        placeholder="질문"
        @input="q = ($event.target as HTMLInputElement).value"
      />
      <QuestionSuggest :kind="kind" :exclude="pastQuestions" @pick="q = $event" />
      <div v-for="(name, i) in participants" :key="name" class="answerLine">
        <ParticipantDot :color="colorAt(i)" />
        <textarea
          class="field area short"
          :value="answers[name] ?? ''"
          :placeholder="`${name}의 답`"
          @input="setAnswer(name, ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
      <button class="ghost" :disabled="!qaReady" @click="addRound">이 질문 추가</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Kind, Round } from '@recoverse/shared';
import ParticipantDot from './ParticipantDot.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import { colorAt } from '../lib/palette';

const props = withDefaults(
  defineProps<{ participants: string[]; rounds: Round[]; kind?: Kind }>(),
  { kind: 'free' },
);
const emit = defineEmits<{ 'update:rounds': [Round[]] }>();

const q = ref('');
const answers = ref<Record<string, string>>({});
const pastQuestions = computed(() => props.rounds.map((r) => r.question));

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
  emit('update:rounds', [...props.rounds, { asker, question: q.value.trim(), answers: roundAnswers }]);
  q.value = '';
  answers.value = {};
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
.answerLine {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.answerLine > :deep(.dot) {
  margin-top: 14px;
}
</style>
