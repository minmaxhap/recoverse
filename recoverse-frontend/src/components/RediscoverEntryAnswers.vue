<template>
  <div class="answerStack">
    <article
      v-for="answer in answerItems"
      :key="answer.name"
      class="answerItem"
      :class="{ solo: answerItems.length === 1 }"
    >
      <div v-if="answerItems.length > 1" class="answerByline">
        <ParticipantDot :color="colorAt(answer.index)" small />
        <span>{{ answer.name }}</span>
      </div>
      <blockquote>{{ answer.text }}</blockquote>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Answer } from '@recoverse/shared';
import ParticipantDot from './ParticipantDot.vue';
import { colorAt } from '../lib/palette';

type AnswerItem = {
  readonly name: string;
  readonly text: string;
  readonly index: number;
};

const props = defineProps<{
  readonly participants: readonly string[];
  readonly answers: Record<string, Answer>;
}>();

const answerItems = computed<readonly AnswerItem[]>(() => {
  const orderedNames = props.participants.filter((name) => props.answers[name]?.text.trim());
  const extraNames = Object.keys(props.answers).filter((name) => !orderedNames.includes(name));
  return [...orderedNames, ...extraNames]
    .map((name, index) => {
      const text = props.answers[name]?.text.trim() ?? '';
      return { name, text, index };
    })
    .filter((answer) => answer.text.length > 0);
});
</script>

<style scoped>
.answerStack {
  display: grid;
  gap: 12px;
}

.answerItem {
  display: grid;
  gap: 8px;
  padding: 14px 0;
  border-bottom: 1px solid var(--hairline);
}

.answerItem.solo {
  padding-top: 4px;
}

.answerByline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  color: var(--dim);
}

blockquote {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.75;
  color: var(--ink);
  white-space: pre-wrap;
}
</style>
