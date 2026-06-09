<template>
  <CapsuleDetailView>
    <div class="panelHead">
      <div>
        <span class="eyebrow">{{ text.eyebrow }}</span>
        <h2 class="noWrap">{{ selectedCapsule?.title ?? createCapsuleTitle }}</h2>
      </div>
      <button class="ghostAction" type="button" @click="$emit('back-home')">
        {{ text.backHome }}
      </button>
    </div>

    <section class="createEntry">
      <div class="createEntryHead">
        <span class="eyebrow">{{ createEntryLabels.eyebrow }}</span>
        <h3>{{ createEntryLabels.title }}</h3>
        <p>{{ createEntryLabels.description }}</p>
      </div>

      <div v-if="!showCreateComposer" class="createEntryActions">
        <button class="primaryAction" type="button" @click="$emit('open-create-flow')">
          {{ createEntryLabels.open }}
        </button>
      </div>

      <div v-else class="createComposer">
        <div class="createChoiceRow">
          <button class="choice active" type="button">
            {{ createEntryLabels.createPlanet }}
          </button>
          <button class="choice muted" type="button" disabled>
            {{ createEntryLabels.createGalaxy }}
          </button>
          <button class="ghostAction" type="button" @click="$emit('close-create-flow')">
            {{ createEntryLabels.close }}
          </button>
        </div>

        <CapsuleCreateForm
          :form="capsuleForm"
          :templates="capsuleTemplates"
          :language="language"
          :type-labels="typeLabels"
          :labels="capsuleCreateLabels"
          :error="capsuleError"
          :notice="capsuleNotice"
          @create="$emit('create-capsule')"
          @reset="$emit('reset-capsule-form')"
        />
      </div>
    </section>

    <div class="divider"></div>

    <CapsuleHeroPlanet
      :capsule="selectedCapsule"
      :stats="selectedCapsule ? capsuleStats.get(selectedCapsule.id) : undefined"
      :type-label="selectedCapsule ? typeLabels[selectedCapsule.type] : ''"
    />

    <CapsuleSummary
      :capsule="selectedCapsule"
      :stats="selectedCapsule ? capsuleStats.get(selectedCapsule.id) : undefined"
      :type-label="selectedCapsule ? typeLabels[selectedCapsule.type] : ''"
      :language="language"
      :labels="capsuleSummaryLabels"
    />

    <CapsuleDetailEditor
      :capsule="selectedCapsule"
      :cards="selectedCapsuleCards"
      :selected-card="selectedCapsuleCard"
      :selected-card-id="selectedCapsuleCardId"
      :recent-card-id="recentlyEditedCapsuleCardId"
      :show-unanswered-only="showUnansweredCardsOnly"
      :card-form="capsuleCardForm"
      :language="language"
      :labels="capsuleDetailLabels"
      @update:show-unanswered-only="$emit('update:showUnansweredCardsOnly', $event)"
      @delete-capsule="$emit('delete-capsule')"
      @select-card="$emit('select-card', $event)"
      @add-card="$emit('add-card')"
      @save-card="$emit('save-card')"
      @delete-card="$emit('delete-card')"
    />

    <div class="divider"></div>

    <div class="addWrap">
      <CapsuleQuestionCompare
        :capsules="capsules"
        :cards="capsuleCards"
        :language="language"
        @open-card="(capsuleId, cardId) => $emit('open-card', capsuleId, cardId)"
      />
    </div>
  </CapsuleDetailView>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CapsuleCreateForm from "../components/CapsuleCreateForm.vue";
import CapsuleDetailEditor from "../components/CapsuleDetailEditor.vue";
import CapsuleHeroPlanet from "../components/CapsuleHeroPlanet.vue";
import CapsuleQuestionCompare from "../components/CapsuleQuestionCompare.vue";
import CapsuleSummary from "../components/CapsuleSummary.vue";
import type {
  AppLanguage,
  Capsule,
  CapsuleCard,
  CapsuleType,
  LocalizedCapsuleTemplate,
} from "../lib/recoverseStore";
import type { CapsuleHomeStats } from "../lib/capsuleHomeData";
import CapsuleDetailView from "./CapsuleDetailView.vue";

type CapsuleFormState = {
  title: string;
  description: string;
  type: CapsuleType;
  templateId: string;
};

type CapsuleCardFormState = {
  questionText: string;
  answersText: string;
};

const props = defineProps<{
  createCapsuleTitle: string;
  showCreateComposer: boolean;
  language: AppLanguage;
  capsules: Capsule[];
  capsuleCards: CapsuleCard[];
  selectedCapsule: Capsule | null;
  selectedCapsuleCards: CapsuleCard[];
  selectedCapsuleCard: CapsuleCard | null;
  selectedCapsuleCardId: string | null;
  recentlyEditedCapsuleCardId: string | null;
  showUnansweredCardsOnly: boolean;
  capsuleStats: Map<string, CapsuleHomeStats>;
  capsuleForm: CapsuleFormState;
  capsuleCardForm: CapsuleCardFormState;
  capsuleTemplates: LocalizedCapsuleTemplate[];
  capsuleError: string;
  capsuleNotice: string;
  typeLabels: Record<CapsuleType, string>;
  createEntryLabels: {
    eyebrow: string;
    title: string;
    description: string;
    open: string;
    createPlanet: string;
    createGalaxy: string;
    close: string;
  };
  capsuleCreateLabels: {
    title: string;
    titlePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    type: string;
    defaultQuestions: string;
    none: string;
    createCapsuleButton: string;
    reset: string;
    templateHint: string;
  };
  capsuleSummaryLabels: {
    type: string;
    description: string;
    noDescription: string;
    recentlyEdited: string;
    questions: string;
    answers: string;
  };
  capsuleDetailLabels: {
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
  "update:showUnansweredCardsOnly": [value: boolean];
  "back-home": [];
  "open-create-flow": [];
  "close-create-flow": [];
  "create-capsule": [];
  "reset-capsule-form": [];
  "delete-capsule": [];
  "select-card": [cardId: string];
  "add-card": [];
  "save-card": [];
  "delete-card": [];
  "open-card": [capsuleId: string, cardId: string];
}>();

const text = computed(() =>
  props.language === "ko"
    ? {
        eyebrow: "기억 행성",
        backHome: "우주로",
      }
    : {
        eyebrow: "Memory Planet",
        backHome: "Universe",
      }
);
</script>

<style scoped>
.panelHead {
  padding: 12px 12px;
  border-bottom: 1px solid var(--color-soft-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.panelHead h2 {
  margin: 2px 0 0;
  font-size: 16px;
  font-weight: 900;
  min-width: 0;
}

.noWrap {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.divider {
  height: 1px;
  background: var(--color-soft-border);
  margin: 14px 0;
}

.addWrap {
  padding: 12px;
  overflow: auto;
}

.createEntry {
  padding: 12px;
  display: grid;
  gap: 12px;
}

.createEntryHead {
  display: grid;
  gap: 4px;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.createEntryHead h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 15px;
  font-weight: 900;
}

.createEntryHead p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.createEntryActions,
.createComposer {
  display: grid;
  gap: 12px;
}

.createChoiceRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.primaryAction,
.choice,
.ghostAction {
  font: inherit;
  border-radius: 999px;
  padding: 9px 12px;
  cursor: pointer;
}

.primaryAction,
.choice.active {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.choice.muted,
.ghostAction {
  border: 1px solid var(--color-border);
  background: var(--color-paper);
  color: var(--color-ink);
}

.choice.muted[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
