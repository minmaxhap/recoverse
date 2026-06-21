<template>
  <section v-if="reflection" class="writePage">
    <header class="writeHeader">
      <button class="textButton" type="button" @click="$emit('save-later')">
        나중에 이어쓰기
      </button>
      <div class="titleBlock">
        <span class="eyebrow">{{ currentGroup?.label ?? "회고" }}</span>
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
        <p>{{ currentQuestion?.hint ?? "짧게 적어도 괜찮아요." }}</p>

        <textarea
          v-model="draft"
          rows="7"
          placeholder="지금 떠오르는 단어부터 적어보세요."
          @keydown.ctrl.enter.prevent="saveAndNext"
          @keydown.meta.enter.prevent="saveAndNext"
        ></textarea>
      </article>

      <nav class="writeActions" aria-label="질문 이동">
        <button class="secondary" type="button" :disabled="activeIndex === 0" @click="goPrevious">
          이전
        </button>
        <button class="secondary" type="button" @click="skipQuestion">건너뛰기</button>
        <button class="primary" type="button" @click="saveAndNext">
          {{ isLastQuestion ? "완료하기" : "저장하고 다음" }}
        </button>
      </nav>
    </main>
  </section>

  <section v-else class="writePage emptyState">
    <h1>이어 쓸 회고가 없어요.</h1>
    <button class="primary" type="button" @click="$emit('back-new')">새 회고 시작</button>
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
    skipped: false,
  });
  moveNextOrFinish();
}

function skipQuestion() {
  if (!currentQuestion.value) return;

  emit("save-answer", {
    questionId: currentQuestion.value.id,
    value: "",
    skipped: true,
  });
  moveNextOrFinish();
}
</script>

<style scoped>
.writePage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px;
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
  background: var(--color-card, #f5f0e8);
  color: var(--color-text-card, #1a2535);
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
  color: rgba(26, 37, 53, 0.68);
  line-height: 1.5;
}

.questionCard textarea {
  width: 100%;
  border: 0;
  border-top: 1px solid rgba(26, 37, 53, 0.18);
  border-radius: 0;
  background: transparent;
  color: inherit;
  resize: vertical;
  padding: 18px 0 0;
  font-size: 18px;
  line-height: 1.6;
  outline: none;
}

.writeActions {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  gap: 10px;
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
}

@media (max-width: 720px) {
  .writePage {
    padding: 16px;
  }

  .writeHeader {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .writeActions {
    grid-template-columns: 1fr;
  }

  .questionCard {
    padding: 20px;
  }

  .questionCard h2 {
    font-size: 24px;
  }
}
</style>
