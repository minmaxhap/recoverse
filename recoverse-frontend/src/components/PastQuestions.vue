<template>
  <div v-if="history.length > 0" class="pastQ" :class="{ centered }">
    <span class="eyebrow">지금까지의 헤드라인</span>
    <div v-for="(round, i) in history" :key="i">{{ i + 1 }}. {{ round.question }}</div>
  </div>
</template>

<script setup lang="ts">
import type { Round } from '@recoverse/shared';

withDefaults(defineProps<{ history: Round[]; centered?: boolean }>(), { centered: false });
</script>

<style scoped>
.pastQ {
  margin-top: 20px;
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: var(--dim);
  line-height: 1.6;
}
.pastQ.centered {
  justify-items: center;
}
.pastQ .eyebrow {
  margin-bottom: 2px;
}
</style>
