<template>
  <div class="panelHead">
    <input
      :value="search"
      class="search capsuleSearch"
      :placeholder="labels.searchCapsules"
      @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div class="list">
    <CapsuleListItem
      v-for="capsule in filteredCapsules"
      :key="capsule.id"
      :capsule="capsule"
      :selected="capsule.id === selectedCapsuleId"
      :stats="stats.get(capsule.id)"
      :type-labels="typeLabels"
      :labels="{ questions: labels.questions, answers: labels.answers }"
      @select="$emit('select', $event)"
    />

    <div v-if="capsules.length === 0" class="empty">
      {{ labels.noCapsules }}
    </div>
    <div v-else-if="filteredCapsules.length === 0" class="empty">
      {{ labels.noSearchResults }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Capsule, CapsuleType } from "../lib/recoverseStore";
import type { CapsuleHomeStats } from "../lib/capsuleHomeData";
import CapsuleListItem from "./CapsuleListItem.vue";

defineProps<{
  search: string;
  capsules: Capsule[];
  filteredCapsules: Capsule[];
  selectedCapsuleId: string | null;
  stats: Map<string, CapsuleHomeStats>;
  typeLabels: Record<CapsuleType, string>;
  labels: {
    searchCapsules: string;
    questions: string;
    answers: string;
    noCapsules: string;
    noSearchResults: string;
  };
}>();

defineEmits<{
  "update:search": [value: string];
  select: [capsuleId: string];
}>();
</script>

<style scoped>
.panelHead {
  padding: 12px 12px;
  border-bottom: 1px solid var(--color-soft-border);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.search {
  margin-left: auto;
  width: 220px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  outline: none;
}

.capsuleSearch {
  margin-left: 0;
  width: 100%;
}

.list {
  padding: 8px;
  overflow: auto;
  display: grid;
  gap: 6px;
}

.empty {
  color: var(--color-muted);
  font-size: 13px;
  padding: 14px;
  line-height: 1.5;
}
</style>
