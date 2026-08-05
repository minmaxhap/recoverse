<template>
  <div class="setManager">
    <!-- 세트를 짜는 동안에는 목록을 접어둔다 — 한 화면에 두 가지 일을 겹치지 않게. -->
    <form v-if="editing" class="setEditor" @submit.prevent="saveSet">
      <span class="eyebrow red">{{ editingId ? '세트 고치기' : '새 질문 세트' }}</span>

      <label class="fieldGroup">
        <span class="fieldLabel">세트 이름</span>
        <input ref="nameEl" v-model="setName" class="field" :placeholder="defaultName" />
      </label>

      <ol class="qEditList">
        <li v-for="(_, index) in draftQuestions" :key="index">
          <span class="qNo">{{ String(index + 1).padStart(2, '0') }}</span>
          <input
            v-model="draftQuestions[index]"
            class="field"
            :aria-label="`질문 ${index + 1}`"
            placeholder="이 세트로 물을 질문"
          />
          <span class="qActions">
            <button
              type="button"
              :disabled="index === 0"
              :aria-label="`질문 ${index + 1} 위로`"
              @click="moveQuestion(index, -1)"
            >
              <ArrowUp :size="14" />
            </button>
            <button
              type="button"
              :disabled="index === draftQuestions.length - 1"
              :aria-label="`질문 ${index + 1} 아래로`"
              @click="moveQuestion(index, 1)"
            >
              <ArrowDown :size="14" />
            </button>
            <button
              type="button"
              class="qDrop"
              :disabled="draftQuestions.length === 1"
              :aria-label="`질문 ${index + 1} 빼기`"
              @click="dropQuestion(index)"
            >
              ✕
            </button>
          </span>
        </li>
      </ol>

      <button type="button" class="linkBtn" @click="addQuestion">＋ 질문 추가</button>

      <!-- 백지에 다 타이핑하게 두지 않는다 — 이미 있는 질문에서 골라 담는 길을 옆에 둔다. -->
      <div class="questionSources">
        <QuestionSuggest
          kind="free"
          destination="세트"
          :exclude="draftQuestions"
          @pick="appendQuestion"
          @pick-all="appendQuestions"
        />
        <PastQuestionPick v-if="issues.length > 0" :issues="issues" :exclude="draftQuestions" @pick="appendQuestion" />
      </div>

      <div class="saveActions">
        <button type="submit" class="saveBtn" :disabled="!canSave">세트 저장</button>
        <!-- 원본은 두고 변형을 만들 때 — 이름이 겹치면 '사본'을 붙여 따로 남긴다. -->
        <button v-if="editingId" type="button" class="copyBtn" :disabled="!canSave" @click="saveCopy">
          사본으로 저장
        </button>
        <button type="button" class="linkBtn" @click="editing = false">취소</button>
      </div>
      <p v-if="saveNotice" class="helper" role="status">{{ saveNotice }}</p>
    </form>

    <template v-else>
      <div v-if="sets.length > 0" class="rows">
        <div v-for="set in sets" :key="set.id" class="rowWrap">
          <template v-if="pendingDeleteId === set.id">
            <p class="confirm">
              <span>‘{{ set.name }}’ 세트를 지울까요?</span>
              <button type="button" class="confirmYes" @click="confirmDelete(set.id)">지우기</button>
              <button type="button" class="confirmNo" @click="pendingDeleteId = ''">취소</button>
            </p>
          </template>
          <template v-else>
            <button type="button" class="setRow savedRow" @click="editSet(set)">
              <span class="rowTitle">{{ set.name }}</span>
              <span class="rowMeta">질문 {{ set.questions.length }}개 · {{ preview(set) }}</span>
            </button>
            <button type="button" class="rowDelete" :aria-label="`${set.name} 세트 지우기`" @click="pendingDeleteId = set.id">
              ✕
            </button>
          </template>
        </div>
      </div>

      <p v-else class="helper empty">
        아직 만든 세트가 없어요. 자주 쓰는 질문을 세트로 묶어두면, 다음 호를 그 구성으로 열 수 있어요.
      </p>

      <button type="button" class="newSetBtn" @click="newSet">＋ 새 질문 세트 만들기</button>

      <section class="starter">
        <span class="eyebrow">추천 세트로 시작하기</span>
        <div class="rows">
          <button v-for="preset in STARTER_SETS" :key="preset.id" type="button" class="setRow presetRow" @click="startFromPreset(preset)">
            <span class="rowTitle">{{ preset.name }}</span>
            <span class="rowMeta">{{ preset.note }} · {{ preset.questions[0] }}</span>
          </button>
        </div>
      </section>

      <!-- 빈손보다 사본이 쉽다 — 지난 호 구성을 그대로 열어 고쳐 쓰게 한다. -->
      <section v-if="issues.length > 0" class="starter">
        <span class="eyebrow">지난 호에서 시작하기</span>
        <div class="rows">
          <button v-for="issue in starterIssues" :key="issue.id" type="button" class="setRow issueRow" @click="startFromIssue(issue)">
            <span class="rowTitle">{{ issue.title }}</span>
            <span class="rowMeta">질문 {{ issue.rounds.length }}개를 옮겨 담고 고치기</span>
          </button>
        </div>
      </section>
      <p v-if="saveNotice" class="helper" role="status">{{ saveNotice }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp } from 'lucide-vue-next';
import { computed, nextTick, ref } from 'vue';
import type { Issue } from '@recoverse/shared';
import PastQuestionPick from './PastQuestionPick.vue';
import QuestionSuggest from './QuestionSuggest.vue';
import { STARTER_SETS, type StarterSet } from '../data/starterSets';
import { useQuestionSets, type QuestionSet } from '../composables/useQuestionSets';

const props = withDefaults(
  defineProps<{ readonly defaultName?: string; readonly issues?: readonly Issue[] }>(),
  { defaultName: '내 질문 세트', issues: () => [] },
);

/** 시작점으로 권할 만큼만 — 나머지는 혼자 쓰기에서 그대로 불러오면 된다. */
const starterIssues = computed(() => props.issues.slice(0, 3));

const questionSets = useQuestionSets();
const sets = questionSets.sets;
const pendingDeleteId = ref('');
const saveNotice = ref('');
const nameEl = ref<HTMLInputElement | null>(null);

const editing = ref(false);
const editingId = ref('');
const setName = ref('');
const draftQuestions = ref<string[]>(['']);

const canSave = computed(() => draftQuestions.value.some((question) => question.trim().length > 0));

function preview(set: QuestionSet): string {
  const first = set.questions[0] ?? '';
  return first.length > 22 ? `${first.slice(0, 22)}…` : first;
}

function openEditor(name: string, questions: string[], id = ''): void {
  editing.value = true;
  editingId.value = id;
  setName.value = name;
  draftQuestions.value = questions.length > 0 ? [...questions] : [''];
  saveNotice.value = '';
  void nextTick(() => nameEl.value?.focus());
}

function newSet(): void {
  openEditor('', ['']);
}

function editSet(set: QuestionSet): void {
  openEditor(set.name, [...set.questions], set.id);
}

function newSetFrom(name: string, questions: string[]): void {
  openEditor(name, questions.length > 0 ? questions : ['']);
}

function startFromPreset(preset: StarterSet): void {
  newSetFrom(preset.name, [...preset.questions]);
}

function startFromIssue(issue: Issue): void {
  newSetFrom(
    issue.title,
    issue.rounds.map((round) => round.question.trim()).filter(Boolean),
  );
}

function addQuestion(): void {
  draftQuestions.value = [...draftQuestions.value, ''];
}

/** 고른 질문은 빈 줄이 있으면 그 자리에, 없으면 맨 끝에 붙는다. 이미 있는 질문은 건너뛴다. */
function appendQuestion(question: string): void {
  const trimmed = question.trim();
  if (!trimmed) return;
  const rows = [...draftQuestions.value];
  if (rows.some((row) => row.trim() === trimmed)) return;
  const lastIndex = rows.length - 1;
  if (lastIndex >= 0 && rows[lastIndex].trim() === '') rows[lastIndex] = trimmed;
  else rows.push(trimmed);
  draftQuestions.value = rows;
}

function appendQuestions(questions: readonly string[]): void {
  for (const question of questions) appendQuestion(question);
}

function dropQuestion(index: number): void {
  if (draftQuestions.value.length === 1) return;
  draftQuestions.value = draftQuestions.value.filter((_, itemIndex) => itemIndex !== index);
}

function moveQuestion(index: number, direction: -1 | 1): void {
  const target = index + direction;
  const next = [...draftQuestions.value];
  const current = next[index];
  const swapped = next[target];
  if (current === undefined || swapped === undefined) return;
  next[index] = swapped;
  next[target] = current;
  draftQuestions.value = next;
}

/** 이미 쓰이는 이름이면 '사본', '사본 2'… 로 비켜 준다. */
function freeName(base: string): string {
  const taken = new Set(sets.value.map((set) => set.name));
  if (!taken.has(base)) return base;
  let candidate = `${base} 사본`;
  for (let n = 2; taken.has(candidate); n += 1) candidate = `${base} 사본 ${n}`;
  return candidate;
}

function saveCopy(): void {
  if (!canSave.value) return;
  const name = freeName(setName.value.trim() || props.defaultName);
  if (!questionSets.save(name, draftQuestions.value)) {
    saveNotice.value = '세트를 저장하지 못했어요. 브라우저 저장 공간을 비우고 다시 시도해주세요.';
    return;
  }
  editing.value = false;
  saveNotice.value = `‘${name}’ 세트를 따로 만들었어요.`;
}

function saveSet(): void {
  if (!canSave.value) return;
  const name = setName.value.trim() || props.defaultName;
  if (!questionSets.save(name, draftQuestions.value, editingId.value || undefined)) {
    saveNotice.value = '세트를 저장하지 못했어요. 브라우저 저장 공간을 비우고 다시 시도해주세요.';
    return;
  }
  editing.value = false;
  saveNotice.value = `‘${name}’ 세트로 저장했어요.`;
}

function confirmDelete(id: string): void {
  questionSets.remove(id);
  pendingDeleteId.value = '';
}
</script>

<style scoped>
.setManager {
  display: grid;
  gap: 16px;
}

.rows {
  display: grid;
  border-top: 1px solid var(--hairline);
}

.rowWrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  border-bottom: 1px solid var(--hairline);
}

.setRow {
  display: grid;
  gap: 3px;
  text-align: left;
  padding: 13px 12px;
  background: var(--paper-card);
  border: none;
  cursor: pointer;
  color: inherit;
  font-family: inherit;
  transition: background 0.12s ease, color 0.12s ease;
}

.setRow:hover {
  background: var(--paper);
  color: var(--vermilion);
}

.rowTitle {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
}

.rowMeta {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dim);
  overflow-wrap: anywhere;
}

.rowDelete {
  min-width: 44px;
  padding: 0 12px;
  background: var(--paper-card);
  border: none;
  color: var(--dim);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.12s ease;
}

.rowDelete:hover {
  color: var(--vermilion);
}

.confirm {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 13px 12px;
  background: var(--paper-card);
  font-size: 13px;
  color: var(--dim-strong);
}

.confirmYes,
.confirmNo {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  text-decoration: underline;
}

.confirmYes {
  color: var(--vermilion);
}

.confirmNo {
  color: var(--dim);
}

.empty {
  margin: 0;
}

.newSetBtn {
  justify-self: start;
  padding: 11px 15px;
  font-size: 13px;
  font-weight: 800;
  background: none;
  border: 1px solid var(--ink);
  color: var(--ink);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.newSetBtn:hover {
  background: var(--ink);
  color: var(--paper);
}

/* 세트 편집기 — 번호 붙은 질문 줄을 늘였다 줄였다, 위아래로 옮긴다. */
.setEditor {
  display: grid;
  gap: 12px;
}

.qEditList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.qEditList li {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  align-items: center;
  gap: 4px 8px;
}

.qNo {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--dim);
}

.qActions {
  grid-column: 2;
  display: flex;
  gap: 6px;
}

.qActions button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: none;
  border: 1px solid var(--hairline);
  color: var(--dim-strong);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.12s ease, border-color 0.12s ease;
}

.qActions button:hover:not(:disabled) {
  color: var(--vermilion);
  border-color: var(--vermilion);
}

.qActions button:disabled {
  opacity: 0.35;
  cursor: default;
}

@media (hover: none) {
  .qActions button {
    width: 40px;
    height: 40px;
  }
}

/* 닫혀 있을 땐 링크 두 개가 한 줄에, 펼쳐지면 그 패널이 한 줄을 다 쓴다. */
.questionSources {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 4px 18px;
}

.questionSources > :deep(.open) {
  flex: 1 0 100%;
}

.starter {
  display: grid;
  gap: 6px;
  border-top: 1px solid var(--hairline);
  padding-top: 14px;
}

.saveActions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.saveBtn {
  padding: 11px 15px;
  font-size: 13px;
  font-weight: 800;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--ink);
  cursor: pointer;
}

.saveBtn:hover:not(:disabled) {
  background: var(--ink-hover);
}

.saveBtn:disabled {
  background: none;
  border-color: var(--hairline);
  color: var(--dim);
  cursor: default;
}

.copyBtn {
  padding: 11px 15px;
  background: none;
  border: 1px solid var(--ink);
  color: var(--ink);
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.copyBtn:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.copyBtn:disabled {
  border-color: var(--hairline);
  color: var(--dim);
  cursor: default;
}

.linkBtn {
  justify-self: start;
  padding: 6px 2px;
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

@media (min-width: 520px) {
  .qEditList li {
    grid-template-columns: 26px minmax(0, 1fr) auto;
  }

  .qActions {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
