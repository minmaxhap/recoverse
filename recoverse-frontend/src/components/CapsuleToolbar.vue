<template>
  <div class="headBtns">
    <button class="ghost" type="button" :disabled="exportDisabled" @click="$emit('export')">
      {{ exportLabel }}
    </button>
    <label class="file smallFile">
      {{ importLabel }}
      <input type="file" accept="application/json" @change="$emit('import-file', $event)" />
    </label>
    <button class="ghost" type="button" @click="$emit('refresh')">
      {{ refreshLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  exportLabel: string;
  importLabel: string;
  refreshLabel: string;
  exportDisabled: boolean;
}>();

defineEmits<{
  export: [];
  "import-file": [event: Event];
  refresh: [];
}>();
</script>

<style scoped>
.headBtns {
  margin-left: auto;
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

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ghost {
  background: #fff;
}

.file {
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
}

.file input {
  display: none;
}

.smallFile {
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
}
</style>
