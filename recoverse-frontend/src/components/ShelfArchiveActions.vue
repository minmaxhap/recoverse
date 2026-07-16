<template>
  <div class="archiveActions" :class="{ compact }">
    <button type="button" class="archiveLink" aria-describedby="archiveStatus" @click="openImport">
      이전 Recoverse 백업 가져오기
    </button>
    <button type="button" class="archiveLink" aria-describedby="archiveStatus" @click="openCsvImport">
      CSV 지난 호 가져오기
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
    <input
      ref="csvInput"
      type="file"
      accept=".csv,text/csv"
      class="srOnly"
      tabindex="-1"
      aria-hidden="true"
      @change="onCsvImport"
    />
    <button v-if="issues.length > 0" type="button" class="archiveLink" @click="onExport">
      책장 전체 내보내기
    </button>
    <p class="archiveHelp">CSV 헤더: year 또는 date, title, question, asker, 참여자 이름</p>
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
import { CsvImportError, parseReflectionCsv } from '../lib/csvImport';
import { issueFromDraft } from '../lib/issueBuilder';

const props = defineProps<{
  readonly issues: readonly Issue[];
  readonly compact?: boolean;
}>();

const shelf = useShelf();
const importMsg = ref('');
const importErr = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const csvInput = ref<HTMLInputElement | null>(null);

function openImport(): void {
  fileInput.value?.click();
}

function openCsvImport(): void {
  csvInput.value?.click();
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

async function onCsvImport(event: Event): Promise<void> {
  importMsg.value = '';
  importErr.value = '';
  if (!isFileInput(event.target)) return;

  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  try {
    const imported = parseReflectionCsv(await file.text());
    if (!imported.year) {
      importErr.value = 'CSV에 year 또는 date 컬럼이 필요해요.';
      return;
    }

    const issue = issueFromDraft(
      {
        kind: 'yearend',
        date: `${imported.year}-01-01`,
        title: imported.title || `${imported.year} 연말호 (CSV)`,
        participants: [...imported.participants],
        rounds: [...imported.rounds],
      },
      'paper',
    );

    if (!shelf.add(issue)) {
      importErr.value = '브라우저 저장 공간에 저장하지 못했어요. 용량을 비우고 다시 시도해주세요.';
      return;
    }
    importMsg.value = `${issue.title}을 책장에 가져왔어요.`;
  } catch (error) {
    if (error instanceof CsvImportError) {
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

.archiveHelp {
  margin: 0;
  color: var(--dim);
  font-size: 12px;
  line-height: 1.55;
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
