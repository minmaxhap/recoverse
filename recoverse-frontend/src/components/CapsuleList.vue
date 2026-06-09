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
    <button
      v-for="capsule in filteredCapsules"
      :key="capsule.id"
      class="rowItem"
      :class="{ active: capsule.id === selectedCapsuleId }"
      type="button"
      @click="$emit('select', capsule.id)"
    >
      <div class="rowTop">
        <span class="q">{{ capsule.title }}</span>
        <span class="badge">{{ typeLabels[capsule.type] ?? capsule.type }}</span>
      </div>
      <div class="rowSub">
        <span class="subText">
          {{ labels.questions }} {{ stats.get(capsule.id)?.cards ?? 0 }} /
          {{ labels.answers }} {{ stats.get(capsule.id)?.answered ?? 0 }}
        </span>
      </div>
      <div v-if="capsule.description" class="rowSub">
        <span class="subText">{{ capsule.description }}</span>
      </div>
    </button>

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

type CapsuleStats = {
  cards: number;
  answered: number;
};

defineProps<{
  search: string;
  capsules: Capsule[];
  filteredCapsules: Capsule[];
  selectedCapsuleId: string | null;
  stats: Map<string, CapsuleStats>;
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

.rowItem {
  font: inherit;
  color: var(--color-ink);
  cursor: pointer;
  text-align: left;
  border-radius: 14px;
  border: 1px solid var(--color-soft-border);
  background: var(--color-paper);
  padding: 9px 10px;
}

.rowItem.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary) inset;
}

.rowTop {
  display: flex;
  gap: 8px;
  align-items: center;
}

.q {
  font-weight: 800;
  font-size: 13px;
  line-height: 1.25;
  flex: 1;
}

.badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  color: var(--color-muted);
}

.rowSub {
  margin-top: 6px;
  color: var(--color-muted);
  font-size: 12px;
}

.subText {
  line-height: 1.3;
}

.empty {
  color: var(--color-muted);
  font-size: 13px;
  padding: 14px;
  line-height: 1.5;
}
</style>
