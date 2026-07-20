<template>
  <div class="archiveActions">
    <div class="archiveTabs" role="tablist" aria-label="책장 파일 관리">
      <button type="button" role="tab" :aria-selected="mode === 'import-format'" :class="{ active: mode === 'import-format' }" @click="mode = 'import-format'"><Upload :size="15" /> 가져오기</button>
      <button type="button" role="tab" :aria-selected="mode === 'export-format'" :class="{ active: mode === 'export-format' }" @click="mode = 'export-format'"><Download :size="15" /> 내보내기</button>
    </div>

    <section v-if="mode === 'import-format'" class="archiveStep">
      <p class="stepTitle">가져올 형식을 고르세요</p>
      <button type="button" class="formatRow" @click="pickImport('json')"><b>Recoverse 백업</b><span>JSON · 사진과 공유 정보까지 보존</span></button>
      <button type="button" class="formatRow" @click="pickImport('csv')"><b>지난 호 CSV</b><span>CSV · 질문과 글만 옮김</span></button>
    </section>

    <section v-else-if="mode === 'export-format'" class="archiveStep">
      <p class="stepTitle">내보낼 형식을 고르세요</p>
      <button type="button" class="formatRow" @click="exportJson"><b>Recoverse 백업</b><span>JSON · 책장 전체를 그대로 보관</span></button>
      <button type="button" class="formatRow" @click="exportMarkdown"><b>읽는 문서</b><span>Markdown · 질문은 제목, 답은 인용문으로</span></button>
      <button type="button" class="formatRow" @click="exportCsv"><b>교환용 CSV</b><span>CSV · 질문과 답변 텍스트만 담음</span></button>
    </section>

    <section v-else class="archiveStep" aria-live="polite">
      <p class="stepTitle">가져오기 전 확인</p>
      <p class="previewSummary">{{ previewSummary }}</p>
      <ul class="previewList">
        <li v-for="item in preview?.items" :key="item.issue.id" :class="item.disposition">
          <span>{{ item.issue.date.slice(0, 4) }} · {{ item.issue.title }}</span>
          <b>{{ dispositionLabel(item.disposition) }}</b>
        </li>
      </ul>
      <p v-if="importErr" class="error" role="alert">{{ importErr }}</p>
      <div class="previewActions">
        <button type="button" class="ghost compactButton" @click="reset">취소</button>
        <button type="button" class="cta compactButton" :disabled="!preview?.newCount" @click="confirmImport">
          새로 온 {{ preview?.newCount ?? 0 }}권 가져오기
        </button>
      </div>
    </section>

    <input ref="fileInput" class="srOnly" type="file" :accept="accept" @change="onFile" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Download, Upload } from 'lucide-vue-next';
import type { Issue } from '@recoverse/shared';
import { useShelf } from '../composables/useShelf';
import { BackupImportError, parseReflectionBackup } from '../lib/backupImport';
import { exportShelfBackup } from '../lib/backupExport';
import { exportShelfMarkdown } from '../lib/markdownExport';
import { CsvImportError, parseReflectionCsv } from '../lib/csvImport';
import { issueFromDraft } from '../lib/issueBuilder';
import { previewArchiveImport, type ArchivePreview, type ArchiveDisposition } from '../lib/archivePreview';

const props = defineProps<{ readonly issues: readonly Issue[] }>();
type Mode = 'idle' | 'import-format' | 'export-format' | 'preview';
type ImportFormat = 'json' | 'csv';

const shelf = useShelf();
const mode = ref<Mode>('import-format');
const importFormat = ref<ImportFormat>('json');
const fileInput = ref<HTMLInputElement | null>(null);
const preview = ref<ArchivePreview | null>(null);
const importErr = ref('');
const accept = computed(() => importFormat.value === 'json' ? '.json,application/json' : '.csv,text/csv');
const previewSummary = computed(() => {
  const value = preview.value;
  return value ? `새 항목 ${value.newCount}권 · 이미 있는 호 ${value.duplicateCount}권 · 확인이 필요한 호 ${value.conflictCount}권` : '';
});

function pickImport(format: ImportFormat): void {
  importFormat.value = format;
  importErr.value = '';
  window.setTimeout(() => fileInput.value?.click());
}

function reset(): void {
  mode.value = 'import-format';
  preview.value = null;
  importErr.value = '';
}

function dispositionLabel(disposition: ArchiveDisposition): string {
  if (disposition === 'new') return '가져옴';
  if (disposition === 'duplicate') return '건너뜀';
  return '확인 필요';
}

function exportJson(): void {
  exportShelfBackup([...props.issues]);
  mode.value = 'import-format';
}

function exportMarkdown(): void {
  exportShelfMarkdown(props.issues);
  mode.value = 'import-format';
}

function exportCsv(): void {
  const names = [...new Set(props.issues.flatMap((issue) => issue.participants))];
  const headers = ['issue_id', 'kind', 'date', 'title', 'participants', 'question_index', 'question', 'asker', 'format', ...names.map((name) => `answer:${name}`)];
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = props.issues.flatMap((issue) => issue.rounds.map((round, index) => [
    issue.id, issue.kind, issue.date, issue.title, issue.participants.join('|'), String(index + 1), round.question, round.asker, round.format ?? '',
    ...names.map((name) => round.answers[name]?.text ?? ''),
  ].map(quote).join(',')));
  const url = URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `recoverse-text-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  mode.value = 'import-format';
}

async function onFile(event: Event): Promise<void> {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const incoming = importFormat.value === 'json' ? parseReflectionBackup(text) : [csvIssue(text)];
    preview.value = previewArchiveImport(incoming, props.issues);
    mode.value = 'preview';
  } catch (error) {
    mode.value = 'import-format';
    importErr.value = error instanceof BackupImportError || error instanceof CsvImportError ? error.message : '파일을 읽지 못했어요. 다시 확인해 주세요.';
  }
}

function csvIssue(text: string): Issue {
  const imported = parseReflectionCsv(text);
  if (!imported.year) throw new CsvImportError('CSV에 year 또는 date 열이 필요해요.');
  return issueFromDraft({ kind: 'yearend', date: `${imported.year}-01-01`, title: imported.title || `${imported.year} 회고`, participants: [...imported.participants], rounds: [...imported.rounds] }, 'paper');
}

function confirmImport(): void {
  const accepted = preview.value?.items.filter((item) => item.disposition === 'new').map((item) => item.issue) ?? [];
  const result = shelf.addMany(accepted);
  if (!result.ok) {
    importErr.value = '저장 공간에 담지 못했어요. 기존 책장은 그대로 두었으니 공간을 비운 뒤 다시 시도해 주세요.';
    return;
  }
  reset();
}
</script>

<style scoped>
.archiveActions, .archiveStep { display: grid; gap: 8px; }
.archiveTabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--hairline); }
.archiveTabs button { display: inline-flex; justify-content: center; align-items: center; gap: 6px; padding: 9px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--dim); font: 800 12px var(--font-ui); cursor: pointer; }
.archiveTabs button.active { border-bottom-color: var(--vermilion); color: var(--ink); }
.archiveCommand, .formatRow { width: 100%; display: grid; gap: 3px; padding: 11px 0; background: none; border: 0; border-bottom: 1px solid var(--hairline); color: var(--ink); text-align: left; cursor: pointer; }
.archiveCommand span { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; }
.archiveCommand small, .formatRow span { color: var(--dim); font-size: 12px; line-height: 1.5; }
.archiveCommand:hover span, .formatRow:hover b, .textButton:hover { color: var(--vermilion); }
.stepTitle { margin: 0; font-size: 13px; font-weight: 800; }
.formatRow { padding: 10px; border: 1px solid var(--hairline); background: var(--paper); }
.formatRow b { font-size: 13px; }
.textButton { justify-self: start; padding: 4px 0; border: 0; background: none; color: var(--dim); text-decoration: underline; cursor: pointer; }
.previewSummary { margin: 0; color: var(--dim-strong); font-size: 12px; line-height: 1.55; }
.previewList { display: grid; gap: 0; max-height: 190px; margin: 0; padding: 0; overflow: auto; list-style: none; border-top: 1px solid var(--hairline); }
.previewList li { display: flex; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--hairline); color: var(--dim-strong); font-size: 12px; }
.previewList b { flex: 0 0 auto; font-size: 11px; }.previewList .new b { color: var(--vermilion); }.previewList .conflict b { color: var(--gold); }
.previewActions { display: flex; justify-content: flex-end; gap: 8px; }.compactButton { width: auto; min-height: 40px; padding: 8px 12px; font-size: 12px; }
</style>
