<template>
  <div class="setPicker">
    <section v-if="sets.length > 0" class="setGroup">
      <span class="eyebrow">내가 만든 세트</span>
      <div class="rows">
        <button v-for="set in sets" :key="set.id" type="button" class="setRow" @click="loadQuestions(set.questions)">
          <span class="rowTitle">{{ set.name }}</span>
          <span class="rowMeta">질문 {{ set.questions.length }}개</span>
        </button>
      </div>
    </section>

    <section v-if="issues.length > 0" class="setGroup">
      <span class="eyebrow">지난 호 구성 그대로</span>
      <div class="rows">
        <button
          v-for="issue in visibleIssues"
          :key="issue.id"
          type="button"
          class="setRow issueRow"
          :class="{ active: issue.id === sourceIssueId }"
          @click="loadIssue(issue)"
        >
          <span class="rowTitle">{{ issue.title }}</span>
          <span class="rowMeta">
            {{ KIND_LABELS[issue.kind] }} · {{ issue.date.slice(0, 4) }} · 질문 {{ issue.rounds.length }}개
          </span>
        </button>
      </div>
      <button v-if="hiddenCount > 0" type="button" class="linkBtn" @click="showAllIssues = true">
        지난 호 {{ hiddenCount }}권 더 보기
      </button>
    </section>

    <p v-if="sets.length === 0 && issues.length === 0" class="helper">
      아직 불러올 세트가 없어요. 자주 쓰는 질문을 세트로 묶어두면 다음 호를 그 구성으로 열 수 있어요.
    </p>

    <!-- 만들고 고치는 일은 이 화면의 일이 아니다 — 전용 화면으로 보낸다. -->
    <div class="manageRow">
      <button v-if="contents.length > 0" type="button" class="linkBtn" @click="startSaving">
        지금 목차 {{ contents.length }}개 질문을 세트로 저장
      </button>
      <button type="button" class="linkBtn" @click="$emit('manage')">질문 세트 만들기 · 정리하기 →</button>
    </div>

    <form v-if="saving" class="saveForm" @submit.prevent="saveSet">
      <label class="fieldGroup">
        <span class="fieldLabel">세트 이름</span>
        <input ref="nameEl" v-model="setName" class="field" :placeholder="defaultName" />
      </label>
      <div class="saveActions">
        <button type="submit" class="saveBtn">저장</button>
        <button type="button" class="linkBtn" @click="saving = false">취소</button>
      </div>
    </form>

    <p v-if="saveNotice" class="helper" role="status">{{ saveNotice }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { KIND_LABELS, type Issue } from '@recoverse/shared';
import { useQuestionSets } from '../composables/useQuestionSets';

interface LoadedQuestion {
  question: string;
  format?: string;
}

const props = defineProps<{
  readonly issues: readonly Issue[];
  /** 지금 목차에 실린 질문 — 그대로 세트로 묶을 재료. */
  readonly contents: readonly string[];
  /** 마지막으로 질문을 가져온 호 — 어디서 가져왔는지 표시만 한다. */
  readonly sourceIssueId: string;
  readonly defaultName: string;
}>();
const emit = defineEmits<{
  load: [LoadedQuestion[]];
  'update:sourceIssueId': [string];
  manage: [];
}>();

/** 책장이 길어도 이 블록이 화면을 삼키지 않게 — 나머지는 펼쳐서 본다. */
const INITIAL_ISSUES = 4;

const questionSets = useQuestionSets();
const sets = questionSets.sets;
const showAllIssues = ref(false);
const saving = ref(false);
const setName = ref('');
const saveNotice = ref('');
const nameEl = ref<HTMLInputElement | null>(null);

const visibleIssues = computed(() => (showAllIssues.value ? props.issues : props.issues.slice(0, INITIAL_ISSUES)));
const hiddenCount = computed(() => (showAllIssues.value ? 0 : Math.max(0, props.issues.length - INITIAL_ISSUES)));

function loadQuestions(questions: readonly string[]): void {
  emit(
    'load',
    questions.map((question) => ({ question })),
  );
}

// 지난 호는 포맷까지 그대로 따라온다 — 같은 구성으로 다시 쓰는 게 목적이라서.
function loadIssue(issue: Issue): void {
  emit('update:sourceIssueId', issue.id);
  emit(
    'load',
    issue.rounds.map((round) => (round.format ? { question: round.question, format: round.format } : { question: round.question })),
  );
}

function startSaving(): void {
  saving.value = true;
  setName.value = '';
  saveNotice.value = '';
  void nextTick(() => nameEl.value?.focus());
}

function saveSet(): void {
  const name = setName.value.trim() || props.defaultName;
  if (!questionSets.save(name, props.contents)) {
    saveNotice.value = '세트를 저장하지 못했어요. 브라우저 저장 공간을 비우고 다시 시도해주세요.';
    return;
  }
  saving.value = false;
  saveNotice.value = `‘${name}’ 세트로 저장했어요. 질문을 다듬으려면 세트 정리하기에서 고칠 수 있어요.`;
}
</script>

<style scoped>
.setPicker {
  display: grid;
  gap: 16px;
}

.setGroup {
  display: grid;
  gap: 6px;
}

.rows {
  display: grid;
  border-top: 1px solid var(--hairline);
}

.setRow {
  display: grid;
  gap: 3px;
  text-align: left;
  padding: 11px 12px;
  background: var(--paper-card);
  border: none;
  border-bottom: 1px solid var(--hairline);
  cursor: pointer;
  color: inherit;
  font-family: inherit;
  transition: background 0.12s ease, color 0.12s ease;
}

.setRow:hover {
  background: var(--paper);
  color: var(--vermilion);
}

/* 마지막으로 가져온 호에만 얇은 표시 — 고르는 상태가 아니라 자국이다. */
.issueRow.active {
  box-shadow: inset 3px 0 0 var(--vermilion);
}

.rowTitle {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.rowMeta {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dim);
}

.manageRow {
  display: grid;
  justify-items: start;
  gap: 8px;
  border-top: 1px solid var(--hairline);
  padding-top: 12px;
}

.linkBtn {
  justify-self: start;
  padding: 2px 0;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 700;
  color: var(--dim-strong);
  text-decoration: underline;
  cursor: pointer;
}

.linkBtn:hover {
  color: var(--vermilion);
}

.saveForm {
  display: grid;
  gap: 10px;
}

.saveActions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.saveBtn {
  padding: 10px 15px;
  font-size: 13px;
  font-weight: 800;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--ink);
  cursor: pointer;
}

.saveBtn:hover {
  background: var(--ink-hover);
}
</style>
