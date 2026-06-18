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
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 0 18px;
}

button {
  font: inherit;
  border: 1px solid var(--color-border-gold);
  background: rgba(240, 192, 96, 0.08);
  color: var(--color-text);
  border-radius: 14px;
  padding: 12px 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 900;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active {
  background: linear-gradient(135deg, #F0C060, #D4A030);
  border-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

@media (max-width: 520px) {
  .tabs {
    gap: 6px;
    padding: 0 12px;
  }

  button {
    padding: 10px 6px;
    font-size: 12px;
  }
}
</style>
