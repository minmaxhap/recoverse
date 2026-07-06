<template>
  <section v-if="reflection" class="writePage bookCapsulePage">
    <header class="writeHeader">
      <div class="titleBlock">
        <span class="titleCaption">{{ reflection.title }}</span>
        <span v-if="currentGroup" class="groupChip">{{ currentGroup.label }}</span>
      </div>
      <button class="leaveLink" type="button" @click="saveLater">
        저장하고 나가기
      </button>
    </header>

    <div class="progressBlock">
      <span class="stepCount">{{ currentStep }} / {{ questions.length }}</span>
      <div
        class="progressTrack"
        role="progressbar"
        :aria-valuenow="currentStep"
        :aria-valuemin="1"
        :aria-valuemax="questions.length"
      >
        <div class="progressFill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
    </div>

    <main class="questionShell">
      <article class="questionCard">
        <h2>{{ currentQuestion?.text }}</h2>
        <p class="questionHint">{{ currentQuestion?.hint ?? "지금 떠오른 문장으로 시작해도 괜찮아요. 길게 쓰지 않아도 그대로 이어갈 수 있어요." }}</p>

        <div class="answerCard">
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
    <span class="emptyCaption">기억 작성</span>
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
.writePage { min-height: 100vh; color: var(--text-primary); padding: 16px var(--space-page-x) 180px; }
.writeHeader, .questionShell, .progressBlock { width: min(640px, 100%); margin: 0 auto; }

.writeHeader { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.titleBlock { display: flex; align-items: center; gap: 8px; min-width: 0; }
.titleCaption {
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: var(--label-weight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.groupChip {
  flex-shrink: 0;
  color: var(--accent-sage);
  background: var(--color-chip);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: var(--label-weight);
}
.leaveLink {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  padding: 6px 4px;
  font-size: 13px;
  font-weight: var(--label-weight);
}
.leaveLink:hover, .leaveLink:focus-visible { color: var(--text-secondary); }

.progressBlock { display: grid; gap: 6px; margin-top: 14px; margin-bottom: 24px; }
.stepCount { justify-self: end; color: var(--text-tertiary); font-size: 12px; font-weight: var(--label-weight); }
.progressTrack { height: 4px; border-radius: 2px; background: var(--surface-parchment); overflow: hidden; }
.progressFill {
  height: 100%;
  border-radius: 2px;
  background: var(--accent-espresso);
  transition: width var(--motion-standard) var(--ease-soft);
}

.questionShell { display: grid; gap: 20px; }
.questionCard { display: grid; gap: 14px; }
.questionCard h2 {
  margin: 0;
  font-size: 22px;
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  line-height: 1.4;
  color: var(--text-primary);
  overflow-wrap: anywhere;
  word-break: keep-all;
}
.questionHint { margin: 0; color: var(--text-secondary); line-height: 1.55; font-size: 14px; overflow-wrap: anywhere; word-break: keep-all; }

.answerCard {
  border-radius: var(--radius-card);
  background: var(--surface-paper);
  box-shadow: var(--shadow-paper);
  padding: 18px;
  transition: box-shadow var(--motion-quick) var(--ease-soft);
}
.answerCard:focus-within { box-shadow: var(--glow-lamp), var(--shadow-paper); }
.answerCard textarea {
  width: 100%;
  min-height: 200px;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.7;
  outline: none !important;
  box-shadow: none !important;
  resize: vertical;
  scroll-margin-bottom: 180px;
}
.answerCard textarea::placeholder { color: var(--text-tertiary); }

.statusBar { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-tertiary); }
.saveBadge { display: inline-flex; align-items: center; gap: 6px; color: var(--accent-sage); font-weight: var(--label-weight); }
.saveBadge.error { color: var(--color-danger); }
.saveBadge .dotMark { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.charCount { color: var(--text-tertiary); }

.writeActions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(64px + env(safe-area-inset-bottom));
  z-index: 35;
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 10px;
  padding: 12px var(--space-page-x);
  border-top: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
}
.primary, .secondary {
  min-height: 52px;
  border-radius: var(--radius-pill);
  font-size: 15px;
  font-weight: var(--heading-weight);
  letter-spacing: 0;
  padding: 13px 15px;
  transition: transform var(--motion-quick) var(--ease-spring), background-color var(--motion-quick) var(--ease-soft);
}
.primary { border: 0; background: var(--accent-espresso); color: var(--color-primary-contrast); }
.primary:hover { background: #5B4BF0; }
.primary:active { transform: scale(0.97); }
.secondary { border: 0; background: var(--surface-parchment); color: var(--text-secondary); }
.secondary:hover:not(:disabled) { background: #E8EBEE; color: var(--text-primary); }
.secondary:disabled { opacity: 0.4; }

.emptyState { display: grid; place-items: center; align-content: center; gap: 16px; text-align: center; }
.emptyCaption { color: var(--text-tertiary); font-size: 13px; font-weight: var(--label-weight); }
.emptyState h1 { margin: 0; font-size: 20px; font-weight: var(--display-weight); letter-spacing: var(--tracking-display); }
.emptyState p { max-width: 360px; margin: 0; color: var(--text-secondary); line-height: 1.6; font-size: 14px; }

@media (min-width: 900px) {
  .writeActions {
    left: 50%;
    right: auto;
    bottom: 24px;
    width: min(640px, calc(100% - 40px));
    transform: translateX(-50%);
    border: 0;
    border-radius: var(--radius-panel);
    box-shadow: var(--shadow-lifted);
  }
}

@media (max-width: 899px) {
  .writePage:focus-within { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
  .writePage:focus-within .writeActions { position: sticky; left: auto; right: auto; bottom: calc(60px + env(safe-area-inset-bottom)); width: 100%; margin: 0 auto; }
}
</style>
