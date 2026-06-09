<template>
  <div v-if="!capsule" class="empty">
    {{ labels.selectCapsuleHint }}
  </div>

  <div v-else class="addWrap">
    <div class="detailBlock">
      <h3 class="noWrap">{{ capsule.title }}</h3>
      <CapsuleProgress :cards="cards" :language="language" />

      <div class="btnRow">
        <button class="danger" type="button" @click="$emit('delete-capsule')">
          {{ labels.deleteCapsule }}
        </button>
      </div>

      <div v-if="cards.length" class="chips">
        <button
          v-for="card in cards"
          :key="card.id"
          class="chip"
          :class="{ active: card.id === selectedCardId }"
          type="button"
          @click="$emit('select-card', card.id)"
        >
          {{ card.questionText }}
          <span v-if="card.id === recentCardId" class="chipBadge">{{ labels.recentlyEdited }}</span>
        </button>
      </div>
      <div v-else class="empty">
        {{ labels.noCards }}
      </div>

      <div class="btnRow">
        <button class="ghost" type="button" @click="$emit('add-card')">
          + {{ labels.questionCard }}
        </button>
      </div>

      <div v-if="selectedCard" class="formGrid">
        <label class="wide">
          <span class="noWrap">{{ labels.question }}</span>
          <input v-model="cardForm.questionText" :placeholder="labels.questionPlaceholder" />
        </label>

        <label class="wide">
          <span class="noWrap">{{ labels.answer }}</span>
          <textarea v-model="cardForm.answersText" rows="7" :placeholder="labels.answerPlaceholder"></textarea>
          <span v-if="selectedCard.answers.length === 0" class="muted">
            {{ labels.noSavedAnswers }}
          </span>
        </label>
      </div>

      <div v-if="selectedCard" class="btnRow">
        <button class="primary" type="button" @click="$emit('save-card')">
          {{ labels.saveQuestion }}
        </button>
        <button class="danger" type="button" @click="$emit('delete-card')">
          {{ labels.deleteQuestion }}
        </button>
      </div>

      <div v-else class="empty">
        {{ labels.selectOrAddQuestion }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppLanguage, Capsule, CapsuleCard } from "../lib/recoverseStore";
import CapsuleProgress from "./CapsuleProgress.vue";

type CapsuleCardFormState = {
  questionText: string;
  answersText: string;
};

defineProps<{
  capsule: Capsule | null;
  cards: CapsuleCard[];
  selectedCard: CapsuleCard | null;
  selectedCardId: string | null;
  recentCardId: string | null;
  cardForm: CapsuleCardFormState;
  language: AppLanguage;
  labels: {
    selectCapsuleHint: string;
    deleteCapsule: string;
    noCards: string;
    questionCard: string;
    recentlyEdited: string;
    question: string;
    questionPlaceholder: string;
    answer: string;
    answerPlaceholder: string;
    noSavedAnswers: string;
    saveQuestion: string;
    deleteQuestion: string;
    selectOrAddQuestion: string;
  };
}>();

defineEmits<{
  "delete-capsule": [];
  "select-card": [cardId: string];
  "add-card": [];
  "save-card": [];
  "delete-card": [];
}>();
</script>

<style scoped>
.addWrap {
  padding: 12px;
  overflow: auto;
}

.detailBlock {
  display: grid;
  gap: 10px;
}

h3 {
  margin: 0 0 6px;
  font-size: 13px;
}

.noWrap {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.btnRow {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

button {
  font: inherit;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: #111;
}

.primary {
  background: #111;
  border-color: #111;
  color: #fff;
}

.ghost {
  background: #fff;
}

.danger {
  border-color: #b00020;
  color: #b00020;
}

.chips {
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.chip {
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip.active {
  border-color: #111;
  background: #111;
  color: #fff;
}

.chipBadge {
  border: 1px solid currentColor;
  border-radius: 999px;
  padding: 2px 5px;
  font-size: 10px;
  opacity: 0.8;
}

.formGrid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 10px;
}

.formGrid label {
  display: grid;
  gap: 6px;
}

.formGrid label span {
  font-size: 12px;
  font-weight: 800;
  color: #374151;
}

.formGrid .wide {
  grid-column: 1 / -1;
}

input,
textarea {
  font: inherit;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
  color: #111;
}

textarea {
  resize: vertical;
}

.muted {
  color: #6b7280;
  font-size: 12px;
}

.empty {
  padding: 14px 12px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}
</style>
