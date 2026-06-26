<template>
  <label class="languageSelect">
    <span class="noWrap">{{ label }}</span>
    <select :value="modelValue" @change="onChange">
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
.languageSelect {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4b5563;
}

.languageSelect select {
  padding: 8px 10px;
  border-radius: 10px;
}
</style>
