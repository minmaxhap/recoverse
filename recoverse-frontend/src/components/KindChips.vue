<template>
  <div class="kindChips" role="radiogroup" aria-label="회고 종류">
    <button
      v-for="k in KINDS"
      :key="k"
      type="button"
      role="radio"
      :aria-checked="k === modelValue"
      class="chip"
      :class="{ active: k === modelValue }"
      @click="$emit('update:modelValue', k)"
    >
      {{ KIND_LABELS[k] }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { KINDS, KIND_LABELS, type Kind } from '@recoverse/shared';

defineProps<{ modelValue: Kind }>();
defineEmits<{ 'update:modelValue': [Kind] }>();
</script>

<style scoped>
.kindChips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 700;
  background: var(--paper-card);
  color: var(--ink);
  border: 1px solid var(--ink);
  border-radius: 0;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.chip:hover {
  background: var(--ink);
  color: var(--paper);
}
.chip.active {
  background: var(--ink);
  color: var(--paper);
}
</style>
