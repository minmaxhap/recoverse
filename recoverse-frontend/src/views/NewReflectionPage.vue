<template>
  <section class="reflectionPage">
    <header class="reflectionHeader">
      <div>
        <span class="eyebrow">새 회고</span>
        <h1>무엇을 돌아볼까요?</h1>
      </div>
    </header>

    <main class="newFlow">
      <section class="stepPanel">
        <div class="stepHead">
          <span class="stepIndex">1</span>
          <div>
            <h2>회고 유형</h2>
            <p>연말이 아니어도, 지나간 시기를 하나 고르면 됩니다.</p>
          </div>
        </div>

        <div class="optionGrid">
          <button
            v-for="template in templates"
            :key="template.id"
            class="optionCard"
            :class="{ selected: template.id === selectedTemplateId }"
            type="button"
            @click="selectTemplate(template.id)"
          >
            <strong>{{ template.label }}</strong>
            <span>{{ template.periodPlaceholder }}처럼 작성</span>
          </button>
        </div>
      </section>

      <section class="stepPanel">
        <div class="stepHead">
          <span class="stepIndex">2</span>
          <div>
            <h2>기간</h2>
            <p>제목은 기간과 유형으로 자동 생성됩니다.</p>
          </div>
        </div>

        <label class="field">
          <span>언제를 돌아볼까요?</span>
          <input v-model="periodLabel" :placeholder="selectedTemplate?.periodPlaceholder ?? '2025년'" />
        </label>
      </section>

      <section class="stepPanel">
        <div class="stepHead">
          <span class="stepIndex">3</span>
          <div>
            <h2>작성 방식</h2>
            <p>처음에는 가볍게 시작하고, 나중에 이어 써도 됩니다.</p>
          </div>
        </div>

        <div class="modeGrid">
          <button
            v-for="mode in questionModes"
            :key="mode.id"
            class="modeCard"
            :class="{ selected: mode.id === selectedQuestionSetMode }"
            type="button"
            @click="selectedQuestionSetMode = mode.id"
          >
            <strong>{{ mode.label }}</strong>
            <span>{{ mode.description }}</span>
            <em>{{ getQuestionCount(mode.id) }}문항</em>
          </button>
        </div>
      </section>

      <section class="startPanel">
        <div class="startCopy">
          <span class="eyebrow">자동 생성 제목</span>
          <h2>{{ finalTitle }}</h2>
          <label class="titleField">
            <span>제목 수정</span>
            <input v-model="titleOverride" :placeholder="generatedTitle" />
          </label>
          <p>비워두면 자동 제목을 사용합니다. 지금 정해도 나중에 다시 바꿀 수 있어요.</p>
        </div>
        <button class="primaryCta" type="button" :disabled="!canStart" @click="start">
          질문 카드 시작
        </button>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  buildQuestionGroupsForMode,
  getReflectionTemplate,
  getTemplateQuestionCount,
  reflectionTemplates,
} from "../data/reflectionTemplates";
import type { ReflectionPeriod, ReflectionQuestionSetMode } from "../types/reflection";

const emit = defineEmits<{
  "back-home": [];
  create: [
    payload: {
      templateId: string;
      period: ReflectionPeriod;
      questionSetMode: ReflectionQuestionSetMode;
      title?: string;
    },
  ];
}>();

const templates = [
  ...reflectionTemplates.filter((template) => template.id === "template_travel"),
  ...reflectionTemplates.filter((template) => template.id !== "template_travel"),
];
const selectedTemplateId = ref("template_travel");
const selectedQuestionSetMode = ref<ReflectionQuestionSetMode>("light");
const periodLabel = ref("제주 여행");
const titleOverride = ref("");

const questionModes: Array<{
  id: ReflectionQuestionSetMode;
  label: string;
  description: string;
}> = [
  { id: "light", label: "가볍게", description: "핵심 질문만 빠르게 답하기" },
  { id: "deep", label: "깊게", description: "천천히 많이 돌아보기" },
  { id: "share", label: "공유용", description: "친구에게 보여주기 좋은 질문" },
  { id: "compare", label: "비교용", description: "나중에 같은 질문으로 다시 보기" },
];

const selectedTemplate = computed(() => getReflectionTemplate(selectedTemplateId.value));
const generatedTitle = computed(() => {
  const template = selectedTemplate.value;
  const label = periodLabel.value.trim();
  if (!template || !label) return "새 회고";
  return `${label} ${template.label}`;
});
const finalTitle = computed(() => titleOverride.value.trim() || generatedTitle.value);
const canStart = computed(() => {
  const template = selectedTemplate.value;
  return Boolean(
    template &&
      periodLabel.value.trim() &&
      buildQuestionGroupsForMode(template, selectedQuestionSetMode.value).length > 0
  );
});

function selectTemplate(templateId: string) {
  selectedTemplateId.value = templateId;
  const template = getReflectionTemplate(templateId);
  if (template) periodLabel.value = template.periodPlaceholder;
}

function getQuestionCount(mode: ReflectionQuestionSetMode) {
  const template = selectedTemplate.value;
  return template ? getTemplateQuestionCount(template, mode) : 0;
}

function parseYear(label: string): number | undefined {
  const match = label.match(/\d{4}/);
  if (!match) return undefined;
  const year = Number(match[0]);
  return Number.isFinite(year) ? year : undefined;
}

function start() {
  const label = periodLabel.value.trim();
  if (!canStart.value || !label) return;

  emit("create", {
    templateId: selectedTemplateId.value,
    period: {
      label,
      year: parseYear(label),
    },
    questionSetMode: selectedQuestionSetMode.value,
    title: titleOverride.value.trim() || undefined,
  });
}
</script>

<style scoped>
.reflectionPage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px;
}

.reflectionHeader,
.newFlow,
.stepPanel,
.startPanel {
  width: min(960px, 100%);
  margin: 0 auto;
}

.reflectionHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.reflectionHeader h1,
.stepPanel h2,
.startPanel h2 {
  margin: 0;
  letter-spacing: 0;
}

.reflectionHeader h1 {
  font-size: 30px;
}

.eyebrow {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.newFlow {
  display: grid;
  gap: 14px;
}

.stepPanel,
.startPanel {
  border: 1px solid var(--color-soft-border);
  background: var(--color-surface);
  border-radius: 18px;
  padding: 18px;
}

.stepHead {
  display: flex;
  gap: 12px;
  align-items: start;
  margin-bottom: 14px;
}

.stepHead p,
.startPanel p {
  margin: 5px 0 0;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.stepIndex {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  font-weight: 900;
}

.optionGrid,
.modeGrid {
  display: grid;
  gap: 10px;
}

.optionGrid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.modeGrid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.optionCard,
.modeCard {
  min-height: 96px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  border-radius: 12px;
  padding: 14px;
  display: grid;
  gap: 7px;
  text-align: left;
}

.optionCard span,
.modeCard span,
.modeCard em {
  color: var(--color-text-dim);
  font-style: normal;
  line-height: 1.35;
}

.optionCard.selected,
.modeCard.selected {
  border-color: var(--color-gold);
  background: rgba(244, 197, 106, 0.13);
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: var(--color-text-dim);
  font-size: 13px;
  font-weight: 800;
}

.field input {
  border: 0;
  border-bottom: 1px solid var(--color-border-gold);
  border-radius: 0;
  background: transparent;
  color: var(--color-text);
  padding: 12px 2px;
  font-size: 20px;
}

.startPanel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.startCopy {
  display: grid;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.titleField {
  display: grid;
  gap: 6px;
  max-width: 520px;
}

.titleField span {
  color: var(--color-text-dim);
  font-size: 12px;
  font-weight: 900;
}

.titleField input {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  padding: 11px 12px;
  font-size: 16px;
}

.primaryCta {
  border-radius: 999px;
  font-weight: 900;
}

.primaryCta {
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  padding: 13px 18px;
}

@media (max-width: 720px) {
  .reflectionPage {
    padding: 16px;
  }

  .reflectionHeader {
    align-items: flex-start;
  }

  .optionGrid,
  .modeGrid {
    grid-template-columns: 1fr;
  }

  .startPanel {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
