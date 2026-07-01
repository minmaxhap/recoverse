<template>
  <section v-if="reflection" class="writePage">
    <header class="writeHeader">
      <div class="titleBlock">
        <span class="eyebrow">{{ currentGroup?.label ?? "기억 작성" }}</span>
        <h1>{{ reflection.title }}</h1>
      </div>
      <button class="leaveLink" type="button" @click="saveLater">
        저장하고 나가기
      </button>
      <div class="statusBlock">
        <span class="progressText">{{ currentStep }} / {{ questions.length }}</span>
        <span class="saveStatus" :class="{ error: draftSaveStatus === 'error' }">
          {{ draftSaveLabel }}
        </span>
      </div>
    </header>

    <div class="progressTrack" aria-hidden="true">
      <span :style="{ width: `${progressPercent}%` }"></span>
    </div>

    <main class="questionShell">
      <aside class="writingPhotoPanel editorialPhotoFrame" aria-label="작성 무드">
        <img src="/design/blank-journal.jpg" alt="햇빛 아래 펼쳐진 빈 저널과 안개꽃" />
        <p>완벽한 문장보다 나중에 다시 열어볼 수 있는 단서 하나를 남겨보세요.</p>
      </aside>

      <article class="questionCard">
        <span class="questionMeta">질문 {{ currentStep }}</span>
        <h2>{{ currentQuestion?.text }}</h2>
        <p>{{ currentQuestion?.hint ?? "지금 떠오른 문장으로 시작해도 괜찮아요. 길게 쓰지 않아도 그대로 이어갈 수 있어요." }}</p>

        <textarea
          ref="answerTextarea"
          v-model="draft"
          rows="7"
          placeholder="여기에 천천히 적어보세요. 한 줄이어도 좋아요."
          @input="saveCurrentDraft"
          @keydown.ctrl.enter.prevent="saveAndNext"
          @keydown.meta.enter.prevent="saveAndNext"
        ></textarea>
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
.writePage { min-height: 100vh; background: var(--surface-base); color: var(--text-primary); padding: 24px var(--space-page-x) 188px; }
.writeHeader, .questionShell { width: min(960px, 100%); margin: 0 auto; }
.writeHeader { display: grid; grid-template-columns: 1fr auto; grid-template-areas: "title leave" "status status"; align-items: end; column-gap: 16px; row-gap: 12px; }
.titleBlock { grid-area: title; min-width: 0; }
.leaveLink { grid-area: leave; align-self: start; border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); background: rgba(255, 253, 248, 0.72); color: var(--text-secondary); padding: 9px 13px; font-size: 13px; font-weight: var(--label-weight); letter-spacing: 0; }
.leaveLink:hover, .leaveLink:focus-visible { color: var(--text-primary); border-color: var(--border-strong); }
.statusBlock { grid-area: status; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.eyebrow, .questionMeta { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.writeHeader h1 { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(24px, 5vw, 34px); line-height: var(--leading-tight); font-weight: var(--display-weight); letter-spacing: 0; }
.progressText, .saveStatus { color: var(--text-secondary); font-size: 12px; font-weight: var(--label-weight); line-height: var(--leading-tight); }
.saveStatus { color: var(--accent-sage); white-space: nowrap; }
.saveStatus.error { color: var(--color-danger); }
.progressTrack { width: min(960px, 100%); height: 5px; margin: 18px auto 32px; overflow: hidden; border-radius: 999px; background: var(--surface-parchment); }
.progressTrack span { display: block; height: 100%; border-radius: inherit; background: var(--accent-sage); }
.questionShell { display: grid; grid-template-columns: minmax(220px, 0.42fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.writingPhotoPanel { position: sticky; top: 74px; margin: 0; border-radius: var(--radius-card); overflow: hidden; }
.writingPhotoPanel img { height: 320px; padding: 8px; }
.writingPhotoPanel p { margin: 0; padding: 14px; color: var(--text-secondary); font-size: 13px; line-height: var(--leading-body); }
.questionCard { border: 1px solid var(--border-subtle); border-radius: var(--radius-panel); background: linear-gradient(180deg, rgba(255, 253, 248, 0.96), rgba(255, 253, 248, 0.9)), var(--surface-paper); color: var(--text-primary); padding: clamp(22px, 4vw, 30px); display: grid; gap: 14px; box-shadow: var(--shadow-paper); }
.questionCard h2 { margin: 0; font-family: var(--font-display); font-size: clamp(28px, 5.8vw, 40px); line-height: var(--leading-heading); letter-spacing: 0; font-weight: var(--display-weight); overflow-wrap: anywhere; word-break: keep-all; }
.questionCard p { margin: 0; color: var(--text-secondary); line-height: 1.55; overflow-wrap: anywhere; word-break: keep-all; }
.questionCard textarea { width: 100%; min-height: 220px; border: 1px solid var(--border-strong); border-radius: 12px; background: linear-gradient(transparent 31px, rgba(202, 188, 168, 0.28) 32px), rgba(251, 244, 236, 0.62); background-size: 100% 32px; color: var(--text-primary); resize: vertical; padding: 18px 20px; font-family: var(--font-display); font-size: 19px; line-height: 32px; outline: none; transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease; scroll-margin-bottom: 180px; }
.questionCard textarea::placeholder { color: rgba(117, 105, 95, 0.58); }
.questionCard textarea:hover, .questionCard textarea:focus { border-color: var(--accent-sage); box-shadow: 0 0 0 4px rgba(111, 127, 107, 0.12); }
.writeActions { position: fixed; left: 50%; bottom: calc(84px + env(safe-area-inset-bottom)); z-index: 35; width: min(840px, calc(100% - 32px)); transform: translateX(-50%); display: grid; grid-template-columns: 1fr 1.35fr; gap: 10px; padding: 10px; border: 1px solid var(--border-subtle); border-radius: 20px; background: rgba(255, 253, 248, 0.92); box-shadow: var(--shadow-lifted); backdrop-filter: blur(16px); }
.primary, .secondary { min-height: 44px; border-radius: var(--radius-pill); font-weight: var(--heading-weight); letter-spacing: 0; padding: 12px 15px; }
.primary { border: 0; background: var(--accent-sage); color: var(--surface-paper); }
.secondary { border: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); }
.secondary:hover:not(:disabled), .secondary:focus-visible { border-color: var(--accent-sage); color: var(--text-primary); }
.emptyState { display: grid; place-items: center; align-content: center; gap: 16px; text-align: center; }
.emptyState p { max-width: 360px; color: var(--text-secondary); line-height: 1.6; }
@media (max-width: 760px) {
  .writePage { padding: 16px 16px 196px; }
  .writeHeader { grid-template-columns: 1fr; grid-template-areas: "title" "leave" "status"; }
  .leaveLink { justify-self: start; }
  .questionShell { grid-template-columns: 1fr; }
  .writingPhotoPanel { position: relative; top: auto; }
  .writingPhotoPanel img { height: 160px; }
  .writeActions { bottom: calc(82px + env(safe-area-inset-bottom)); grid-template-columns: 0.85fr 1.4fr; }
  .writePage:focus-within { padding-bottom: 32px; }
  .writePage:focus-within .writeActions { position: sticky; left: auto; bottom: 12px; width: 100%; transform: none; }
  .questionCard { padding: 20px; }
  .questionCard h2 { font-size: 27px; }
}
</style>
