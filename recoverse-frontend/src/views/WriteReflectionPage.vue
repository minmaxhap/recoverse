<template>
  <section v-if="reflection" class="writePage">
    <header class="writeHeader">
      <button class="textButton" type="button" @click="saveLater">
        나중에 이어쓰기
      </button>
      <div class="titleBlock">
        <span class="eyebrow">{{ currentGroup?.label ?? "기억 작성" }}</span>
        <h1>{{ reflection.title }}</h1>
      </div>
      <div class="progressText">{{ currentStep }} / {{ questions.length }}</div>
    </header>

    <div class="progressTrack" aria-hidden="true">
      <span :style="{ width: `${progressPercent}%` }"></span>
    </div>

    <main class="questionShell">
      <article class="questionCard">
        <span class="questionMeta">질문 {{ currentStep }}</span>
        <h2>{{ currentQuestion?.text }}</h2>
        <p>{{ currentQuestion?.hint ?? "짧은 문장으로 시작해도 괜찮아요. 길게 쓰고 싶으면 그대로 이어 쓰세요." }}</p>

        <textarea
          v-model="draft"
          rows="7"
          placeholder="지금 가장 먼저 떠오르는 장면이나 감정을 적어보세요."
          @keydown.ctrl.enter.prevent="saveAndNext"
          @keydown.meta.enter.prevent="saveAndNext"
        ></textarea>
      </article>

      <nav class="writeActions" aria-label="질문 이동">
        <button class="secondary" type="button" :disabled="activeIndex === 0" @click="goPrevious">
          이전
        </button>
        <button class="primary" type="button" @click="saveAndNext">
          {{ isLastQuestion ? "검토하기" : "다음" }}
        </button>
      </nav>
    </main>
  </section>

  <section v-else class="writePage emptyState">
    <span class="eyebrow">기억 작성</span>
    <h1>작성 중이던 기억을 찾지 못했어요.</h1>
    <p>새 질문 카드부터 다시 시작하면 됩니다. 한 문장만 남겨도 나중에 다시 열어볼 수 있어요.</p>
    <button class="primary" type="button" @click="$emit('back-new')">새 기억 시작하기</button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Answer, Question, QuestionGroup, Reflection } from "../types/reflection";

const props = defineProps<{
  reflection: Reflection | null;
}>();

const emit = defineEmits<{
  "save-answer": [payload: { questionId: string; value: string; skipped: boolean }];
  "save-later": [];
  "back-new": [];
  finish: [];
}>();

const activeIndex = ref(0);
const draft = ref("");

const questions = computed<Question[]>(() =>
  props.reflection?.questionGroups.flatMap((group) => group.questions) ?? []
);
const currentQuestion = computed<Question | null>(() => questions.value[activeIndex.value] ?? null);
const currentGroup = computed<QuestionGroup | null>(() => {
  if (!props.reflection || !currentQuestion.value) return null;
  return (
    props.reflection.questionGroups.find((group) => group.id === currentQuestion.value?.groupId) ??
    null
  );
});
const currentAnswer = computed<Answer | null>(() => {
  if (!props.reflection || !currentQuestion.value) return null;
  return (
    props.reflection.answers.find((answer) => answer.questionId === currentQuestion.value?.id) ??
    null
  );
});
const currentStep = computed(() => Math.min(activeIndex.value + 1, questions.value.length));
const isLastQuestion = computed(() => activeIndex.value >= questions.value.length - 1);
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0;
  return (currentStep.value / questions.value.length) * 100;
});

watch(
  () => currentAnswer.value?.value,
  (value) => {
    draft.value = value ?? "";
  },
  { immediate: true }
);

watch(
  () => props.reflection?.id,
  () => {
    activeIndex.value = 0;
  }
);

function goPrevious() {
  activeIndex.value = Math.max(0, activeIndex.value - 1);
}

function moveNextOrFinish() {
  if (isLastQuestion.value) {
    emit("finish");
    return;
  }

  activeIndex.value += 1;
}

function saveAndNext() {
  if (!currentQuestion.value) return;

  emit("save-answer", {
    questionId: currentQuestion.value.id,
    value: draft.value,
    skipped: draft.value.trim().length === 0,
  });
  moveNextOrFinish();
}

function saveLater() {
  if (currentQuestion.value && (draft.value.trim().length > 0 || currentAnswer.value)) {
    emit("save-answer", {
      questionId: currentQuestion.value.id,
      value: draft.value,
      skipped: false,
    });
  }

  emit("save-later");
}
</script>

<style scoped>
.writePage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px 26px 178px;
}

.writeHeader,
.questionShell {
  width: min(840px, 100%);
  margin: 0 auto;
}

.writeHeader {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
}

.titleBlock {
  min-width: 0;
}

.eyebrow,
.questionMeta {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.writeHeader h1 {
  margin: 3px 0 0;
  font-size: 24px;
  letter-spacing: 0;
}

.progressText {
  color: var(--color-text-dim);
  font-weight: 900;
}

.progressTrack {
  width: min(840px, 100%);
  height: 4px;
  margin: 18px auto 34px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.progressTrack span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-gold);
}

.questionShell {
  display: grid;
  gap: 16px;
}

.questionCard {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background:
    linear-gradient(145deg, rgba(26, 33, 51, 0.96), rgba(17, 19, 34, 0.98)),
    var(--color-surface);
  color: var(--color-text);
  padding: 26px;
  display: grid;
  gap: 14px;
}

.questionCard h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.28;
  letter-spacing: 0;
}

.questionCard p {
  margin: 0;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.questionCard textarea {
  width: 100%;
  border: 0;
  border-top: 1px solid rgba(184, 166, 232, 0.24);
  border-radius: 0;
  background: transparent;
  color: inherit;
  resize: vertical;
  padding: 18px 0 0;
  font-size: 18px;
  line-height: 1.6;
  outline: none;
  scroll-margin-bottom: 180px;
}

.writeActions {
  position: fixed;
  left: 50%;
  bottom: calc(84px + env(safe-area-inset-bottom));
  z-index: 35;
  width: min(840px, calc(100% - 32px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--color-soft-border);
  border-radius: 20px;
  background: rgba(11, 15, 30, 0.94);
  backdrop-filter: blur(16px);
}

.primary,
.secondary,
.textButton {
  border-radius: 999px;
  font-weight: 900;
  padding: 12px 15px;
}

.primary {
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
}

.secondary,
.textButton {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.emptyState {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  text-align: center;
}

.emptyState p {
  max-width: 360px;
  color: var(--color-text-dim);
  line-height: 1.6;
}

@media (max-width: 720px) {
  .writePage {
    padding: 16px 16px 212px;
  }

  .writeHeader {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .writeActions {
    bottom: calc(82px + env(safe-area-inset-bottom));
    grid-template-columns: 1fr;
  }

  .writePage:focus-within {
    padding-bottom: 32px;
  }

  .writePage:focus-within .writeActions {
    position: sticky;
    left: auto;
    bottom: 12px;
    width: 100%;
    transform: none;
  }

  .questionCard {
    padding: 20px;
  }

  .questionCard h2 {
    font-size: 24px;
  }
}
</style>
