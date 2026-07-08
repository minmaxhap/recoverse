<template>
  <AppShell variant="write">
    <BackHeader label="복간 — 종이 회고 옮기기" @back="$emit('back')" />
    <p class="lede">보이는 그대로 옮겨 적으면, 지난 호로 책장에 꽂혀요.</p>

    <div class="stack">
      <input v-model="year" class="field" inputmode="numeric" placeholder="연도 (예: 2019)" />
      <input v-model="title" class="field" placeholder="호 제목 (선택 — 예: 2019 연말호)" />
      <input v-model="namesInput" class="field" placeholder="참여자 (쉼표 구분 — 예: 민희, 지원)" />
    </div>

    <section class="csvBox">
      <span class="eyebrow red">CSV IMPORT</span>
      <p class="fineprint">
        CSV 헤더 예시: year, title, question, asker, 민희, 지원. 한 줄이 한 질문으로 들어와요.
      </p>
      <input class="field" type="file" accept=".csv,text/csv" @change="importCsv" />
      <p v-if="csvMessage" class="fineprint">{{ csvMessage }}</p>
      <p v-if="csvError" class="error">{{ csvError }}</p>
    </section>

    <RoundEditor :participants="participants" :rounds="rounds" kind="yearend" @update:rounds="rounds = $event" />

    <div class="gap" />
    <button class="cta" :disabled="!canPublish" @click="publish">
      지난 호로 꽂기 ({{ rounds.length }}개 질문)
    </button>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Round } from '@recoverse/shared';
import AppShell from '../components/AppShell.vue';
import BackHeader from '../components/BackHeader.vue';
import RoundEditor from '../components/RoundEditor.vue';
import { issueFromDraft } from '../lib/issueBuilder';
import { useShelf } from '../composables/useShelf';
import { CsvImportError, parseReflectionCsv } from '../lib/csvImport';

const emit = defineEmits<{ back: []; published: [] }>();

const shelf = useShelf();
const year = ref('');
const title = ref('');
const namesInput = ref('');
const rounds = ref<Round[]>([]);
const csvMessage = ref('');
const csvError = ref('');

const participants = computed(() =>
  namesInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
const validYear = computed(() => /^\d{4}$/.test(year.value.trim()));
const canPublish = computed(() => validYear.value && participants.value.length > 0 && rounds.value.length > 0);

function publish() {
  if (!canPublish.value) return;
  // 연도만 아는 복간 → date는 그 해 1월 1일로 (다시 발견 연도는 date.slice(0,4)로 파생)
  const date = `${year.value.trim()}-01-01`;
  const issue = issueFromDraft(
    {
      kind: 'yearend',
      date,
      title: title.value.trim() || `${year.value.trim()} 연말호 (복간)`,
      participants: participants.value,
      rounds: rounds.value,
    },
    'paper',
  );
  shelf.add(issue);
  emit('published');
}

async function importCsv(event: Event): Promise<void> {
  csvMessage.value = '';
  csvError.value = '';
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  try {
    const result = parseReflectionCsv(await file.text());
    if (result.year && !year.value.trim()) year.value = result.year;
    if (result.title && !title.value.trim()) title.value = result.title;
    if (participants.value.length === 0) namesInput.value = result.participants.join(', ');
    rounds.value = [...rounds.value, ...result.rounds];
    csvMessage.value = `질문 ${result.rounds.length}개를 가져왔어요.`;
  } catch (error) {
    if (error instanceof CsvImportError) {
      csvError.value = error.message;
      return;
    }
    throw error;
  }
}
</script>

<style scoped>
.csvBox {
  display: grid;
  gap: 8px;
  margin: 18px 0 6px;
  padding: 14px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
}
</style>
