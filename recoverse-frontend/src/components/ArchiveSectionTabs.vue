<template>
  <div class="tabs">
    <button
      v-for="plan in plans"
      :key="plan.id"
      :class="{ active: plan.id === activeMode }"
      type="button"
      @click="$emit('select', plan.id)"
    >
      {{ plan.title }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AppModePlan, ArchiveModeId } from "../lib/appScreens";

defineProps<{
  activeMode: ArchiveModeId;
  plans: Array<AppModePlan & { id: ArchiveModeId }>;
}>();

defineEmits<{
  select: [mode: ArchiveModeId];
}>();
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  flex-wrap: wrap;
}

button {
  font: inherit;
  border: 1px solid var(--color-border);
  background: var(--color-paper);
  color: var(--color-ink);
  border-radius: 999px;
  padding: 9px 12px;
  cursor: pointer;
}

.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-contrast);
}
</style>
