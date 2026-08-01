<template>
  <section v-if="rounds.length > 0" class="contentsBlock" aria-labelledby="contentsTitle">
    <div class="contentsHead">
      <span class="eyebrow">CONTENTS</span>
      <strong id="contentsTitle">{{ progressLabel }}</strong>
    </div>
    <ol class="contentsList">
      <li
        v-for="(round, i) in rounds"
        :key="`${round.question}-${i}`"
        :ref="(el) => setRowRef(el, i)"
        :class="{ editing: editingIndex === i }"
      >
        <span class="pageNo">{{ String(i + 1).padStart(2, '0') }}</span>

        <template v-if="editingIndex !== i">
          <span class="contentText">
            <b>{{ round.question }}</b>
            <small :class="{ pending: !isAnswered(round) }">{{ answerPreview(round) }}</small>
          </span>
          <span v-if="editable" class="contentsActions">
            <button
              type="button"
              class="writeBtn"
              :class="{ pending: !isAnswered(round) }"
              @click="startEdit(i, round)"
            >
              {{ isAnswered(round) ? '고쳐 쓰기' : '답 쓰기' }}
            </button>
            <button type="button" :disabled="i === 0" aria-label="질문을 위로" @click="$emit('move', i, -1)"><ArrowUp :size="14" /></button>
            <button type="button" :disabled="i === rounds.length - 1" aria-label="질문을 아래로" @click="$emit('move', i, 1)"><ArrowDown :size="14" /></button>
            <button type="button" aria-label="질문 삭제" @click="$emit('remove', i)"><Trash2 :size="14" /></button>
          </span>
        </template>

        <!-- 답 대기 질문도 새 질문과 같은 크기의 칸에서 쓴다 — 좁은 인라인 칸으로 밀어내지 않는다. -->
        <form v-else class="editPanel" @submit.prevent="saveEdit(i)">
          <label class="fieldGroup">
            <span class="fieldLabel">질문</span>
            <input v-model="editQuestion" class="field" />
          </label>
          <label v-for="name in participants" :key="name" class="fieldGroup">
            <span class="fieldLabel">{{ name }}의 답</span>
            <textarea
              :ref="(el) => setAnswerRef(el, name)"
              v-model="editAnswers[name]"
              class="field area short"
              :placeholder="`${name}의 답을 거칠게 적어도 괜찮아요`"
            />
          </label>
          <div class="editActions">
            <button type="submit" class="saveEdit" :disabled="!editReady">답 저장</button>
            <button type="button" class="cancelEdit" @click="cancelEdit">취소</button>
          </div>
        </form>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-vue-next';
import { computed, nextTick, ref } from 'vue';
import type { Round } from '@recoverse/shared';
import { roundIsAnswered } from '../lib/issueBuilder';

const props = defineProps<{
  rounds: Round[];
  participants: string[];
  editable?: boolean;
}>();
const emit = defineEmits<{ move: [number, -1 | 1]; remove: [number]; edit: [number, Round] }>();

// 세트를 깔면 목차가 "할 일 목록"이 된다 — 몇 개를 채웠는지 세지 않아도 보이게.
const answeredCount = computed(() => props.rounds.filter(roundIsAnswered).length);
const progressLabel = computed(() =>
  answeredCount.value === props.rounds.length
    ? `${props.rounds.length}개 질문을 실었어요`
    : `질문 ${props.rounds.length}개 중 ${answeredCount.value}개 답했어요`,
);

const rowEls = new Map<number, HTMLElement>();
const editingIndex = ref<number | null>(null);
const editQuestion = ref('');
const editAnswers = ref<Record<string, string>>({});
const editReady = computed(
  () => editQuestion.value.trim().length > 0 && props.participants.every((name) => (editAnswers.value[name] ?? '').trim().length > 0),
);

function isAnswered(round: Round): boolean {
  return roundIsAnswered(round);
}

function answerPreview(round: Round): string {
  const fromParticipants = props.participants
    .map((name) => round.answers[name]?.text?.trim() ?? '')
    .find((text) => text.length > 0);
  const text =
    fromParticipants ??
    Object.values(round.answers)
      .map((answer) => answer.text.trim())
      .find((value) => value.length > 0) ??
    '';
  if (!text) return '답 대기';
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}

const answerRefs = new Map<string, HTMLTextAreaElement>();

function setAnswerRef(el: unknown, name: string): void {
  if (el instanceof HTMLTextAreaElement) answerRefs.set(name, el);
  else answerRefs.delete(name);
}

function setRowRef(el: unknown, index: number): void {
  if (el instanceof HTMLElement) rowEls.set(index, el);
  else rowEls.delete(index);
}

/** 아직 답이 없는 다음 줄. 없으면 -1. */
function nextWaitingIndex(after: number): number {
  return props.rounds.findIndex((round, index) => index > after && !roundIsAnswered(round));
}

/** 밖에서(예: 대기 안내 줄) 이 줄부터 쓰게 열어준다. */
function openRound(index: number): void {
  const round = props.rounds[index];
  if (!round) return;
  startEdit(index, round);
  void nextTick(() => rowEls.get(index)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
}

defineExpose({ openRound });

function startEdit(index: number, round: Round): void {
  editingIndex.value = index;
  editQuestion.value = round.question;
  editAnswers.value = Object.fromEntries(props.participants.map((name) => [name, round.answers[name]?.text ?? '']));
  // 답 쓰기를 눌렀으면 쓸 칸에 바로 커서를 둔다 — 한 번 더 탭하지 않게.
  const first = props.participants[0];
  if (first) void nextTick(() => answerRefs.get(first)?.focus());
}

function cancelEdit(): void {
  editingIndex.value = null;
  editQuestion.value = '';
  editAnswers.value = {};
}

function saveEdit(index: number): void {
  const current = props.rounds[index];
  if (!current || !editReady.value) return;

  const answers: Round['answers'] = { ...current.answers };
  for (const name of props.participants) {
    answers[name] = { ...answers[name], text: (editAnswers.value[name] ?? '').trim() };
  }
  emit('edit', index, { ...current, question: editQuestion.value.trim(), answers });

  // 답 대기가 더 남았으면 그 줄을 바로 열어준다 — 세트로 깐 질문을 한 줄씩 이어서 채우게.
  const next = nextWaitingIndex(index);
  if (next === -1) {
    cancelEdit();
    return;
  }
  openRound(next);
}
</script>

<style scoped>
.contentsBlock {
  display: grid;
  gap: 10px;
  padding: 14px 0 0;
  border-top: 3px solid var(--ink);
}

.contentsHead {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.contentsHead strong {
  font-size: 13px;
  color: var(--dim-strong);
  min-width: 0;
  overflow-wrap: anywhere;
}

.contentsList {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--hairline);
}

/* 좁은 화면에선 질문이 한 줄을 다 쓰고 조작 버튼이 그 아래로 내려간다. */
.contentsList li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--hairline);
  align-items: start;
}

.contentsActions {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.contentsActions button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--hairline);
  background: var(--paper-card);
  color: var(--dim-strong);
  cursor: pointer;
}
.contentsActions button:hover:not(:disabled) { color: var(--vermilion); border-color: var(--vermilion); }
.contentsActions button:disabled { opacity: .35; cursor: default; }

/* 손가락으로 쓰는 기기에선 최소 40px — 목차 줄의 작은 아이콘까지. */
@media (hover: none) {
  .contentsActions button {
    width: 40px;
    height: 40px;
  }

  .contentsActions .writeBtn {
    width: auto;
    height: 40px;
  }
}

/* 답 쓰기는 이 줄의 주된 행동 — 아이콘이 아니라 말로 적는다. */
.contentsActions .writeBtn {
  width: auto;
  height: 34px;
  padding: 0 13px;
  margin-right: 2px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--dim-strong);
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.contentsActions .writeBtn.pending {
  border-color: var(--vermilion);
  color: var(--vermilion);
}

.contentsActions .writeBtn:hover {
  background: var(--vermilion);
  border-color: var(--vermilion);
  color: var(--vermilion-ink);
}

.pageNo {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--hairline);
}

.contentText {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.contentText b {
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.contentText small {
  color: var(--dim);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.contentText small.pending {
  color: var(--vermilion);
  font-weight: 800;
}

/* 쓰는 동안엔 이 줄이 작업면이 된다 — 새 질문 박스와 같은 크기의 칸. */
.editPanel {
  grid-column: 2;
  min-width: 0;
  display: grid;
  gap: 12px;
  padding: 2px 0 6px;
}

.editActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.saveEdit {
  padding: 10px 15px;
  font-size: 13px;
  font-weight: 800;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--ink);
  cursor: pointer;
}

.saveEdit:hover:not(:disabled) {
  background: var(--ink-hover);
}

.saveEdit:disabled {
  background: none;
  border-color: var(--hairline);
  color: var(--dim);
  cursor: default;
}

.cancelEdit {
  background: none;
  border: none;
  /* 손가락으로 누를 만한 높이 — 취소도 저장만큼 자주 쓴다. */
  padding: 11px 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--dim-strong);
  text-decoration: underline;
  cursor: pointer;
}

.cancelEdit:hover {
  color: var(--vermilion);
}

@media (min-width: 520px) {
  .contentsHead {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: baseline;
  }

  .contentsHead strong {
    text-align: right;
  }

  .contentsList li {
    grid-template-columns: 34px minmax(0, 1fr) auto;
  }

  .contentsList li:not(.editing) .contentsActions {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
  }
}
</style>
