<template>
  <div class="archiveActions" :class="{ compact }">
    <button type="button" class="archiveLink" aria-describedby="archiveStatus" @click="openImport">
      이전 Recoverse 백업 가져오기
    </button>
    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="srOnly"
      tabindex="-1"
      aria-hidden="true"
      @change="onImport"
    />
    <button v-if="issues.length > 0" type="button" class="archiveLink" @click="onExport">
      책장 전체 내보내기
    </button>
    <div id="archiveStatus" aria-live="polite">
      <p v-if="importMsg" class="fineprint">{{ importMsg }}</p>
      <p v-if="importErr" class="error" role="alert">{{ importErr }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import { useShelf } from '../composables/useShelf';
import { BackupImportError, parseReflectionBackup } from '../lib/backupImport';
import { exportShelfBackup } from '../lib/backupExport';

const props = defineProps<{
  readonly issues: readonly Issue[];
  readonly compact?: boolean;
}>();

const shelf = useShelf();
const importMsg = ref('');
const importErr = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

function openImport(): void {
  fileInput.value?.click();
}

function onExport(): void {
  exportShelfBackup([...props.issues]);
}

function isFileInput(target: EventTarget | null): target is HTMLInputElement {
  return target instanceof HTMLInputElement && target.type === 'file';
}

async function onImport(event: Event): Promise<void> {
  importMsg.value = '';
  importErr.value = '';
  if (!isFileInput(event.target)) return;

  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  try {
    const imported = parseReflectionBackup(await file.text());
    for (const issue of imported) shelf.add(issue);
    importMsg.value = `${imported.length}권을 책장으로 가져왔어요.`;
  } catch (error) {
    if (error instanceof BackupImportError) {
      importErr.value = error.message;
      return;
    }
    throw error;
  }
}
</script>

<style scoped>
.archiveActions {
  display: grid;
  gap: 8px;
}

.archiveActions.compact {
  margin-top: 14px;
  gap: 6px;
}

.archiveLink {
  width: fit-content;
  padding: 0;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  color: var(--dim);
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s ease;
}

.archiveLink:hover {
  color: var(--vermilion);
}
</style>
