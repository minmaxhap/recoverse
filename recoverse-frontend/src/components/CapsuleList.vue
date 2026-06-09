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
  border-bottom: 1px solid #eef0f3;
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
  border: 1px solid #d1d5db;
  outline: none;
}

.capsuleSearch {
  margin-left: 0;
  width: 100%;
}

.list {
  padding: 10px;
  overflow: auto;
  display: grid;
  gap: 8px;
}

.rowItem {
  font: inherit;
  color: #111;
  cursor: pointer;
  text-align: left;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 12px;
}

.rowItem.active {
  border-color: #111;
  box-shadow: 0 0 0 1px #111 inset;
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
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.rowSub {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
}

.subText {
  line-height: 1.3;
}

.empty {
  color: #6b7280;
  font-size: 13px;
  padding: 14px;
  line-height: 1.5;
}
</style>
