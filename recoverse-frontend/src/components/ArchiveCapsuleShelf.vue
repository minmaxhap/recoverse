<template>
  <section class="shelf">
    <div class="head">
      <span class="eyebrow">{{ labels.eyebrow }}</span>
      <h3>{{ labels.title }}</h3>
      <p>{{ labels.description }}</p>
    </div>

    <section v-if="recentCapsules.length" class="recentBlock" aria-label="Recent memories">
      <div class="recentHead">
        <h4>{{ labels.recentTitle }}</h4>
        <p>{{ labels.recentDescription }}</p>
      </div>

      <div class="recentGrid">
        <button
          v-for="capsule in recentCapsules"
          :key="capsule.id"
          class="recentCard"
          type="button"
          @click="$emit('select', capsule.id)"
        >
          <span class="recentPlanet" aria-hidden="true"></span>
          <span class="recentCopy">
            <span class="recentTitle">{{ capsule.title }}</span>
            <span class="recentMeta">
              {{ typeLabels[capsule.type] ?? capsule.type }}
              · {{ labels.recentOpen }}
            </span>
          </span>
        </button>
      </div>
    </section>

    <CapsuleListSection
      :search="search"
      :sort="sort"
      :capsules="capsules"
      :filtered-capsules="filteredCapsules"
      :selected-capsule-id="selectedCapsuleId"
      :stats="stats"
      :match-reasons="matchReasons"
      :type-labels="typeLabels"
      :labels="listLabels"
      @update:search="$emit('update:search', $event)"
      @update:sort="$emit('update:sort', $event)"
      @select="$emit('select', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Capsule, CapsuleType } from "../lib/recoverseStore";
import type { CapsuleArchiveSort, CapsuleHomeStats } from "../lib/capsuleHomeData";
import CapsuleListSection from "./CapsuleListSection.vue";

const props = defineProps<{
  search: string;
  sort: CapsuleArchiveSort;
  capsules: Capsule[];
  filteredCapsules: Capsule[];
  selectedCapsuleId: string | null;
  stats: Map<string, CapsuleHomeStats>;
  matchReasons: Map<string, string>;
  typeLabels: Record<CapsuleType, string>;
  listLabels: {
    searchCapsules: string;
    questions: string;
    answers: string;
    noCapsules: string;
    noSearchResults: string;
    sort: string;
    match: string;
    sortLabels: Record<CapsuleArchiveSort, string>;
  };
  labels: {
    eyebrow: string;
    title: string;
    description: string;
    recentTitle: string;
    recentDescription: string;
    recentOpen: string;
  };
}>();

defineEmits<{
  "update:search": [value: string];
  "update:sort": [value: CapsuleArchiveSort];
  select: [capsuleId: string];
}>();

const recentCapsules = computed(() =>
  [...props.capsules]
    .sort((a, b) => timestampFor(b) - timestampFor(a))
    .slice(0, 3)
);

function timestampFor(capsule: Capsule) {
  return new Date(capsule.updatedAt || capsule.createdAt).getTime();
}
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

.recentBlock {
  margin: 14px;
  display: grid;
  gap: 10px;
}

.recentHead {
  display: grid;
  gap: 3px;
}

h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 900;
}

.recentHead p {
  font-size: 12px;
}

.recentGrid {
  display: grid;
  gap: 8px;
}

.recentCard {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border: 1px solid var(--color-border-gold);
  border-radius: 16px;
  background:
    radial-gradient(circle at 88% 0%, rgba(240, 192, 96, 0.14), transparent 36%),
    rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  cursor: pointer;
  padding: 11px;
  text-align: left;
}

.recentPlanet {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.86), transparent 18%),
    linear-gradient(145deg, var(--color-planet-1), var(--color-gold) 56%, var(--color-planet-3));
  box-shadow: 0 0 20px rgba(240, 192, 96, 0.24);
}

.recentCopy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.recentTitle {
  overflow: hidden;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recentMeta {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
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
