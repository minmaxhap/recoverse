<template>
  <section class="discovery">
    <button v-if="card" class="discoveryButton" type="button" @click="$emit('open')">
      <span class="eyebrow">{{ labels.title }}</span>
      <span class="capsuleTitle">{{ capsuleTitle }}</span>
      <span class="question">{{ card.questionText }}</span>
      <span class="answer">"{{ answerPreview }}"</span>
      <span class="openLabel">{{ labels.open }}</span>
    </button>

    <p v-else class="empty">
      {{ labels.empty }}
    </p>
  </section>
</template>

<script setup lang="ts">
import type { CapsuleCard } from "../lib/recoverseStore";

defineProps<{
  card: CapsuleCard | null;
  capsuleTitle: string;
  answerPreview: string;
  labels: {
    title: string;
    empty: string;
    open: string;
  };
}>();

defineEmits<{
  open: [];
}>();
</script>

<style scoped>
.discovery {
  padding: 12px;
  border-bottom: 1px solid var(--color-soft-border);
}

.discoveryButton {
  width: 100%;
  font: inherit;
  color: var(--color-ink);
  cursor: pointer;
  text-align: left;
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  background:
    radial-gradient(circle at 16% 8%, rgba(244, 197, 106, 0.24), transparent 28%),
    linear-gradient(135deg, rgba(255, 249, 234, 0.96), rgba(246, 238, 220, 0.84));
  box-shadow: 0 14px 34px rgba(30, 24, 18, 0.08);
  display: grid;
  gap: 6px;
  padding: 14px;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
}

.capsuleTitle {
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
}

.question {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.answer {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.openLabel {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 900;
  margin-top: 2px;
}

.empty {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>
