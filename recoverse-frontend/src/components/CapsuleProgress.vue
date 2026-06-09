<template>
  <div class="progressBox">
    <div class="rowTop">
      <span class="q">{{ label }}</span>
      <span class="badge">{{ answered }} / {{ total }}</span>
    </div>
    <div class="progressTrack">
      <div class="progressFill" :style="{ width: `${percent}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AppLanguage, CapsuleCard } from "../lib/recoverseStore";

const props = defineProps<{
  cards: CapsuleCard[];
  language: AppLanguage;
}>();

const label = computed(() => (props.language === "ko" ? "진행률" : "Progress"));
const total = computed(() => props.cards.length);
const answered = computed(() => props.cards.filter((card) => card.answers.length > 0).length);
const percent = computed(() =>
  total.value === 0 ? 0 : Math.round((answered.value / total.value) * 100)
);
</script>

<style scoped>
.progressBox {
  border: 1px solid var(--color-soft-border);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 8px;
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

.progressTrack {
  height: 8px;
  border-radius: 999px;
  background: var(--color-soft-border);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}
</style>
