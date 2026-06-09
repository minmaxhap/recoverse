<template>
  <section class="shelf">
    <div class="head">
      <span class="eyebrow">{{ labels.eyebrow }}</span>
      <h3>{{ labels.title }}</h3>
      <p>{{ labels.description }}</p>
    </div>

    <CapsuleListSection
      :search="search"
      :capsules="capsules"
      :filtered-capsules="filteredCapsules"
      :selected-capsule-id="selectedCapsuleId"
      :stats="stats"
      :type-labels="typeLabels"
      :labels="listLabels"
      @update:search="$emit('update:search', $event)"
      @select="$emit('select', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import type { Capsule, CapsuleType } from "../lib/recoverseStore";
import type { CapsuleHomeStats } from "../lib/capsuleHomeData";
import CapsuleListSection from "./CapsuleListSection.vue";

defineProps<{
  search: string;
  capsules: Capsule[];
  filteredCapsules: Capsule[];
  selectedCapsuleId: string | null;
  stats: Map<string, CapsuleHomeStats>;
  typeLabels: Record<CapsuleType, string>;
  listLabels: {
    searchCapsules: string;
    questions: string;
    answers: string;
    noCapsules: string;
    noSearchResults: string;
  };
  labels: {
    eyebrow: string;
    title: string;
    description: string;
  };
}>();

defineEmits<{
  "update:search": [value: string];
  select: [capsuleId: string];
}>();
</script>

<style scoped>
.shelf {
  margin: 0 16px;
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  background: var(--color-surface);
  overflow: hidden;
}

.head {
  padding: 14px 14px 0;
  display: grid;
  gap: 4px;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 15px;
  font-weight: 900;
}

p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>
