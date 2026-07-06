<template>
  <section v-if="reflection" class="writePage">
    <header class="writeHeader">
      <div class="titleBlock">
        <span class="eyebrow">{{ currentGroup?.label ?? "오늘의 편지" }}</span>
        <h1>{{ reflection.title }}</h1>
      </div>
      <button class="leaveLink" type="button" @click="saveLater">
        저장하고 나가기
      </button>
    </header>

    <div class="stepDots" role="progressbar" :aria-valuenow="currentStep" :aria-valuemin="1" :aria-valuemax="questions.length">
      <span
        v-for="i in questions.length"
        :key="i"
        :class="['dot', { done: i <= currentStep, current: i === currentStep }]"
      ></span>
      <span class="stepCount">{{ currentStep }} / {{ questions.length }}</span>
    </div>

    <main class="questionShell">
      <aside class="writingPhotoPanel editorialPhotoFrame" aria-label="작성 무드">
        <div class="sceneFrame">
          <NightSkyScene variant="window" />
        </div>
        <p>완벽한 문장보다 나중에 다시 열어볼 수 있는 단서 하나를 남겨보세요.</p>
      </aside>

      <article class="questionCard">
        <h2>{{ currentQuestion?.text }}</h2>
        <p class="questionHint">{{ currentQuestion?.hint ?? "지금 떠오른 문장으로 시작해도 괜찮아요. 길게 쓰지 않아도 그대로 이어갈 수 있어요." }}</p>

        <div class="letterPaper">
          <textarea
            ref="answerTextarea"
            v-model="draft"
            rows="7"
            placeholder="여기에 천천히 적어보세요. 한 줄이어도 좋아요."
            @input="saveCurrentDraft"
            @keydown.ctrl.enter.prevent="saveAndNext"
            @keydown.meta.enter.prevent="saveAndNext"
          ></textarea>
        </div>

        <div class="statusBar">
          <span class="saveBadge" :class="{ error: draftSaveStatus === 'error' }">
            <span class="dotMark" aria-hidden="true"></span>
            {{ draftSaveLabel }}
          </span>
          <span class="charCount">{{ draft.length }}자</span>
        </div>
      </article>

      <nav class="writeActions" aria-label="질문 이동">
        <button class="secondary" type="button" :disabled="activeIndex === 0" @click="goPrevious">
          이전
        </button>
        <button class="primary" type="button" @click="saveAndNext">
          {{ isLastQuestion ? "완료하기" : "다음" }}
        </button>
      </nav>
    </main>
  </section>

  <section v-else class="writePage emptyState">
    <span class="eyebrow">기억 작성</span>
    <h1>작성 중인 기억을 찾지 못했어요.</h1>
    <p>질문 카드부터 다시 시작하면 됩니다. 남긴 문장은 이 기기 안에만 저장돼요.</p>
    <button class="primary" type="button" @click="$emit('back-new')">새 기억 시작하기</button>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import NightSkyScene from "../components/scenes/NightSkyScene.vue";
import { useReflectionDraftAutosave } from "../composables/useReflectionDraftAutosave";
import type { Reflection } from "../types/reflection";

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
const answerTextarea = ref<HTMLTextAreaElement | null>(null);
const questions = computed(() => props.reflection?.questionGroups.flatMap((group) => group.questions) ?? []);

function focusAnswer() {
  nextTick(() => {
    answerTextarea.value?.focus();
  });
}

onMounted(focusAnswer);
const currentQuestion = computed(() => questions.value[activeIndex.value]);
const currentGroup = computed(() => {
  if (!props.reflection || !currentQuestion.value) return null;
  return props.reflection.questionGroups.find((group) => group.id === currentQuestion.value?.groupId);
});
const currentAnswer = computed(() =>
  props.reflection?.answers.find((answer) => answer.questionId === currentQuestion.value?.id)
);
const currentStep = computed(() => Math.min(activeIndex.value + 1, questions.value.length));
const isLastQuestion = computed(() => activeIndex.value === questions.value.length - 1);
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0;
  return (currentStep.value / questions.value.length) * 100;
});
const {
  draft,
  draftSaveStatus,
  draftSaveLabel,
  hydrateCurrentDraft,
  saveCurrentDraft,
  clearCurrentDraft,
} = useReflectionDraftAutosave({
  reflection: computed(() => props.reflection),
  question: currentQuestion,
  currentAnswer,
});

watch(
  () => [props.reflection?.id, currentQuestion.value?.id, currentAnswer.value?.value] as const,
  hydrateCurrentDraft,
  { immediate: true }
);

watch(
  () => props.reflection?.id,
  () => {
    activeIndex.value = 0;
    focusAnswer();
  }
);

watch(
  () => currentQuestion.value?.id,
  () => {
    focusAnswer();
  }
);

function goPrevious() {
  activeIndex.value = Math.max(0, activeIndex.value - 1);
}

function moveNextOrFinish() {
  if (activeIndex.value < questions.value.length - 1) {
    activeIndex.value += 1;
    return;
  }

  emit("finish");
}

function saveAndNext() {
  if (!currentQuestion.value) return;

  emit("save-answer", {
    questionId: currentQuestion.value.id,
    value: draft.value,
    skipped: draft.value.trim().length === 0,
  });
  clearCurrentDraft();
  moveNextOrFinish();
}

function saveLater() {
  if (currentQuestion.value && (draft.value.trim().length > 0 || currentAnswer.value)) {
    saveCurrentDraft();
    emit("save-answer", {
      questionId: currentQuestion.value.id,
      value: draft.value,
      skipped: draft.value.trim().length === 0,
    });
    clearCurrentDraft();
  } else {
    clearCurrentDraft();
  }

  emit("save-later");
}
</script>

<style scoped>
.writePage { min-height: 100vh; background: transparent; color: var(--text-primary); padding: 24px var(--space-page-x) 200px; }
.writeHeader, .questionShell, .stepDots { width: min(960px, 100%); margin: 0 auto; }
.writeHeader { display: grid; grid-template-columns: 1fr auto; align-items: end; column-gap: 16px; row-gap: 12px; }
.titleBlock { min-width: 0; }
.leaveLink { align-self: start; border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); background: rgba(23, 31, 46, 0.72); color: var(--text-secondary); padding: 9px 13px; font-size: 13px; font-weight: var(--label-weight); letter-spacing: 0; }
.leaveLink:hover, .leaveLink:focus-visible { color: var(--text-primary); border-color: var(--border-strong); }
.eyebrow { color: var(--accent-wax); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.writeHeader h1 { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(24px, 5vw, 34px); line-height: var(--leading-tight); font-weight: var(--display-weight); letter-spacing: 0; word-break: keep-all; }

.stepDots { display: flex; align-items: center; gap: 6px; margin: 18px auto 26px; }
.stepDots .dot { width: 22px; height: 4px; border-radius: 2px; background: var(--border-strong); transition: background-color 200ms ease; }
.stepDots .dot.done { background: var(--accent-espresso); }
.stepDots .stepCount { margin-left: auto; color: var(--text-tertiary); font-size: 12px; font-weight: var(--label-weight); }

.questionShell { display: grid; grid-template-columns: minmax(220px, 0.42fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.writingPhotoPanel { position: sticky; top: 74px; margin: 0; border-radius: 12px; overflow: hidden; }
.writingPhotoPanel .sceneFrame { height: 300px; padding: 8px; }
.writingPhotoPanel p { margin: 0; padding: 14px; color: var(--text-secondary); font-size: 13px; line-height: var(--leading-body); }

.questionCard { color: var(--text-primary); padding: 0; display: grid; gap: 16px; }
.questionCard h2 { margin: 0; font-family: var(--font-display); font-size: clamp(26px, 5vw, 32px); line-height: 1.36; letter-spacing: 0; font-weight: var(--display-weight); color: var(--accent-espresso); overflow-wrap: anywhere; word-break: keep-all; }
.questionHint { margin: 0; color: var(--text-secondary); line-height: 1.55; font-size: 14px; overflow-wrap: anywhere; word-break: keep-all; }

.questionCard :deep(.letterPaper) { min-height: 280px; }
.questionCard :deep(.letterPaper textarea) { min-height: 262px; scroll-margin-bottom: 180px; }
.questionCard :deep(.letterPaper textarea:focus) { outline: none; }
.questionCard :deep(.letterPaper:focus-within) { border-color: var(--accent-espresso); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 0 0 4px rgba(232, 166, 76, 0.14), var(--shadow-letter); }

.statusBar { display: flex; align-items: center; justify-content: space-between; margin-top: -4px; font-size: 12px; color: var(--text-tertiary); }
.saveBadge { display: inline-flex; align-items: center; gap: 6px; color: var(--accent-sage); font-weight: var(--label-weight); }
.saveBadge.error { color: var(--color-danger); }
.saveBadge .dotMark { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.charCount { color: var(--text-tertiary); }

.writeActions { position: fixed; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom)); z-index: 35; width: min(840px, calc(100% - 32px)); transform: translateX(-50%); display: grid; grid-template-columns: 1fr 1.35fr; gap: 10px; padding: 10px; border: 1px solid var(--border-subtle); border-radius: 20px; background: rgba(14, 20, 32, 0.9); box-shadow: var(--shadow-lifted); backdrop-filter: blur(16px); }
.primary, .secondary { min-height: 44px; border-radius: var(--radius-pill); font-weight: var(--heading-weight); letter-spacing: 0; padding: 12px 15px; }
.primary { border: 0; background: var(--accent-espresso); color: var(--color-primary-contrast); box-shadow: 0 12px 26px rgba(2, 5, 11, 0.45); }
.secondary { border: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); }
.secondary:hover:not(:disabled), .secondary:focus-visible { border-color: var(--accent-sage); color: var(--text-primary); }
.emptyState { display: grid; place-items: center; align-content: center; gap: 16px; text-align: center; }
.emptyState p { max-width: 360px; color: var(--text-secondary); line-height: 1.6; }

@media (max-width: 760px) {
  .writePage { padding: 16px 16px 208px; }
  .writeHeader { grid-template-columns: 1fr; }
  .leaveLink { justify-self: start; }
  .stepDots .dot { flex: 1; width: auto; max-width: 40px; }
  .questionShell { grid-template-columns: 1fr; }
  .writingPhotoPanel { display: none; }
  .writeActions { bottom: calc(94px + env(safe-area-inset-bottom)); grid-template-columns: 0.85fr 1.4fr; }
  .writePage:focus-within { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
  .writePage:focus-within .writeActions { position: sticky; left: auto; bottom: calc(90px + env(safe-area-inset-bottom)); width: 100%; transform: none; }
  .questionCard h2 { font-size: 25px; }
}
</style>
