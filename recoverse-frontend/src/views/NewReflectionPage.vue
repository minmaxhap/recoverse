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
          <figcaption>필요하면 템플릿을 고르고, 아니면 바로 첫 질문으로 들어갑니다.</figcaption>
        </figure>

        <div class="entryForm">
          <div class="entryCopy">
            <span class="eyebrow">템플릿은 선택사항이에요</span>
            <h1 id="entry-title">고르느라 멈추지 않게.</h1>
          </div>

          <label class="topicField">
            <span>회고 시점, 비워두면 자동으로 정해져요</span>
            <input
              v-model="periodLabel"
              :placeholder="selectedTemplate?.periodPlaceholder ?? defaultPeriodLabel"
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
            <button
              class="templateChip customChip"
              :class="{ selected: isCustomMode }"
              type="button"
              @click="selectTemplate(CUSTOM_MODE_ID)"
            >
              <span class="templateStamp" aria-hidden="true">+</span>
              <strong>직접 만들기</strong>
              <span>질문을 내가 적어요</span>
            </button>
          </div>

          <div v-if="isCustomMode" class="customQuestionEditor">
            <label v-for="(question, idx) in customQuestions" :key="idx" class="customQuestionRow">
              <span>질문 {{ idx + 1 }}</span>
              <div class="customQuestionInput">
                <input
                  v-model="customQuestions[idx]"
                  type="text"
                  placeholder="예: 올해 가장 기억에 남는 순간은?"
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="removeQuestionButton"
                  :disabled="customQuestions.length <= 1"
                  aria-label="이 질문 삭제"
                  @click="removeCustomQuestion(idx)"
                >
                  ✕
                </button>
              </div>
            </label>
            <button type="button" class="addQuestionButton" @click="addCustomQuestion">
              + 질문 추가하기
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
            {{ isCustomMode ? "이 질문들로 시작하기" : "이 질문 묶음으로 시작하기" }}
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
  "create-custom": [
    payload: {
      period: ReflectionPeriod;
      title?: string;
      questions: string[];
    },
  ];
}>();

const CUSTOM_MODE_ID = "custom_questions";

const templates = [
  ...reflectionTemplates.filter((template) => template.id === "template_travel"),
  ...reflectionTemplates.filter((template) => template.id !== "template_travel"),
];
const defaultPeriodLabel = "오늘";
const selectedTemplateId = ref("template_travel");
const selectedQuestionSetMode = ref<ReflectionQuestionSetMode>("light");
const periodLabel = ref("");
const customQuestions = ref<string[]>(["", ""]);

const isCustomMode = computed(() => selectedTemplateId.value === CUSTOM_MODE_ID);

const templateVisualById: Record<string, { mark: string }> = {
  template_travel: { mark: "01" },
  template_year: { mark: "02" },
  template_period: { mark: "03" },
  template_life_chapter: { mark: "04" },
};

const selectedTemplate = computed(() => getReflectionTemplate(selectedTemplateId.value));

const effectivePeriodLabel = computed(
  () => periodLabel.value.trim() || selectedTemplate.value?.periodPlaceholder || defaultPeriodLabel
);

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
  const label = effectivePeriodLabel.value;
  if (!label) return "새 기억";
  if (isCustomMode.value) return `${label} 회고`;
  const template = selectedTemplate.value;
  if (!template) return "새 기억";
  if (template.id === "template_travel") return `${label}의 기억`;
  if (template.id === "template_life_chapter") return `${label}의 회고`;
  return `${label} ${template.label}`;
});

const canStart = computed(() => {
  if (isCustomMode.value) {
    return customQuestions.value.some((question) => question.trim().length > 0);
  }
  const template = selectedTemplate.value;
  return Boolean(template && buildQuestionGroupsForMode(template, selectedQuestionSetMode.value).length > 0);
});

const duplicateReflection = computed(() => {
  if (isCustomMode.value) return null;
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

function addCustomQuestion() {
  customQuestions.value.push("");
}

function removeCustomQuestion(index: number) {
  if (customQuestions.value.length <= 1) return;
  customQuestions.value.splice(index, 1);
}

function start() {
  const label = effectivePeriodLabel.value;
  if (!canStart.value || !label) return;

  const period = { label, year: parseYear(label) };

  if (isCustomMode.value) {
    emit("create-custom", {
      period,
      title: generatedTitle.value,
      questions: customQuestions.value.map((question) => question.trim()).filter(Boolean),
    });
    return;
  }

  emit("create", {
    templateId: selectedTemplateId.value,
    period,
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
h1 { max-width: 640px; margin: 0; font-family: var(--font-display); font-size: clamp(36px, 7vw, 58px); line-height: var(--leading-display); font-weight: var(--display-weight); letter-spacing: 0; word-break: keep-all; }
.topicField { display: grid; gap: 8px; }
.topicField span, .templateChip span { color: var(--text-secondary); font-size: 12px; font-weight: var(--label-weight); }
.topicField input { width: 100%; border: 0; border-bottom: 1px solid var(--border-strong); border-radius: 0; background: transparent; color: var(--text-primary); padding: 12px 2px; font-family: var(--font-display); font-size: clamp(24px, 5.4vw, 38px); font-weight: var(--display-weight); letter-spacing: 0; outline: none; }
.quickChips, .templateRail, .duplicateActions { display: flex; flex-wrap: wrap; gap: 9px; }
.quickChips button, .templateChip, .ghostButton { border: 1px solid var(--border-subtle); background: rgba(255, 253, 248, 0.74); color: var(--text-primary); border-radius: var(--radius-pill); padding: 10px 14px; font-weight: var(--label-weight); }
.templateChip { width: min(146px, 100%); min-height: 116px; border-radius: var(--radius-card); padding: 12px; display: grid; gap: 7px; text-align: left; align-content: start; }
.templateStamp { width: 38px; height: 38px; border: 1px solid var(--border-strong); border-radius: 50%; display: grid; place-items: center; color: var(--accent-sage); font-family: var(--font-display); font-size: 14px; font-weight: var(--display-weight); }
.templateChip strong { font-weight: var(--heading-weight); }
.templateChip.selected { border-color: rgba(111, 127, 107, 0.46); background: var(--surface-sage); }
.customChip .templateStamp { color: var(--accent-wax); font-size: 20px; }
.customChip.selected { border-color: rgba(142, 78, 56, 0.4); background: var(--surface-blush); }

.customQuestionEditor { display: grid; gap: 10px; padding: 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: rgba(251, 244, 236, 0.44); }
.customQuestionRow { display: grid; gap: 5px; }
.customQuestionRow span { color: var(--text-secondary); font-size: 12px; font-weight: var(--label-weight); }
.customQuestionInput { display: flex; gap: 8px; align-items: center; }
.customQuestionInput input { flex: 1; min-width: 0; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface-paper); color: var(--text-primary); padding: 10px 12px; font-size: 15px; }
.customQuestionInput input:focus-visible { outline: none; border-color: var(--accent-sage); }
.removeQuestionButton { flex-shrink: 0; width: 34px; height: 34px; border: 1px solid var(--border-subtle); border-radius: 50%; background: transparent; color: var(--text-tertiary); }
.removeQuestionButton:hover:not(:disabled), .removeQuestionButton:focus-visible { color: var(--color-danger); border-color: var(--color-danger); }
.removeQuestionButton:disabled { opacity: 0.35; }
.addQuestionButton { justify-self: start; border: 1px dashed var(--border-strong); border-radius: var(--radius-pill); background: transparent; color: var(--text-secondary); padding: 9px 14px; font-size: 13px; font-weight: var(--label-weight); }
.addQuestionButton:hover, .addQuestionButton:focus-visible { color: var(--text-primary); border-color: var(--accent-sage); }

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
