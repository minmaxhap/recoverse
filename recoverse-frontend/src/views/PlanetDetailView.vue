<template>
  <CapsuleDetailView>
    <div class="panelHead">
      <div>
        <span class="eyebrow">{{ text.eyebrow }}</span>
        <h2 class="noWrap">{{ selectedCapsule?.title ?? createCapsuleTitle }}</h2>
      </div>
      <button
        v-if="selectedCapsule"
        class="ghostAction"
        type="button"
        @click="$emit('create-observation')"
      >
        {{ observationLabel }}
      </button>
    </div>

    <section v-if="showCreateComposer || !selectedCapsule" class="createEntry">
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
          <button
            class="choice"
            :class="{ active: createMode === 'planet' }"
            type="button"
            @click="$emit('update:createMode', 'planet')"
          >
            {{ createEntryLabels.createPlanet }}
          </button>
          <button
            class="choice"
            :class="{ active: createMode === 'galaxy' }"
            type="button"
            @click="$emit('update:createMode', 'galaxy')"
          >
            {{ createEntryLabels.createGalaxy }}
          </button>
          <button class="ghostAction" type="button" @click="$emit('close-create-flow')">
            {{ createEntryLabels.close }}
          </button>
        </div>

        <CapsuleCreateForm
          v-if="createMode === 'planet'"
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

        <div v-else class="galaxyCreateForm">
          <div class="formGrid">
            <label class="wide">
              <span class="noWrap">{{ galaxyCreateLabels.title }}</span>
              <input v-model="galaxyForm.title" :placeholder="galaxyCreateLabels.titlePlaceholder" />
            </label>

            <label class="wide">
              <span class="noWrap">{{ galaxyCreateLabels.description }}</span>
              <input
                v-model="galaxyForm.description"
                :placeholder="galaxyCreateLabels.descriptionPlaceholder"
              />
            </label>

            <label>
              <span class="noWrap">{{ galaxyCreateLabels.theme }}</span>
              <select v-model="galaxyForm.theme">
                <option v-for="theme in galaxyThemes" :key="theme" :value="theme">
                  {{ galaxyCreateLabels.themeLabels[theme] }}
                </option>
              </select>
            </label>
          </div>

          <div class="btnRow">
            <button class="primaryAction" type="button" @click="$emit('create-galaxy')">
              {{ galaxyCreateLabels.createGalaxyButton }}
            </button>
            <button class="ghostAction" type="button" @click="$emit('reset-galaxy-form')">
              {{ galaxyCreateLabels.reset }}
            </button>
          </div>

          <p v-if="galaxyError" class="error">{{ galaxyError }}</p>
          <p v-if="galaxyNotice" class="hint">{{ galaxyNotice }}</p>
          <p class="hint">{{ galaxyCreateLabels.hint }}</p>
        </div>
      </div>
    </section>

    <template v-else>
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

      <div class="addWrap">
        <CapsuleQuestionCompare
          :capsules="capsules"
          :cards="capsuleCards"
          :language="language"
          @open-card="(capsuleId, cardId) => $emit('open-card', capsuleId, cardId)"
        />
      </div>
    </template>
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
import type { GalaxyTheme } from "../types/recoverseFuture";
import CapsuleDetailView from "./CapsuleDetailView.vue";

type CreateMode = "planet" | "galaxy";

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

type GalaxyFormState = {
  title: string;
  description: string;
  theme: GalaxyTheme;
};

const galaxyThemes: GalaxyTheme[] = [
  "year",
  "trip",
  "project",
  "relationship",
  "career",
  "custom",
];

const props = defineProps<{
  createCapsuleTitle: string;
  createMode: CreateMode;
  observationLabel: string;
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
  galaxyForm: GalaxyFormState;
  capsuleCardForm: CapsuleCardFormState;
  capsuleTemplates: LocalizedCapsuleTemplate[];
  capsuleError: string;
  capsuleNotice: string;
  galaxyError: string;
  galaxyNotice: string;
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
  galaxyCreateLabels: {
    title: string;
    titlePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    theme: string;
    themeLabels: Record<GalaxyTheme, string>;
    createGalaxyButton: string;
    reset: string;
    hint: string;
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
  "update:createMode": [value: CreateMode];
  "update:showUnansweredCardsOnly": [value: boolean];
  "back-home": [];
  "open-create-flow": [];
  "close-create-flow": [];
  "create-capsule": [];
  "create-galaxy": [];
  "create-observation": [];
  "reset-capsule-form": [];
  "reset-galaxy-form": [];
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
        backHome: "내 기억 우주로",
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
  background: rgba(20, 28, 46, 0.7);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
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
  color: var(--color-gold);
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
  white-space: nowrap;
}

.primaryAction,
.choice.active {
  border: 1px solid var(--color-primary);
  background: linear-gradient(135deg, var(--color-gold), var(--color-planet-1));
  color: var(--color-primary-contrast);
}

.choice.muted,
.ghostAction {
  border: 1px solid var(--color-border-gold);
  background: rgba(240, 192, 96, 0.08);
  color: var(--color-text);
}

.choice:not(.active),
.ghostAction {
  border: 1px solid var(--color-border-gold);
  background: rgba(240, 192, 96, 0.08);
  color: var(--color-text);
}

.galaxyCreateForm {
  padding: 12px;
  display: grid;
  gap: 10px;
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
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
}

.formGrid .wide {
  grid-column: 1 / -1;
}

input,
select {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  font: inherit;
  padding: 10px 12px;
}

.btnRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hint,
.error {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
}

.hint {
  color: var(--color-muted);
}

.error {
  color: #f2a27e;
  font-weight: 800;
}

@media (max-width: 640px) {
  .panelHead {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .panelHead > div {
    grid-column: 1 / -1;
  }

  .panelHead .ghostAction {
    width: 100%;
    min-height: 42px;
    padding: 8px 10px;
    font-size: 13px;
  }

  .formGrid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.panelHead h2,
.createEntryHead h3 {
  color: var(--color-text);
}

.createEntry,
.galaxyCreateForm {
  background: transparent;
}
</style>
