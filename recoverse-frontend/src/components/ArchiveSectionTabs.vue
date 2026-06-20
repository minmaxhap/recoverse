<template>
  <div class="tabs">
    <div class="primaryTabs">
      <button
        v-for="plan in primaryPlans"
        :key="plan.id"
        :class="{ active: plan.id === activeMode }"
        type="button"
        @click="$emit('select', plan.id)"
      >
        {{ plan.title }}
      </button>
    </div>

    <button
      v-if="settingsPlan"
      class="settingsTab"
      :class="{ active: settingsPlan.id === activeMode }"
      type="button"
      @click="$emit('select', settingsPlan.id)"
    >
      {{ settingsPlan.title }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AppModePlan, ArchiveModeId } from "../lib/appScreens";

const props = defineProps<{
  activeMode: ArchiveModeId;
  plans: Array<AppModePlan & { id: ArchiveModeId }>;
}>();

defineEmits<{
  select: [mode: ArchiveModeId];
}>();

const primaryPlans = computed(() => props.plans.filter((plan) => plan.id !== "archive-settings"));
const settingsPlan = computed(() => props.plans.find((plan) => plan.id === "archive-settings"));
</script>

<style scoped>
.tabs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  padding: 0 18px;
  align-items: stretch;
}

.primaryTabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
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

.settingsTab {
  width: auto;
  min-width: 74px;
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-muted);
}

.settingsTab.active {
  border-color: var(--color-border-gold);
  background: rgba(240, 192, 96, 0.12);
  color: var(--color-text);
}

@media (max-width: 520px) {
  .tabs {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 0 12px;
  }

  .primaryTabs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .settingsTab {
    width: fit-content;
    justify-self: end;
  }

  button {
    padding: 10px 6px;
    font-size: 12px;
  }
}
</style>
