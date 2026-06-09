<template>
  <section v-if="capsule" class="summary">
    <div class="summaryItem">
      <span>{{ labels.type }}</span>
      <strong>{{ typeLabel }}</strong>
    </div>
    <div class="summaryItem wide">
      <span>{{ labels.description }}</span>
      <strong>{{ capsule.description || labels.noDescription }}</strong>
    </div>
    <div class="summaryItem">
      <span>{{ labels.recentlyEdited }}</span>
      <strong>{{ formattedUpdatedAt }}</strong>
    </div>
    <div class="summaryItem">
      <span>{{ labels.questions }} / {{ labels.answers }}</span>
      <strong>{{ stats?.cards ?? 0 }} / {{ stats?.answers ?? 0 }}</strong>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AppLanguage, Capsule } from "../lib/recoverseStore";
import type { CapsuleHomeStats } from "../lib/capsuleHomeData";

const props = defineProps<{
  capsule: Capsule | null;
  stats: CapsuleHomeStats | undefined;
  typeLabel: string;
  language: AppLanguage;
  labels: {
    type: string;
    description: string;
    noDescription: string;
    recentlyEdited: string;
    questions: string;
    answers: string;
  };
}>();

const formattedUpdatedAt = computed(() => {
  const value = props.stats?.latestUpdatedAt ?? props.capsule?.updatedAt;
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString(props.language === "ko" ? "ko-KR" : "en-US");
  } catch {
    return value;
  }
});
</script>

<style scoped>
.summary {
  margin: 0 12px 12px;
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  background: var(--color-paper);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  overflow: hidden;
}

.summaryItem {
  background: rgba(255, 250, 242, 0.76);
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
}

.summaryItem.wide {
  grid-column: 1 / -1;
}

span {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
}

strong {
  color: var(--color-ink);
  font-size: 12px;
  line-height: 1.35;
  word-break: keep-all;
}
</style>
