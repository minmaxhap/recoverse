<template>
  <template v-for="(name, j) in participants" :key="name">
    <FormatAnswer
      v-if="answers?.[name] && formatKind"
      :text="answers[name].text"
      :name="name"
      :color="colorAt(j)"
      :kind="formatKind"
      :still="still"
      :index="j"
    />
    <AnswerQuote
      v-else-if="answers?.[name]"
      :text="answers[name].text"
      :name="name"
      :color="colorAt(j)"
      :still="still"
      :index="j"
    />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Answer } from '@recoverse/shared';
import AnswerQuote from './AnswerQuote.vue';
import FormatAnswer from './FormatAnswer.vue';
import { colorAt } from '../lib/palette';
import { getFormat } from '../data/formats';

const props = withDefaults(
  defineProps<{
    participants: string[];
    answers?: Record<string, Answer>;
    format?: string;
    still?: boolean;
  }>(),
  { still: false },
);

const formatKind = computed(() => getFormat(props.format)?.kind);
</script>
