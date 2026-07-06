<template>
  <section class="reflectionPage bookCapsulePage">
    <main class="entryShell">
      <header class="entryHeader">
        <button class="backButton" type="button" aria-label="홈으로" @click="$emit('back-home')">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5" />
          </svg>
        </button>
        <h1>새 회고</h1>
      </header>

      <p class="entryLead">어떤 회고를 남길까요?</p>

      <div class="templateList" role="radiogroup" aria-label="질문 묶음">
        <button
          v-for="template in templates"
          :key="template.id"
          class="templateRow"
          :class="{ selected: template.id === selectedTemplateId }"
          type="button"
          role="radio"
          :aria-checked="template.id === selectedTemplateId"
          @click="selectTemplate(template.id)"
        >
          <IconBadge :icon="getTemplateVisual(template.id).icon" :tint="getTemplateVisual(template.id).tint" />
          <span class="templateBody">
            <strong>{{ template.label }}</strong>
            <span>질문 {{ getQuestionCount(template.id) }}개</span>
          </span>
          <svg v-if="template.id === selectedTemplateId" class="checkIcon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m4.5 10.5 3.5 3.5 7.5-8" />
          </svg>
        </button>

        <button
          class="templateRow"
          :class="{ selected: isCustomMode }"
          type="button"
          role="radio"
          :aria-checked="isCustomMode"
          @click="selectTemplate(CUSTOM_MODE_ID)"
        >
          <IconBadge icon="plus" tint="neutral" />
          <span class="templateBody">
            <strong>직접 만들기</strong>
            <span>질문을 내가 적어요</span>
          </span>
          <svg v-if="isCustomMode" class="checkIcon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m4.5 10.5 3.5 3.5 7.5-8" />
          </svg>
        </button>
      </div>

      <div v-if="isCustomMode" class="customEditor paperPanel">
        <label v-for="(question, idx) in customQuestions" :key="idx" class="customRow">
          <span>질문 {{ idx + 1 }}</span>
          <div class="customInputWrap">
            <input
              v-model="customQuestions[idx]"
              type="text"
              placeholder="예: 올해 가장 기억에 남는 순간은?"
              autocomplete="off"
            />
            <button
              type="button"
              class="removeButton"
              :disabled="customQuestions.length <= 1"
              aria-label="이 질문 삭제"
              @click="removeCustomQuestion(idx)"
            >
              ✕
            </button>
          </div>
        </label>
        <button type="button" class="addButton" @click="addCustomQuestion">
          + 질문 추가하기
        </button>
      </div>

      <div class="periodField">
        <label for="period-input">언제의 이야기인가요? <span class="optionalHint">비워두면 자동으로 정해져요</span></label>
        <input
          id="period-input"
          v-model="periodLabel"
          :placeholder="selectedTemplate?.periodPlaceholder ?? defaultPeriodLabel"
          autocomplete="off"
          @keydown.enter.prevent="primaryAction"
        />
        <div class="quickChips" aria-label="추천 시점">
          <button
            v-for="chip in quickPeriodChips"
            :key="chip"
            type="button"
            :class="{ active: periodLabel === chip }"
            @click="periodLabel = chip"
          >
            {{ chip }}
          </button>
        </div>
      </div>

      <div v-if="duplicateReflection" class="duplicateNotice" role="status">
        <p>
          이미 <strong>{{ duplicateReflection.title }}</strong> 회고가 있어요.
        </p>
        <div class="duplicateActions">
          <button type="button" class="primaryButton" @click="openDuplicate">
            기존 회고 열기
          </button>
          <button type="button" class="paperButton" @click="start">
            새로 만들기
          </button>
        </div>
      </div>

      <div v-else class="ctaDock">
        <button class="primaryButton startCta" type="button" :disabled="!canStart" @click="start">
          {{ isCustomMode ? "이 질문들로 시작하기" : "이 질문으로 시작하기" }}
        </button>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import IconBadge from "../components/IconBadge.vue";
import type { BadgeIcon, BadgeTint } from "../components/IconBadge.vue";
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

const templateVisualById: Record<string, { icon: BadgeIcon; tint: BadgeTint }> = {
  template_travel: { icon: "plane", tint: "blue" },
  template_year: { icon: "sparkle", tint: "accent" },
  template_period: { icon: "calendar", tint: "sage" },
  template_life_chapter: { icon: "book", tint: "blush" },
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
.reflectionPage { min-height: calc(100dvh - 54px); color: var(--text-primary); padding: 16px var(--space-page-x) calc(80px + env(safe-area-inset-bottom)); }
.entryShell { width: min(560px, 100%); margin: 0 auto; display: grid; gap: 18px; }

.entryHeader { display: flex; align-items: center; gap: 6px; }
.backButton {
  width: 40px;
  height: 40px;
  margin-left: -10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text-secondary);
  display: grid;
  place-items: center;
}
.backButton svg { width: 20px; height: 20px; }
.backButton:hover { background: var(--surface-parchment); }
.entryHeader h1 {
  margin: 0;
  font-size: 20px;
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  color: var(--text-primary);
}

.entryLead { margin: 0; padding: 0 2px; color: var(--text-secondary); font-size: 14px; }

.templateList { display: grid; gap: 10px; }
.templateRow {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 0;
  border-radius: var(--radius-card);
  background: var(--surface-paper);
  box-shadow: var(--shadow-paper);
  text-align: left;
  transition: box-shadow var(--motion-quick) var(--ease-soft), transform var(--motion-quick) var(--ease-spring);
}
.templateRow:active { transform: scale(0.98); }
.templateRow.selected { box-shadow: var(--glow-lamp), var(--shadow-paper); }
.templateBody { display: grid; gap: 2px; min-width: 0; }
.templateBody strong { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: var(--text-primary); }
.templateBody span { color: var(--text-tertiary); font-size: 13px; }
.checkIcon { width: 20px; height: 20px; color: var(--accent-espresso); }

.customEditor { display: grid; gap: 12px; padding: 16px; }
.customRow { display: grid; gap: 6px; }
.customRow > span { color: var(--text-tertiary); font-size: 12px; font-weight: var(--label-weight); }
.customInputWrap { display: flex; gap: 8px; align-items: center; }
.customInputWrap input {
  flex: 1;
  min-width: 0;
  border: 0;
  border-radius: 12px;
  background: var(--surface-parchment);
  color: var(--text-primary);
  padding: 12px 14px;
  font-size: 15px;
}
.customInputWrap input:focus-visible { outline: none; box-shadow: var(--glow-lamp) !important; }
.removeButton {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 13px;
}
.removeButton:hover:not(:disabled), .removeButton:focus-visible { color: var(--color-danger); background: var(--surface-blush); }
.removeButton:disabled { opacity: 0.35; }
.addButton {
  justify-self: start;
  border: 0;
  background: transparent;
  color: var(--accent-sage);
  padding: 6px 4px;
  font-size: 13px;
  font-weight: var(--label-weight);
}

.periodField { display: grid; gap: 8px; }
.periodField label { padding: 0 2px; color: var(--text-secondary); font-size: 13px; font-weight: var(--label-weight); }
.optionalHint { color: var(--text-tertiary); font-weight: 400; }
.periodField input {
  width: 100%;
  border: 0;
  border-radius: 12px;
  background: var(--surface-parchment);
  color: var(--text-primary);
  padding: 14px 16px;
  font-size: 16px;
  font-weight: var(--label-weight);
}
.periodField input::placeholder { color: var(--text-tertiary); font-weight: 400; }
.periodField input:focus-visible { outline: none; box-shadow: var(--glow-lamp) !important; }

.quickChips { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 2px; }
.quickChips button {
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--surface-paper);
  box-shadow: var(--shadow-photo);
  color: var(--text-secondary);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: var(--label-weight);
  transition: background-color var(--motion-quick) var(--ease-soft), color var(--motion-quick) var(--ease-soft);
}
.quickChips button.active { background: var(--surface-letter); color: var(--accent-sage); }

.duplicateNotice {
  display: grid;
  gap: 12px;
  border-radius: var(--radius-card);
  background: var(--surface-blush);
  padding: 16px;
}
.duplicateNotice p { margin: 0; color: var(--text-primary); font-size: 14px; line-height: 1.5; }
.duplicateNotice strong { color: #E8543F; }
.duplicateActions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.duplicateActions .primaryButton, .duplicateActions .paperButton { min-height: 46px; padding: 11px 14px; font-size: 14px; }

.ctaDock { position: sticky; bottom: calc(72px + env(safe-area-inset-bottom)); padding-top: 4px; }
.startCta { width: 100%; box-shadow: var(--shadow-lifted); }
</style>
