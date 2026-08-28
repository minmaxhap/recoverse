<template>
  <IssueCover
    :issue="issue"
    :no="no"
    :fresh="visibleFresh"
    :class="{ fresh: visibleFresh }"
    @open="$emit('open', $event)"
  />
</template>

<script setup lang="ts">
import type { Issue } from '@recoverse/shared';
import { onBeforeUnmount, ref, watch } from 'vue';
import IssueCover from './IssueCover.vue';

const props = withDefaults(
  defineProps<{ readonly issue: Issue; readonly no: number; readonly fresh?: boolean }>(),
  { fresh: false },
);
defineEmits<{ open: [string] }>();

const visibleFresh = ref(false);
let freshTimer: number | null = null;

function clearFreshTimer(): void {
  if (freshTimer === null) return;
  window.clearTimeout(freshTimer);
  freshTimer = null;
}

function updateFresh(fresh: boolean): void {
  clearFreshTimer();
  visibleFresh.value = fresh;
  if (!fresh) return;
  freshTimer = window.setTimeout(() => {
    visibleFresh.value = false;
    freshTimer = null;
  }, 3_200);
}

watch(() => props.fresh, updateFresh, { immediate: true });
onBeforeUnmount(clearFreshTimer);
</script>

<style scoped>
.fresh {
  outline: 2px solid var(--vermilion);
  outline-offset: 2px;
  animation: freshCover 0.5s ease 2;
}

@keyframes freshCover {
  50% {
    transform: translateY(-6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fresh {
    animation: none;
  }
}
</style>
