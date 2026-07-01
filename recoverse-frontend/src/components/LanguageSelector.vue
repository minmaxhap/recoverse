<template>
  <label class="languageSelect">
    <select :value="modelValue" :aria-label="label" @change="onChange">
      <option value="ko">한국어</option>
      <option value="en">English</option>
    </select>
  </label>
</template>

<script setup lang="ts">
import type { AppLanguage } from "../types/recoverse";

defineProps<{
  modelValue: AppLanguage;
  label: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: AppLanguage];
  change: [value: AppLanguage];
}>();

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value === "en" ? "en" : "ko";
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<style scoped>
.languageSelect { display: grid; gap: 8px; font-size: 12px; color: var(--text-secondary); }
.languageSelect select { min-height: 42px; border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: var(--surface-paper); color: var(--text-primary); padding: 9px 11px; }
</style>