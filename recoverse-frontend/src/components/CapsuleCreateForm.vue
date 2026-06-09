<template>
  <div class="addWrap">
    <div class="formGrid">
      <label class="wide">
        <span class="noWrap">{{ labels.title }}</span>
        <input v-model="form.title" :placeholder="labels.titlePlaceholder" />
      </label>

      <label class="wide">
        <span class="noWrap">{{ labels.description }}</span>
        <input v-model="form.description" :placeholder="labels.descriptionPlaceholder" />
      </label>

      <label>
        <span class="noWrap">{{ labels.type }}</span>
        <select v-model="form.type">
          <option v-for="type in capsuleTypes" :key="type" :value="type">
            {{ typeLabels[type] }}
          </option>
        </select>
      </label>

      <label>
        <span class="noWrap">{{ labels.defaultQuestions }}</span>
        <select v-model="form.templateId">
          <option value="">{{ labels.none }}</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.title[language] }}
          </option>
        </select>
      </label>
    </div>

    <div class="btnRow">
      <button class="primary" type="button" @click="$emit('create')">
        {{ labels.createCapsuleButton }}
      </button>
      <button class="ghost" type="button" @click="$emit('reset')">
        {{ labels.reset }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="notice" class="hint">{{ notice }}</p>
    <p class="hint">
      {{ labels.templateHint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { AppLanguage, CapsuleType } from "../lib/recoverseStore";

type CapsuleFormState = {
  title: string;
  description: string;
  type: CapsuleType;
  templateId: string;
};

type CapsuleTemplateOption = {
  id: string;
  title: Record<AppLanguage, string>;
};

const capsuleTypes: CapsuleType[] = [
  "year",
  "life_stage",
  "career",
  "relationship",
  "travel",
  "project",
  "custom",
];

defineProps<{
  form: CapsuleFormState;
  templates: CapsuleTemplateOption[];
  language: AppLanguage;
  typeLabels: Record<CapsuleType, string>;
  labels: {
    title: string;
    titlePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    type: string;
    defaultQuestions: string;
    none: string;
    createCapsuleButton: string;
    reset: string;
    templateHint: string;
  };
  error: string;
  notice: string;
}>();

defineEmits<{
  create: [];
  reset: [];
}>();
</script>

<style scoped>
.addWrap {
  padding: 12px;
  overflow: auto;
}

.formGrid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 10px;
}

.formGrid label {
  display: grid;
  gap: 6px;
}

.formGrid label span {
  font-size: 12px;
  font-weight: 800;
  color: #374151;
}

.formGrid .wide {
  grid-column: 1 / -1;
}

.noWrap {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

input,
select {
  font: inherit;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
  color: #111;
}

.btnRow {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

button {
  font: inherit;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: #111;
}

.primary {
  background: #111;
  border-color: #111;
  color: #fff;
}

.ghost {
  background: #fff;
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.35;
}

.error {
  margin: 10px 0 0;
  color: #b00020;
  font-weight: 700;
}
</style>
