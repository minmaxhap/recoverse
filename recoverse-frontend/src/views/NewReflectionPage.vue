<template>
  <section class="reflectionPage">
    <main class="entryShell">
      <header class="entryHeader">
        <button class="ghostButton" type="button" @click="$emit('back-home')">
          홈으로
        </button>
        <span class="eyebrow">기억 작성</span>
      </header>

      <section class="entryCard" aria-labelledby="entry-title">
        <div class="entryCopy">
          <span class="eyebrow">첫 질문으로 바로 들어가기</span>
          <h1 id="entry-title">무엇을 돌아볼까요?</h1>
        </div>

        <label class="topicField">
          <span>기억의 이름</span>
          <input
            v-model="periodLabel"
            :placeholder="selectedTemplate?.periodPlaceholder ?? '예: 제주 여행'"
            autocomplete="off"
            @keydown.enter.prevent="primaryAction"
          />
        </label>

        <div class="quickChips" aria-label="추천 기억">
          <button
            v-for="chip in quickPeriodChips"
            :key="chip"
            type="button"
            @click="periodLabel = chip"
          >
            {{ chip }}
          </button>
        </div>

        <div class="templateRail" aria-label="질문 묶음">
          <button
            v-for="template in templates"
            :key="template.id"
            class="templateChip"
            :class="{ selected: template.id === selectedTemplateId }"
            type="button"
            @click="selectTemplate(template.id)"
          >
            <strong>{{ template.label }}</strong>
            <span>{{ getQuestionCount(template.id) }}문항</span>
          </button>
        </div>

        <div v-if="duplicateReflection" class="duplicateNotice" role="status">
          <p>
            이미 <strong>{{ duplicateReflection.title }}</strong> 회고가 있어요.
            새로 만드는 대신 이어서 열 수 있어요.
          </p>
          <div class="duplicateActions">
            <button
              type="button"
              class="primaryCta"
              @click="$emit('open-existing', duplicateReflection!.id)"
            >
              기존 회고 열기
            </button>
            <button type="button" class="ghostButton" @click="start">
              그래도 새로 만들기
            </button>
          </div>
        </div>

        <button
          v-else
          class="primaryCta"
          type="button"
          :disabled="!canStart"
          @click="start"
        >
          첫 질문 열기
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
import type { Reflection, ReflectionPeriod, ReflectionQuestionSetMode } from "../types/reflection";

const props = defineProps<{
  reflections?: Reflection[];
}>();

const emit = defineEmits<{
  "back-home": [];
  "open-existing": [reflectionId: string];
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
const periodLabel = ref("");

const selectedTemplate = computed(() => getReflectionTemplate(selectedTemplateId.value));

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

const generatedTitle = computed(() => {
  const template = selectedTemplate.value;
  const label = periodLabel.value.trim();
  if (!template || !label) return "새 기억";
  if (template.id === "template_travel") return `${label}의 기억`;
  if (template.id === "template_life_chapter") return `${label}의 나`;
  return `${label} ${template.label}`;
});

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
}

const duplicateReflection = computed(() => {
  const label = periodLabel.value.trim();
  if (!label) return null;
  return (
    props.reflections?.find(
      (reflection) =>
        reflection.templateId === selectedTemplateId.value &&
        reflection.period.label.trim() === label
    ) ?? null
  );
});

function primaryAction() {
  if (duplicateReflection.value) {
    emit("open-existing", duplicateReflection.value.id);
    return;
  }
  start();
}

function getQuestionCount(templateId: string) {
  const template = getReflectionTemplate(templateId);
  return template ? getTemplateQuestionCount(template, selectedQuestionSetMode.value) : 0;
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
    title: generatedTitle.value,
  });
}
</script>

<style scoped>
.reflectionPage {
  height: calc(100dvh - 54px);
  min-height: 560px;
  background:
    radial-gradient(circle at 72% 18%, rgba(110, 90, 154, 0.24), transparent 28%),
    radial-gradient(circle at 18% 84%, rgba(184, 166, 232, 0.14), transparent 26%),
    var(--color-page);
  color: var(--color-text);
  padding: 18px 18px calc(92px + env(safe-area-inset-bottom));
  overflow: hidden;
}

.entryShell {
  width: min(860px, 100%);
  height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
}

.entryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.entryCard {
  min-height: 0;
  border: 1px solid var(--color-soft-border);
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(26, 33, 51, 0.94), rgba(17, 19, 34, 0.96)),
    var(--color-surface);
  padding: clamp(22px, 5vw, 42px);
  display: grid;
  align-content: center;
  gap: clamp(18px, 3vh, 26px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.26);
  overflow: auto;
}

.entryCopy {
  display: grid;
  gap: 10px;
}

.eyebrow {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: var(--eyebrow-weight);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

h1 {
  max-width: 640px;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(32px, 6.6vw, 54px);
  line-height: var(--leading-display);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
}

.topicField {
  display: grid;
  gap: 8px;
}

.topicField span {
  color: var(--color-text-dim);
  font-size: 12px;
  font-weight: var(--label-weight);
  letter-spacing: 0.02em;
}

.topicField input {
  width: 100%;
  border: 0;
  border-bottom: 1px solid rgba(184, 166, 232, 0.48);
  border-radius: 0;
  background: transparent;
  color: var(--color-text);
  padding: 12px 2px;
  font-family: var(--font-display);
  font-size: clamp(22px, 5.4vw, 36px);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  outline: none;
}

.quickChips,
.templateRail {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.quickChips button,
.templateChip,
.ghostButton {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.quickChips button,
.ghostButton {
  border-radius: 999px;
  padding: 10px 13px;
  font-weight: var(--label-weight);
}

.templateChip {
  min-width: 128px;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 4px;
  text-align: left;
}

.templateChip strong,
.templateChip span {
  display: block;
}

.templateChip strong {
  font-weight: var(--heading-weight);
}

.templateChip span {
  color: var(--color-text-dim);
  font-size: 12px;
  font-weight: var(--label-weight);
}

.templateChip.selected {
  border-color: rgba(244, 197, 106, 0.72);
  background: rgba(244, 197, 106, 0.12);
}

.primaryCta {
  width: min(260px, 100%);
  min-height: 52px;
  border: 0;
  border-radius: 999px;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  padding: 13px 18px;
  font-weight: var(--heading-weight);
  letter-spacing: 0.01em;
}

.primaryCta:disabled {
  opacity: 0.45;
}

.duplicateNotice {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(244, 197, 106, 0.32);
  border-radius: 14px;
  background: rgba(244, 197, 106, 0.08);
  padding: 14px 16px;
}

.duplicateNotice p {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.5;
}

.duplicateNotice strong {
  color: var(--color-gold);
}

.duplicateActions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.duplicateActions .primaryCta,
.duplicateActions .ghostButton {
  width: auto;
  min-height: 44px;
  padding: 10px 16px;
}

@media (max-width: 720px) {
  .reflectionPage {
    min-height: 0;
    padding: 14px 14px calc(90px + env(safe-area-inset-bottom));
  }

  .entryCard {
    border-radius: 18px;
    padding: 22px;
  }

  .templateChip,
  .primaryCta {
    width: 100%;
  }
}

@media (max-height: 680px) {
  .reflectionPage {
    min-height: 0;
    padding-top: 12px;
  }

  .entryCard {
    padding: 18px;
    gap: 14px;
  }

  h1 {
    font-size: clamp(30px, 7vw, 44px);
  }
}
</style>
