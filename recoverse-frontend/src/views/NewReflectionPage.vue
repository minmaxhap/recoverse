<template>
  <section class="reflectionPage">
    <main class="wizardShell">
      <header class="wizardHeader">
        <div>
          <span class="eyebrow">새 기억 작성</span>
          <h1>{{ currentCopy.title }}</h1>
        </div>
        <span class="stepCount">{{ activeStep + 1 }} / {{ steps.length }}</span>
      </header>

      <div class="stepDots" aria-label="작성 단계">
        <span
          v-for="(_, index) in steps"
          :key="index"
          :class="{ active: index === activeStep, done: index < activeStep }"
        ></span>
      </div>

      <section class="wizardCard">
        <section v-if="currentStep === 'type'" class="stepContent">
          <p class="stepLead">처음에는 여행부터 시작하기 쉽게 열어둘게요. 다른 시기도 바로 고를 수 있어요.</p>
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

        <section v-else-if="currentStep === 'period'" class="stepContent compact">
          <p class="stepLead">날짜를 정확히 몰라도 괜찮아요. 기억하는 이름 그대로 적으면 됩니다.</p>
          <label class="field">
            <span>어떤 기억을 돌아볼까요?</span>
            <input
              v-model="periodLabel"
              :placeholder="selectedTemplate?.periodPlaceholder ?? '제주 여행'"
              autocomplete="off"
            />
          </label>
          <div class="quickChips" aria-label="빠른 입력">
            <button
              v-for="chip in quickPeriodChips"
              :key="chip"
              type="button"
              @click="periodLabel = chip"
            >
              {{ chip }}
            </button>
          </div>
        </section>

        <section v-else-if="currentStep === 'mode'" class="stepContent">
          <p class="stepLead">기본은 짧게 답하는 방식입니다. 나중에 이어 써도 됩니다.</p>
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

        <section v-else class="stepContent compact">
          <p class="stepLead">이 제목으로 질문 카드를 시작합니다.</p>
          <div class="reviewTitle">
            <span class="eyebrow">자동 생성 제목</span>
            <h2>{{ finalTitle }}</h2>
          </div>
          <label class="titleField">
            <span>제목 수정</span>
            <input v-model="titleOverride" :placeholder="generatedTitle" />
          </label>
          <div class="summaryLine">
            <span>{{ selectedTemplate?.label }}</span>
            <span>{{ periodLabel || selectedTemplate?.periodPlaceholder }}</span>
            <span>{{ selectedModeLabel }}</span>
          </div>
        </section>
      </section>

      <nav class="wizardActions" aria-label="새 기억 작성 이동">
        <button class="secondary" type="button" :disabled="activeStep === 0" @click="previousStep">
          이전
        </button>
        <button
          v-if="!isLastStep"
          class="primaryCta"
          type="button"
          :disabled="!canGoNext"
          @click="nextStep"
        >
          다음
        </button>
        <button v-else class="primaryCta" type="button" :disabled="!canStart" @click="start">
          질문 카드 시작
        </button>
      </nav>
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

const steps = ["type", "period", "mode", "review"] as const;
type WizardStep = (typeof steps)[number];

const templates = [
  ...reflectionTemplates.filter((template) => template.id === "template_travel"),
  ...reflectionTemplates.filter((template) => template.id !== "template_travel"),
];
const activeStep = ref(0);
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

const quickPeriodChips = computed(() => {
  const year = new Date().getFullYear();
  if (selectedTemplate.value?.id === "template_travel") {
    return ["제주 여행", "도쿄 여행", "부산 여행"];
  }
  if (selectedTemplate.value?.id === "template_period") {
    return [`${year} 상반기`, `${year} 하반기`, `${year} 여름`];
  }
  if (selectedTemplate.value?.id === "template_life_chapter") {
    return ["20대", "스물아홉", "퇴사 전후"];
  }
  return [`${year}년`, `${year} 올해`, `${year - 1}년`];
});

const currentStep = computed<WizardStep>(() => steps[activeStep.value]);
const currentCopy = computed(() => {
  if (currentStep.value === "type") return { title: "무엇을 돌아볼까요?" };
  if (currentStep.value === "period") return { title: "기억의 이름을 붙여주세요" };
  if (currentStep.value === "mode") return { title: "어느 정도로 답할까요?" };
  return { title: "시작 전 한 번만 확인해요" };
});
const selectedTemplate = computed(() => getReflectionTemplate(selectedTemplateId.value));
const selectedModeLabel = computed(
  () => questionModes.find((mode) => mode.id === selectedQuestionSetMode.value)?.label ?? "가볍게"
);
const generatedTitle = computed(() => {
  const template = selectedTemplate.value;
  const label = periodLabel.value.trim();
  if (!template || !label) return "새 회고";
  if (template.id === "template_travel") return `${label}의 기억`;
  if (template.id === "template_life_chapter") return `${label}의 나`;
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
const canGoNext = computed(() => currentStep.value !== "period" || periodLabel.value.trim().length > 0);
const isLastStep = computed(() => activeStep.value === steps.length - 1);

function selectTemplate(templateId: string) {
  selectedTemplateId.value = templateId;
  const template = getReflectionTemplate(templateId);
  if (template) periodLabel.value = template.periodPlaceholder;
}

function getQuestionCount(mode: ReflectionQuestionSetMode) {
  const template = selectedTemplate.value;
  return template ? getTemplateQuestionCount(template, mode) : 0;
}

function previousStep() {
  activeStep.value = Math.max(0, activeStep.value - 1);
}

function nextStep() {
  if (!canGoNext.value) return;
  activeStep.value = Math.min(steps.length - 1, activeStep.value + 1);
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
    title: finalTitle.value,
  });
}
</script>

<style scoped>
.reflectionPage {
  height: calc(100dvh - 54px);
  min-height: 560px;
  background: var(--color-page);
  color: var(--color-text);
  padding: 18px 18px calc(92px + env(safe-area-inset-bottom));
  overflow: hidden;
}

.wizardShell {
  width: min(920px, 100%);
  height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 12px;
}

.wizardHeader {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
}

.wizardHeader h1,
.wizardCard h2,
.wizardCard p {
  margin: 0;
  letter-spacing: 0;
}

.wizardHeader h1 {
  font-size: clamp(25px, 5vw, 42px);
  line-height: 1.1;
}

.eyebrow,
.stepCount {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.stepDots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
}

.stepDots span {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.stepDots span.active,
.stepDots span.done {
  background: var(--color-gold);
}

.wizardCard {
  min-height: 0;
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: clamp(16px, 3vw, 24px);
  overflow: auto;
}

.stepContent {
  min-height: 100%;
  display: grid;
  align-content: center;
  gap: 16px;
}

.stepContent.compact {
  max-width: 680px;
  margin: 0 auto;
}

.stepLead {
  color: var(--color-text-dim);
  line-height: 1.55;
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
.modeCard em,
.summaryLine span {
  color: var(--color-text-dim);
  font-style: normal;
  line-height: 1.35;
}

.optionCard.selected,
.modeCard.selected {
  border-color: var(--color-gold);
  background: rgba(244, 197, 106, 0.13);
}

.field,
.titleField {
  display: grid;
  gap: 8px;
}

.field span,
.titleField span {
  color: var(--color-text-dim);
  font-size: 13px;
  font-weight: 800;
}

.field input,
.titleField input {
  border: 0;
  border-bottom: 1px solid var(--color-border-gold);
  border-radius: 0;
  background: transparent;
  color: var(--color-text);
  padding: 12px 2px;
  font-size: clamp(20px, 5vw, 34px);
  outline: none;
}

.titleField input {
  font-size: 18px;
}

.quickChips,
.summaryLine {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quickChips button,
.summaryLine span {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  padding: 9px 12px;
}

.reviewTitle {
  display: grid;
  gap: 8px;
}

.reviewTitle h2 {
  font-size: clamp(27px, 5vw, 46px);
  line-height: 1.12;
}

.wizardActions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
}

.primaryCta,
.secondary {
  min-height: 48px;
  border-radius: 999px;
  font-weight: 900;
  padding: 12px 15px;
}

.primaryCta {
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
}

.secondary {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.primaryCta:disabled,
.secondary:disabled {
  opacity: 0.45;
}

@media (max-width: 780px) {
  .reflectionPage {
    min-height: 0;
    padding: 14px 14px calc(90px + env(safe-area-inset-bottom));
  }

  .wizardHeader {
    align-items: start;
  }

  .optionGrid,
  .modeGrid {
    grid-template-columns: 1fr;
  }

  .optionCard,
  .modeCard {
    min-height: 78px;
  }
}

@media (max-height: 700px) {
  .reflectionPage {
    min-height: 0;
    padding-top: 12px;
  }

  .wizardCard {
    padding: 14px;
  }

  .optionCard,
  .modeCard {
    min-height: 70px;
  }
}
</style>
