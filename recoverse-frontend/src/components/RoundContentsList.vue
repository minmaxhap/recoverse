<template>
  <section v-if="rounds.length > 0" class="contentsBlock" aria-labelledby="contentsTitle">
    <div class="contentsHead">
      <span class="eyebrow">CONTENTS</span>
      <strong id="contentsTitle">{{ rounds.length }}개 질문을 실었어요</strong>
    </div>
    <ol class="contentsList">
      <li v-for="(round, i) in rounds" :key="`${round.question}-${i}`" :class="{ editing: editingIndex === i }">
        <span class="pageNo">{{ String(i + 1).padStart(2, '0') }}</span>
        <span v-if="editingIndex !== i" class="contentText">
          <b>{{ round.question }}</b>
          <small :class="{ pending: !isAnswered(round) }">{{ answerPreview(round) }}</small>
        </span>
        <span v-else class="editFields">
          <input v-model="editQuestion" class="compactField" aria-label="질문" />
          <textarea
            v-for="name in participants"
            :key="name"
            v-model="editAnswers[name]"
            class="compactField compactArea"
            :aria-label="`${name}의 답`"
          />
        </span>
        <span v-if="editable && editingIndex !== i" class="contentsActions">
          <button type="button" aria-label="질문과 답 수정" @click="startEdit(i, round)"><Pencil :size="14" /></button>
          <button type="button" :disabled="i === 0" aria-label="질문을 위로" @click="$emit('move', i, -1)"><ArrowUp :size="14" /></button>
          <button type="button" :disabled="i === rounds.length - 1" aria-label="질문을 아래로" @click="$emit('move', i, 1)"><ArrowDown :size="14" /></button>
          <button type="button" aria-label="질문 삭제" @click="$emit('remove', i)"><Trash2 :size="14" /></button>
        </span>
        <span v-else-if="editable" class="contentsActions">
          <button type="button" :disabled="!editReady" aria-label="수정 저장" @click="saveEdit(i)"><Check :size="14" /></button>
          <button type="button" aria-label="수정 취소" @click="cancelEdit"><X :size="14" /></button>
        </span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Check, Pencil, Trash2, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { Round } from '@recoverse/shared';
import { roundIsAnswered } from '../lib/issueBuilder';

const props = defineProps<{
  rounds: Round[];
  participants: string[];
  editable?: boolean;
}>();
const emit = defineEmits<{ move: [number, -1 | 1]; remove: [number]; edit: [number, Round] }>();

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

function startEdit(index: number, round: Round): void {
  editingIndex.value = index;
  editQuestion.value = round.question;
  editAnswers.value = Object.fromEntries(props.participants.map((name) => [name, round.answers[name]?.text ?? '']));
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
  cancelEdit();
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

.contentsList li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--hairline);
}
.contentsList li.editing {
  align-items: start;
}
.contentsActions { display: flex; align-items: start; gap: 3px; }
.contentsActions button { display: grid; place-items: center; width: 25px; height: 25px; padding: 0; border: 1px solid var(--hairline); background: var(--paper-card); color: var(--dim-strong); cursor: pointer; }
.contentsActions button:hover:not(:disabled) { color: var(--vermilion); border-color: var(--vermilion); }
.contentsActions button:disabled { opacity: .35; cursor: default; }

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

.editFields {
  display: grid;
  gap: 7px;
}

.compactField {
  width: 100%;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid var(--ink);
  background: var(--paper-card);
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
}

.compactArea {
  min-height: 64px;
  resize: vertical;
}

@media (min-width: 520px) {
  .contentsHead {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: baseline;
  }

  .contentsHead strong {
    text-align: right;
  }
}
</style>
