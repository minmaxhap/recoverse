<template>
  <div class="homeHeader">
    <div class="homeTitle">
      <span class="eyebrow">{{ brandLabel }}</span>
      <h2>{{ title }}</h2>
    </div>

    <CapsuleToolbar
      :export-label="toolbarLabels.exportCapsules"
      :import-label="toolbarLabels.importCapsules"
      :backup-version-label="toolbarLabels.capsuleBackupVersion"
      :refresh-label="toolbarLabels.refresh"
      :export-disabled="exportDisabled"
      @export="$emit('export')"
      @import-file="$emit('import-file', $event)"
      @refresh="$emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
import CapsuleToolbar from "./CapsuleToolbar.vue";

defineProps<{
  brandLabel: string;
  title: string;
  exportDisabled: boolean;
  toolbarLabels: {
    exportCapsules: string;
    importCapsules: string;
    capsuleBackupVersion: string;
    refresh: string;
  };
}>();

defineEmits<{
  export: [];
  "import-file": [event: Event];
  refresh: [];
}>();
</script>

<style scoped>
.homeHeader {
  padding: 12px;
  border-bottom: 1px solid var(--color-soft-border);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.homeTitle {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 16px;
  font-weight: 900;
  line-height: 1.15;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

@media (max-width: 899px) {
  .homeHeader {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
