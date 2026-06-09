<template>
  <div class="tools">
    <LanguageSelector
      :model-value="language"
      :label="languageLabel"
      @update:model-value="$emit('update:language', $event)"
      @change="$emit('change-language')"
    />
    <button type="button" :disabled="exportDisabled" @click="$emit('export')">
      {{ exportLabel }}
    </button>
    <label class="file">
      {{ importLabel }}
      <input type="file" accept="application/json" @change="$emit('import-file', $event)" />
    </label>
    <button class="danger" type="button" :disabled="clearDisabled" @click="$emit('clear-all')">
      {{ clearLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AppLanguage } from "../lib/recoverseStore";
import LanguageSelector from "./LanguageSelector.vue";

defineProps<{
  language: AppLanguage;
  languageLabel: string;
  exportLabel: string;
  importLabel: string;
  clearLabel: string;
  exportDisabled: boolean;
  clearDisabled: boolean;
}>();

defineEmits<{
  "update:language": [language: AppLanguage];
  "change-language": [];
  export: [];
  "import-file": [event: Event];
  "clear-all": [];
}>();
</script>

<style scoped>
.tools {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

button,
.file {
  font: inherit;
  border: 1px solid var(--color-border);
  background: var(--color-paper);
  color: var(--color-ink);
  border-radius: 12px;
  padding: 10px 12px;
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.file {
  cursor: pointer;
  user-select: none;
}

.file input {
  display: none;
}

.danger {
  border-color: #ef4444;
  color: #b91c1c;
}

@media (max-width: 899px) {
  .tools {
    justify-content: flex-start;
  }
}
</style>
