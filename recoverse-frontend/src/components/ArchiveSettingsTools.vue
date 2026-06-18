<template>
  <div class="tools">
    <section class="toolGroup">
      <span class="groupLabel">{{ languageLabel }}</span>
      <LanguageSelector
        :model-value="language"
        :label="languageLabel"
        @update:model-value="$emit('update:language', $event)"
        @change="$emit('change-language')"
      />
    </section>

    <section class="toolGroup">
      <span class="groupLabel">{{ capsuleGroupLabel }}</span>
      <div class="buttonRow">
        <button type="button" :disabled="capsuleExportDisabled" @click="$emit('capsule-export')">
          {{ capsuleExportLabel }}
        </button>
        <label class="file">
          {{ capsuleImportLabel }}
          <input type="file" accept="application/json" @change="$emit('capsule-import-file', $event)" />
        </label>
      </div>
    </section>

    <section class="toolGroup">
      <span class="groupLabel">{{ legacyGroupLabel }}</span>
      <div class="buttonRow">
        <button type="button" :disabled="exportDisabled" @click="$emit('export')">
          {{ exportLabel }}
        </button>
        <label class="file">
          {{ importLabel }}
          <input type="file" accept="application/json" @change="$emit('import-file', $event)" />
        </label>
      </div>
    </section>

    <section class="toolGroup dangerGroup">
      <span class="groupLabel">{{ dangerGroupLabel }}</span>
      <button class="danger" type="button" :disabled="clearDisabled" @click="$emit('clear-all')">
        {{ clearLabel }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AppLanguage } from "../lib/recoverseStore";
import LanguageSelector from "./LanguageSelector.vue";

defineProps<{
  language: AppLanguage;
  languageLabel: string;
  capsuleGroupLabel: string;
  capsuleExportLabel: string;
  capsuleImportLabel: string;
  capsuleExportDisabled: boolean;
  legacyGroupLabel: string;
  exportLabel: string;
  importLabel: string;
  dangerGroupLabel: string;
  clearLabel: string;
  exportDisabled: boolean;
  clearDisabled: boolean;
}>();

defineEmits<{
  "update:language": [language: AppLanguage];
  "change-language": [];
  "capsule-export": [];
  "capsule-import-file": [event: Event];
  export: [];
  "import-file": [event: Event];
  "clear-all": [];
}>();
</script>

<style scoped>
.tools {
  display: grid;
  gap: 10px;
  justify-items: stretch;
  min-width: min(680px, 100%);
}

.toolGroup {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: var(--color-surface);
  display: grid;
  gap: 8px;
  padding: 10px;
}

.groupLabel {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.buttonRow {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

button,
.file {
  font: inherit;
  border: 1px solid var(--color-border-gold);
  background: rgba(240, 192, 96, 0.08);
  color: var(--color-text);
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
  border-color: rgba(224, 85, 85, 0.55);
  background: rgba(224, 85, 85, 0.08);
  color: #ff8f8f;
}

.dangerGroup {
  border-color: rgba(239, 68, 68, 0.35);
}

@media (max-width: 899px) {
  .tools {
    min-width: 0;
  }
}
</style>
