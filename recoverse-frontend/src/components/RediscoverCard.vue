<template>
  <div class="panelFoot">
    <button v-if="card" class="discoverBox discoverButton" type="button" @click="$emit('open')">
      <div class="muted">{{ labels.rediscover }}</div>
      <div class="strong">{{ capsuleTitle }}</div>
      <div class="q">{{ card.questionText }}</div>
      <div class="rowSub">{{ answerPreview }}</div>
    </button>
    <p v-else class="hint">
      {{ labels.rediscoverEmpty }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { CapsuleCard } from "../lib/recoverseStore";

defineProps<{
  card: CapsuleCard | null;
  capsuleTitle: string;
  answerPreview: string;
  labels: {
    rediscover: string;
    rediscoverEmpty: string;
  };
}>();

defineEmits<{
  open: [];
}>();
</script>

<style scoped>
.panelFoot {
  padding: 12px;
  border-top: 1px solid #eef0f3;
}

button {
  font: inherit;
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;
  color: #111;
}

.discoverBox {
  display: grid;
  gap: 6px;
}

.discoverButton {
  width: 100%;
  text-align: left;
  border-radius: 12px;
}

.muted {
  color: #6b7280;
  font-size: 12px;
}

.strong {
  font-weight: 900;
}

.q {
  font-weight: 800;
  font-size: 13px;
  line-height: 1.25;
  flex: 1;
}

.rowSub {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.35;
}
</style>
