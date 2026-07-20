<template>
  <div class="migrate">
    <div v-if="mode === 'idle'" class="migrateChoices">
      <button type="button" class="formatRow" :disabled="issues.length === 0" @click="send">
        <b>이 책장 옮기기</b><span>{{ issues.length }}권을 코드로 만들어 새 기기에서 받아요</span>
      </button>
      <button type="button" class="formatRow" @click="startReceive">
        <b>코드로 가져오기</b><span>다른 기기에서 만든 이사 코드를 입력해요</span>
      </button>
    </div>

    <section v-else-if="mode === 'sent'" class="migrateStep" aria-live="polite">
      <p class="stepTitle">새 기기에서 이 코드를 입력하세요</p>
      <p class="migrateCode">{{ code }}</p>
      <p class="fineprint">약 {{ expiryMinutes }}분 뒤 만료 · 한 번 받으면 사라져요</p>
      <button type="button" class="ghost compactButton" @click="reset">완료</button>
    </section>

    <section v-else-if="mode === 'receive-input'" class="migrateStep">
      <p class="stepTitle">이사 코드 입력</p>
      <input
        v-model="codeInput"
        class="field migrateInput"
        maxlength="6"
        placeholder="ABC123"
        inputmode="text"
        autocapitalize="characters"
        spellcheck="false"
        aria-label="이사 코드"
        @input="codeInput = codeInput.toUpperCase()"
      />
      <p v-if="err" class="error" role="alert">{{ err }}</p>
      <div class="previewActions">
        <button type="button" class="ghost compactButton" @click="reset">취소</button>
        <button type="button" class="cta compactButton" :disabled="busy || codeInput.length !== 6" @click="claim">
          {{ busy ? '받는 중…' : '받기' }}
        </button>
      </div>
    </section>

    <section v-else class="migrateStep" aria-live="polite">
      <p class="stepTitle">가져오기 전 확인</p>
      <p class="previewSummary">새 {{ preview?.newCount ?? 0 }}권 · 이미 있는 호 {{ preview?.duplicateCount ?? 0 }}권</p>
      <p v-if="err" class="error" role="alert">{{ err }}</p>
      <div class="previewActions">
        <button type="button" class="ghost compactButton" @click="reset">취소</button>
        <button type="button" class="cta compactButton" :disabled="!preview?.newCount" @click="confirmReceive">
          새 {{ preview?.newCount ?? 0 }}권 가져오기
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import { api, ApiError } from '../lib/api';
import { useShelf } from '../composables/useShelf';
import { parseIssues } from '../lib/issueParsing';
import { previewArchiveImport, type ArchivePreview } from '../lib/archivePreview';

const props = defineProps<{ readonly issues: readonly Issue[] }>();

type Mode = 'idle' | 'sent' | 'receive-input' | 'receive-preview';

const shelf = useShelf();
const mode = ref<Mode>('idle');
const busy = ref(false);
const err = ref('');
const code = ref('');
const expirySeconds = ref(0);
const codeInput = ref('');
const preview = ref<ArchivePreview | null>(null);

const expiryMinutes = computed(() => Math.max(1, Math.round(expirySeconds.value / 60)));

function reset(): void {
  mode.value = 'idle';
  busy.value = false;
  err.value = '';
  code.value = '';
  codeInput.value = '';
  preview.value = null;
}

function startReceive(): void {
  reset();
  mode.value = 'receive-input';
}

async function send(): Promise<void> {
  if (busy.value || props.issues.length === 0) return;
  busy.value = true;
  err.value = '';
  try {
    const result = await api.createMigration(props.issues);
    code.value = result.code;
    expirySeconds.value = result.expiresInSeconds;
    mode.value = 'sent';
  } catch (error) {
    err.value = error instanceof ApiError ? error.message : '이사 코드를 만들지 못했어요. 잠시 후 다시 시도해주세요.';
  } finally {
    busy.value = false;
  }
}

async function claim(): Promise<void> {
  if (busy.value || codeInput.value.length !== 6) return;
  busy.value = true;
  err.value = '';
  try {
    const result = await api.claimMigration(codeInput.value);
    const incoming = parseIssues(result.issues);
    if (incoming.length === 0) {
      err.value = '가져올 수 있는 호가 없어요.';
      return;
    }
    preview.value = previewArchiveImport(incoming, props.issues);
    mode.value = 'receive-preview';
  } catch (error) {
    err.value = error instanceof ApiError ? error.message : '코드를 받지 못했어요. 연결을 확인하고 다시 시도해주세요.';
  } finally {
    busy.value = false;
  }
}

function confirmReceive(): void {
  const accepted = preview.value?.items.filter((item) => item.disposition === 'new').map((item) => item.issue) ?? [];
  if (accepted.length === 0) return;
  if (!shelf.addMany(accepted).ok) {
    err.value = '저장 공간에 담지 못했어요. 공간을 비운 뒤 다시 시도해주세요.';
    return;
  }
  reset();
}
</script>

<style scoped>
.migrate,
.migrateChoices,
.migrateStep {
  display: grid;
  gap: 8px;
}
.formatRow {
  width: 100%;
  display: grid;
  gap: 3px;
  padding: 10px;
  border: 1px solid var(--hairline);
  background: var(--paper);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}
.formatRow:disabled {
  opacity: 0.5;
  cursor: default;
}
.formatRow b {
  font-size: 13px;
}
.formatRow span {
  color: var(--dim);
  font-size: 12px;
  line-height: 1.5;
}
.formatRow:hover:not(:disabled) b {
  color: var(--vermilion);
}
.stepTitle {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
}
.migrateCode {
  margin: 0;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--vermilion);
}
.migrateInput {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.fineprint {
  margin: 0;
  color: var(--dim);
  font-size: 12px;
}
.previewSummary {
  margin: 0;
  color: var(--dim-strong);
  font-size: 12px;
}
.previewActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.compactButton {
  width: auto;
  min-height: 40px;
  padding: 8px 12px;
  font-size: 12px;
}
</style>
