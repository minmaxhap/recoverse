<template>
  <button
    class="rowItem"
    :class="{ active: selected }"
    type="button"
    @click="$emit('select', capsule.id)"
  >
    <div class="rowTop">
      <span class="q">{{ capsule.title }}</span>
      <span class="badge">{{ typeLabels[capsule.type] ?? capsule.type }}</span>
    </div>
    <div class="rowSub">
      <span class="subText">
        {{ labels.questions }} {{ stats?.cards ?? 0 }} /
        {{ labels.answers }} {{ stats?.answered ?? 0 }}
      </span>
    </div>
    <div v-if="capsule.description" class="rowSub">
      <span class="subText">{{ capsule.description }}</span>
    </div>
    <div v-if="matchReason" class="rowSub match">
      <span class="subText">{{ labels.match }}: {{ matchReason }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Capsule, CapsuleType } from "../lib/recoverseStore";
import type { CapsuleHomeStats } from "../lib/capsuleHomeData";

defineProps<{
  capsule: Capsule;
  selected: boolean;
  stats: CapsuleHomeStats | undefined;
  matchReason: string;
  typeLabels: Record<CapsuleType, string>;
  labels: {
    questions: string;
    answers: string;
    match: string;
  };
}>();

defineEmits<{
  select: [capsuleId: string];
}>();
</script>

<style scoped>
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

.match {
  color: var(--color-primary);
}
</style>
