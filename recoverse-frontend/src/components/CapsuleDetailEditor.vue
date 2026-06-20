<template>
  <div v-if="!capsule" class="empty">
    {{ labels.selectCapsuleHint }}
  </div>

  <div v-else class="addWrap">
    <div class="detailBlock">
      <div class="btnRow">
        <button class="danger" type="button" @click="$emit('delete-capsule')">
          {{ labels.deleteCapsule }}
        </button>
        <label class="filterToggle">
          <input
            type="checkbox"
            :checked="showUnansweredOnly"
            @change="$emit('update:show-unanswered-only', ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ labels.unansweredOnly }}</span>
        </label>
      </div>

      <div v-if="visibleCards.length" class="chips">
        <button
          v-for="card in visibleCards"
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
import { computed } from "vue";

type CapsuleCardFormState = {
  questionText: string;
  answersText: string;
};

const props = defineProps<{
  capsule: Capsule | null;
  cards: CapsuleCard[];
  selectedCard: CapsuleCard | null;
  selectedCardId: string | null;
  recentCardId: string | null;
  showUnansweredOnly: boolean;
  cardForm: CapsuleCardFormState;
  language: AppLanguage;
  labels: {
    selectCapsuleHint: string;
    deleteCapsule: string;
    noCards: string;
    questionCard: string;
    recentlyEdited: string;
    unansweredOnly: string;
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
  "update:show-unanswered-only": [value: boolean];
}>();

const visibleCards = computed(() =>
  props.showUnansweredOnly ? props.cards.filter((card) => card.answers.length === 0) : props.cards
);
</script>

<style scoped>
.addWrap {
  padding: 12px;
  overflow: auto;
}

.detailBlock {
  display: grid;
  gap: 12px;
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
  align-items: center;
  flex-wrap: wrap;
}

.filterToggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-muted);
}

button {
  font: inherit;
  border: 1px solid var(--color-border);
  background: var(--color-paper);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: var(--color-text);
}

.primary {
  background: linear-gradient(135deg, var(--color-gold), var(--color-planet-1));
  border-color: var(--color-primary);
  color: var(--color-primary-contrast);
  font-weight: 900;
  box-shadow: 0 0 16px rgba(240, 192, 96, 0.22);
}

.ghost {
  border-color: var(--color-border-gold);
  background: rgba(240, 192, 96, 0.08);
}

.danger {
  border-color: rgba(224, 85, 85, 0.55);
  background: rgba(224, 85, 85, 0.08);
  color: #ff8f8f;
}

.chips {
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.chip {
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip.active {
  border-color: var(--color-gold);
  background: rgba(240, 192, 96, 0.14);
  color: var(--color-text);
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
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(240,192,96,0.2);
  border-radius: 20px;
  background: var(--color-surface);
}

.formGrid label {
  display: grid;
  gap: 10px;
}

.formGrid label:first-child {
  padding: 16px;
  border: 1px solid var(--color-border-gold);
  border-radius: 18px;
  background: rgba(240, 192, 96, 0.06);
}

.formGrid label span {
  font-size: 10px;
  font-weight: 900;
  color: var(--color-gold);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.formGrid .wide {
  grid-column: 1 / -1;
}

input,
textarea {
  font: inherit;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 16px;
  outline: none;
  background: rgba(255,255,255,0.04);
  color: var(--color-text);
}

input {
  font-size: 17px;
  font-weight: 800;
  line-height: 1.5;
}

input:focus,
textarea:focus {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(240, 192, 96, 0.12);
}

textarea {
  min-height: 180px;
  line-height: 1.7;
  resize: vertical;
}

.muted {
  color: var(--color-muted);
  font-size: 12px;
}

.empty {
  padding: 14px 12px;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>
