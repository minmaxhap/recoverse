<template>
  <section class="discovery">
    <button v-if="card" class="discoveryButton" type="button" @click="$emit('open')">
      <span class="discoveryEyebrow">{{ labels.title }}</span>
      <span class="capsuleTitle">{{ capsuleTitle }}</span>
      <span class="question">{{ card.questionText }}</span>
      <span class="discoveryQuote">"{{ answerPreview }}"</span>
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
  padding: 10px 14px 14px;
}

.discoveryButton {
  width: 100%;
  font: inherit;
  cursor: pointer;
  text-align: left;
  border: 1px solid var(--color-border-gold, rgba(240,192,96,0.2));
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
  display: grid;
  gap: 8px;
  padding: 20px;
}

.discoveryEyebrow {
  color: var(--color-gold);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.capsuleTitle {
  color: var(--color-text);
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
}

.question {
  color: var(--color-text);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.discoveryQuote {
  border-left: 3px solid var(--color-gold);
  padding-left: 12px;
  color: var(--color-text);
  font-size: 13px;
  font-style: italic;
  line-height: 1.7;
}

.openLabel {
  justify-self: start;
  margin-top: 4px;
  padding: 9px 12px;
  border-radius: 99px;
  background: linear-gradient(135deg, var(--color-gold), var(--color-planet-1));
  color: var(--color-primary-contrast);
  border: none;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 0 16px rgba(240,192,96,0.3);
}

.empty {
  margin: 0;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-paper);
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>
