<template>
  <HomeView>
    <!-- Current universe-home shell: map/discovery stay primary while detailed editing remains nearby for now. -->
    <section class="panel">
      <HomeHeader
        :brand-label="brandLabel"
        :title="title"
        :toolbar-labels="toolbarLabels"
        :export-disabled="capsules.length === 0"
        @export="$emit('export')"
        @import-file="$emit('import-file', $event)"
        @refresh="$emit('refresh')"
      />

      <DiscoveryCard
        :card="discoveryCard"
        :capsule-title="discoveryCapsuleTitle"
        :answer-preview="discoveryAnswerPreview"
        :labels="discoveryLabels"
        @open="$emit('open-discovery')"
      />

      <GalaxyMap
        :items="homeCapsuleItems"
        :selected-capsule-id="selectedCapsuleId"
        :labels="galaxyMapLabels"
        @select="$emit('select-capsule', $event)"
        @start-create="$emit('reset-capsule-form')"
      />

      <HomeArchiveBridge
        :count="capsules.length"
        :labels="archiveBridgeLabels"
        @open-archive="$emit('open-archive')"
      />
    </section>

    <CapsuleDetailView>
      <div class="panelHead">
        <h2 class="noWrap">{{ createCapsuleTitle }}</h2>
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
  </HomeView>
</template>

<script setup lang="ts">
import CapsuleCreateForm from "../components/CapsuleCreateForm.vue";
import CapsuleDetailEditor from "../components/CapsuleDetailEditor.vue";
import CapsuleHeroPlanet from "../components/CapsuleHeroPlanet.vue";
import CapsuleQuestionCompare from "../components/CapsuleQuestionCompare.vue";
import CapsuleSummary from "../components/CapsuleSummary.vue";
import DiscoveryCard from "../components/DiscoveryCard.vue";
import GalaxyMap from "../components/GalaxyMap.vue";
import HomeHeader from "../components/HomeHeader.vue";
import HomeArchiveBridge from "../components/HomeArchiveBridge.vue";
import type {
  AppLanguage,
  Capsule,
  CapsuleCard,
  CapsuleType,
  LocalizedCapsuleTemplate,
} from "../lib/recoverseStore";
import type { CapsuleHomeItem, CapsuleHomeStats } from "../lib/capsuleHomeData";
import CapsuleDetailView from "./CapsuleDetailView.vue";
import HomeView from "./HomeView.vue";

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

defineProps<{
  title: string;
  brandLabel: string;
  createCapsuleTitle: string;
  language: AppLanguage;
  capsules: Capsule[];
  capsuleCards: CapsuleCard[];
  filteredCapsules: Capsule[];
  homeCapsuleItems: CapsuleHomeItem[];
  selectedCapsuleId: string | null;
  selectedCapsule: Capsule | null;
  selectedCapsuleCards: CapsuleCard[];
  selectedCapsuleCard: CapsuleCard | null;
  selectedCapsuleCardId: string | null;
  recentlyEditedCapsuleCardId: string | null;
  showUnansweredCardsOnly: boolean;
  capsuleSearch: string;
  capsuleStats: Map<string, CapsuleHomeStats>;
  discoveryCard: CapsuleCard | null;
  discoveryCapsuleTitle: string;
  discoveryAnswerPreview: string;
  capsuleForm: CapsuleFormState;
  capsuleCardForm: CapsuleCardFormState;
  capsuleTemplates: LocalizedCapsuleTemplate[];
  capsuleError: string;
  capsuleNotice: string;
  typeLabels: Record<CapsuleType, string>;
  toolbarLabels: {
    exportCapsules: string;
    importCapsules: string;
    capsuleBackupVersion: string;
    refresh: string;
  };
  discoveryLabels: {
    title: string;
    empty: string;
    open: string;
  };
  galaxyMapLabels: {
    title: string;
    empty: string;
    create: string;
  };
  capsuleSummaryLabels: {
    type: string;
    description: string;
    noDescription: string;
    recentlyEdited: string;
    questions: string;
    answers: string;
  };
  capsuleListLabels: {
    searchCapsules: string;
    questions: string;
    answers: string;
    noCapsules: string;
    noSearchResults: string;
  };
  archiveBridgeLabels: {
    eyebrow: string;
    title: string;
    description: string;
    count: string;
    open: string;
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
  "update:capsuleSearch": [value: string];
  "update:showUnansweredCardsOnly": [value: boolean];
  export: [];
  "import-file": [event: Event];
  refresh: [];
  "open-discovery": [];
  "open-archive": [];
  "select-capsule": [capsuleId: string];
  "create-capsule": [];
  "reset-capsule-form": [];
  "delete-capsule": [];
  "select-card": [cardId: string];
  "add-card": [];
  "save-card": [];
  "delete-card": [];
  "open-card": [capsuleId: string, cardId: string];
}>();
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 92px);
}

.panelHead {
  padding: 12px 12px;
  border-bottom: 1px solid var(--color-soft-border);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.panelHead h2,
.panelHead span,
.panelHead label {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.panelHead h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
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

@media (max-width: 899px) {
  .panel {
    min-height: auto;
  }
}
</style>
