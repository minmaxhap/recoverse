<template>
  <div class="panelHead">
    <input
      :value="search"
      class="search capsuleSearch"
      :placeholder="labels.searchCapsules"
      @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
    />
    <label class="sortControl">
      <span>{{ labels.sort }}</span>
      <select
        :value="sort"
        @change="$emit('update:sort', ($event.target as HTMLSelectElement).value as CapsuleArchiveSort)"
      >
        <option value="updated">{{ labels.sortLabels.updated }}</option>
        <option value="created">{{ labels.sortLabels.created }}</option>
        <option value="title">{{ labels.sortLabels.title }}</option>
      </select>
    </label>
  </div>

  <div class="list">
    <CapsuleListItem
      v-for="capsule in filteredCapsules"
      :key="capsule.id"
      :capsule="capsule"
      :selected="capsule.id === selectedCapsuleId"
      :stats="stats.get(capsule.id)"
      :match-reason="matchReasons.get(capsule.id) ?? ''"
      :type-labels="typeLabels"
      :labels="{ questions: labels.questions, answers: labels.answers, match: labels.match }"
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
import type { CapsuleArchiveSort, CapsuleHomeStats } from "../lib/capsuleHomeData";
import CapsuleListItem from "./CapsuleListItem.vue";

defineProps<{
  search: string;
  sort: CapsuleArchiveSort;
  capsules: Capsule[];
  filteredCapsules: Capsule[];
  selectedCapsuleId: string | null;
  stats: Map<string, CapsuleHomeStats>;
  matchReasons: Map<string, string>;
  typeLabels: Record<CapsuleType, string>;
  labels: {
    searchCapsules: string;
    questions: string;
    answers: string;
    noCapsules: string;
    noSearchResults: string;
    sort: string;
    match: string;
    sortLabels: Record<CapsuleArchiveSort, string>;
  };
}>();

defineEmits<{
  "update:search": [value: string];
  "update:sort": [value: CapsuleArchiveSort];
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

.sortControl {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.sortControl select {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-paper);
  color: var(--color-ink);
  font: inherit;
  padding: 9px 10px;
}

@media (max-width: 640px) {
  .panelHead {
    align-items: stretch;
    flex-direction: column;
  }

  .sortControl {
    justify-content: space-between;
  }
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
