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
        <figure class="entryPhoto editorialPhotoFrame">
          <img src="/design/sealed-envelope-stack.jpg" alt="초록색 왁스 실링이 붙은 종이 봉투 더미" />
          <figcaption>질문을 고르면 오늘의 회고 봉투가 열립니다.</figcaption>
        </figure>

        <div class="entryForm">
          <div class="entryCopy">
            <span class="eyebrow">첫 질문으로 바로 들어가기</span>
            <h1 id="entry-title">무엇을 돌아볼까요?</h1>
          </div>

          <label class="topicField">
            <span>기억의 이름</span>
            <input
              v-model="periodLabel"
              :placeholder="selectedTemplate?.periodPlaceholder ?? '제주 여행'"
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
              <span class="templateStamp" aria-hidden="true">{{ getTemplateVisual(template.id).mark }}</span>
              <strong>{{ template.label }}</strong>
              <span>{{ getQuestionCount(template.id) }}문항</span>
            </button>
          </div>

          <div v-if="duplicateReflection" class="duplicateNotice" role="status">
            <p>
              이미 <strong>{{ duplicateReflection.title }}</strong> 회고가 있어요.
              새로 만들거나 이어서 쓸 수 있어요.
            </p>
            <div class="duplicateActions">
              <button type="button" class="primaryCta" @click="openDuplicate">
                기존 회고 열기
              </button>
              <button type="button" class="ghostButton" @click="start">
                그래도 새로 만들기
              </button>
            </div>
          </div>

          <button v-else class="primaryCta" type="button" :disabled="!canStart" @click="start">
            첫 질문 열기
          </button>
        </div>
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

const templateVisualById: Record<string, { mark: string }> = {
  template_travel: { mark: "TR" },
  template_year: { mark: "YR" },
  template_period: { mark: "PD" },
  template_life_chapter: { mark: "LC" },
};

const selectedTemplate = computed(() => getReflectionTemplate(selectedTemplateId.value));

const quickPeriodChips = computed(() => {
  const year = new Date().getFullYear();
  if (selectedTemplate.value?.id === "template_travel") {
    return ["제주 여행", "강릉 여행", "부산 여행"];
  }
  if (selectedTemplate.value?.id === "template_period") {
    return [`${year} 상반기`, `${year} 하반기`, `${year} 여름`];
  }
  if (selectedTemplate.value?.id === "template_life_chapter") {
    return ["20대", "첫 회사", "이사 전후"];
  }
  return [`${year}년`, `${year} 올해`, `${year - 1}년`];
});

const generatedTitle = computed(() => {
  const template = selectedTemplate.value;
  const label = periodLabel.value.trim();
  if (!template || !label) return "새 기억";
  if (template.id === "template_travel") return `${label}의 기억`;
  if (template.id === "template_life_chapter") return `${label}의 회고`;
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

function getTemplateVisual(templateId: string) {
  return templateVisualById[templateId] ?? templateVisualById.template_year;
}

function selectTemplate(templateId: string) {
  selectedTemplateId.value = templateId;
}

function primaryAction() {
  if (duplicateReflection.value) {
    emit("open-existing", duplicateReflection.value.id);
    return;
  }
  start();
}

function openDuplicate() {
  if (!duplicateReflection.value) return;
  emit("open-existing", duplicateReflection.value.id);
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
.reflectionPage { min-height: calc(100dvh - 54px); background: var(--surface-base); color: var(--text-primary); padding: 18px var(--space-page-x) calc(104px + env(safe-area-inset-bottom)); }
.entryShell { width: min(960px, 100%); min-height: 100%; margin: 0 auto; display: grid; grid-template-rows: auto 1fr; gap: 16px; }
.entryHeader { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.entryCard { border: 1px solid var(--border-subtle); border-radius: var(--radius-panel); background: var(--surface-paper); padding: clamp(14px, 3vw, 22px); display: grid; grid-template-columns: minmax(220px, 0.75fr) minmax(0, 1fr); gap: clamp(18px, 4vw, 34px); box-shadow: var(--shadow-paper); }
.entryPhoto { position: relative; margin: 0; min-height: 520px; overflow: hidden; border-radius: 14px; }
.entryPhoto img { min-height: 520px; padding: 10px; }
.entryPhoto figcaption { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 1; border: 1px solid rgba(229, 217, 200, 0.72); border-radius: 8px; background: rgba(255, 253, 248, 0.88); color: var(--text-primary); padding: 10px 12px; font-size: 13px; line-height: 1.5; box-shadow: 0 12px 28px rgba(58, 49, 43, 0.12); backdrop-filter: blur(12px); }
.entryForm { display: grid; align-content: center; gap: clamp(18px, 3vh, 26px); padding: clamp(8px, 2vw, 18px); }
.entryCopy { display: grid; gap: 10px; }
.eyebrow { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
h1 { max-width: 640px; margin: 0; font-family: var(--font-display); font-size: clamp(36px, 7vw, 58px); line-height: var(--leading-display); font-weight: var(--display-weight); letter-spacing: 0; }
.topicField { display: grid; gap: 8px; }
.topicField span, .templateChip span { color: var(--text-secondary); font-size: 12px; font-weight: var(--label-weight); }
.topicField input { width: 100%; border: 0; border-bottom: 1px solid var(--border-strong); border-radius: 0; background: transparent; color: var(--text-primary); padding: 12px 2px; font-family: var(--font-display); font-size: clamp(24px, 5.4vw, 38px); font-weight: var(--display-weight); letter-spacing: 0; outline: none; }
.quickChips, .templateRail, .duplicateActions { display: flex; flex-wrap: wrap; gap: 9px; }
.quickChips button, .templateChip, .ghostButton { border: 1px solid var(--border-subtle); background: rgba(255, 253, 248, 0.74); color: var(--text-primary); border-radius: var(--radius-pill); padding: 10px 14px; font-weight: var(--label-weight); }
.templateChip { width: min(146px, 100%); min-height: 116px; border-radius: var(--radius-card); padding: 12px; display: grid; gap: 7px; text-align: left; align-content: start; }
.templateStamp { width: 38px; height: 38px; border: 1px solid var(--border-strong); border-radius: 50%; display: grid; place-items: center; color: var(--accent-sage); font-family: var(--font-display); font-size: 14px; font-weight: var(--display-weight); }
.templateChip strong { font-weight: var(--heading-weight); }
.templateChip.selected { border-color: rgba(111, 127, 107, 0.46); background: var(--surface-sage); }
.primaryCta { width: min(270px, 100%); min-height: 52px; border: 0; border-radius: var(--radius-pill); background: var(--accent-espresso); color: var(--surface-paper); padding: 13px 18px; font-weight: var(--heading-weight); }
.primaryCta:disabled { opacity: 0.45; }
.duplicateNotice { display: grid; gap: 12px; border: 1px solid rgba(142, 78, 56, 0.22); border-radius: var(--radius-card); background: rgba(234, 215, 207, 0.42); padding: 14px 16px; }
.duplicateNotice p { margin: 0; color: var(--text-primary); font-size: 14px; line-height: 1.5; }
.duplicateNotice strong { color: var(--accent-wax); }
.duplicateActions .primaryCta, .duplicateActions .ghostButton { width: auto; min-height: 44px; padding: 10px 16px; }
@media (max-width: 760px) {
  .reflectionPage { padding: 14px 14px calc(96px + env(safe-area-inset-bottom)); }
  .entryCard { grid-template-columns: 1fr; border-radius: 16px; }
  .entryPhoto, .entryPhoto img { height: 280px; min-height: 280px; }
  .templateChip, .primaryCta { width: 100%; }
}
</style>
