<template>
  <section v-if="reflection" class="detailPage bookCapsulePage">
    <main class="detailShell">
      <section class="coverPanel paperPanel">
        <span class="coverCaption">{{ reflection.period.label }}</span>
        <h1>{{ reflection.title }}</h1>
        <p class="coverMeta">{{ updatedDate }} · 답변 {{ answeredCount }}개</p>
        <div v-if="!reflection.isCompleted" class="coverProgress">
          <div class="progressTrack">
            <div class="progressFill" :style="{ width: `${reflection.completionRate}%` }"></div>
          </div>
          <span>{{ reflection.completionRate }}%</span>
        </div>
      </section>

      <section v-if="representativeScene" class="quotePanel" aria-label="이 회고의 한 문장">
        <span class="quoteCaption">이 회고의 한 문장</span>
        <p class="quoteText">"{{ representativeScene }}"</p>
        <p v-if="representativeEmotion" class="quoteEmotion">{{ representativeEmotion }}</p>
      </section>

      <section class="actionPanel" aria-label="회고 주요 행동">
        <button
          v-if="reflection.isCompleted"
          class="primaryButton mainAction"
          type="button"
          @click="$emit('review-again')"
        >
          같은 질문 다시 보기
        </button>
        <button v-else class="primaryButton mainAction" type="button" @click="$emit('edit')">
          이어쓰기
        </button>
        <div class="subActions">
          <button
            class="paperButton"
            type="button"
            :class="{ active: shareOpen }"
            :disabled="shareableItems.length === 0"
            @click="toggleShareOptions"
          >
            공유하기
          </button>
          <button v-if="reflection.isCompleted" class="paperButton" type="button" @click="$emit('edit')">
            답변 수정
          </button>
        </div>
      </section>

      <section v-if="shareOpen && shareableItems.length > 0" ref="sharePanelRef" class="sharePanel paperPanel">
        <p>친구에게 보여줘도 괜찮은 질문만 고르면 수정할 수 없는 읽기 전용 화면이 만들어집니다.</p>
        <div class="shareList">
          <label v-for="item in shareableItems" :key="item.question.id" class="shareOption">
            <input v-model="shareSelection" type="checkbox" :value="item.question.id" />
            <span>{{ item.question.text }}</span>
          </label>
        </div>
        <button
          class="primaryButton shareButton"
          type="button"
          :disabled="shareSelection.length === 0"
          @click="$emit('share', shareSelection)"
        >
          읽기 전용 링크 만들기
        </button>
      </section>

      <section class="answerList paperPanel" aria-label="질문과 답변">
        <article
          v-for="(item, idx) in answerItems"
          :key="item.question.id"
          class="answerRow"
          :class="{ first: idx === 0 }"
        >
          <span class="qLabel">Q{{ idx + 1 }} · {{ item.groupLabel }}</span>
          <h3>{{ item.question.text }}</h3>
          <p v-if="item.answerText">{{ item.answerText }}</p>
          <p v-else-if="item.answer?.skipped" class="muted">이 질문은 지금은 건너뛰었어요.</p>
          <p v-else class="muted">아직 비어 있는 질문이에요. 이어쓰기에서 천천히 채울 수 있어요.</p>
        </article>
      </section>

      <section class="dangerZone">
        <button class="deleteAction" type="button" @click="confirmDelete">
          이 회고 삭제하기
        </button>
      </section>
    </main>
  </section>

  <section v-else class="detailPage emptyState">
    <span class="emptyCaption">회고 열람</span>
    <h1>열어볼 기억을 찾지 못했어요.</h1>
    <p>홈으로 돌아가면 오늘 다시 떠오른 기억을 보거나 새 기억을 시작할 수 있어요.</p>
    <button class="primaryButton" type="button" @click="$emit('back-home')">홈으로 돌아가기</button>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { Question, Reflection } from "../types/reflection";
import { getPreviewSentence } from "../lib/reflectionPreview";
import { confirmDialog } from "../composables/useAppDialog";

const props = defineProps<{
  reflection: Reflection | null;
}>();

const emit = defineEmits<{
  "back-home": [];
  edit: [];
  "review-again": [];
  share: [questionIds: string[]];
  delete: [];
}>();

const shareSelection = ref<string[]>([]);
const shareOpen = ref(false);
const sharePanelRef = ref<HTMLElement | null>(null);

const questions = computed<Question[]>(() =>
  props.reflection?.questionGroups.flatMap((group) => group.questions) ?? []
);
const answerMap = computed(() => new Map(props.reflection?.answers.map((answer) => [answer.questionId, answer]) ?? []));
const answeredCount = computed(() =>
  props.reflection?.answers.filter((answer) => answer.value.trim().length > 0).length ?? 0
);
const representativeScene = computed(() => {
  if (!props.reflection) return "";
  return getPreviewSentence(props.reflection, 140);
});
const representativeEmotion = computed(() => {
  const emotionQuestion = questions.value.find((question) => question.text.includes("감정"));
  const emotionAnswer = emotionQuestion
    ? answerMap.value.get(emotionQuestion.id)?.value.trim()
    : "";
  if (emotionAnswer) return `가장 가까운 감정: ${emotionAnswer}`;
  return answeredCount.value > 0
    ? "지금까지의 답변을 천천히 읽어보는 화면입니다."
    : "첫 답변을 남기면 기억의 요약이 생깁니다.";
});
const updatedDate = computed(() => {
  if (!props.reflection) return "";
  return new Date(props.reflection.updatedAt).toLocaleDateString("ko-KR");
});
const answerItems = computed(() => {
  if (!props.reflection) return [];

  return props.reflection.questionGroups.flatMap((group) =>
    group.questions.map((question) => {
      const answer = answerMap.value.get(question.id);
      return {
        groupLabel: group.label,
        question,
        answer,
        answerText: answer?.value.trim() ?? "",
      };
    })
  );
});
const shareableItems = computed(() =>
  answerItems.value.filter(
    (item) => item.question.visibility === "public" && item.answerText.trim().length > 0
  )
);

watch(
  () => props.reflection?.id,
  () => {
    shareSelection.value = shareableItems.value.map((item) => item.question.id);
    shareOpen.value = false;
  },
  { immediate: true }
);

function toggleShareOptions() {
  shareOpen.value = !shareOpen.value;
  if (!shareOpen.value) return;

  nextTick(() => {
    sharePanelRef.value?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

async function confirmDelete() {
  const confirmed = await confirmDialog("삭제하면 되돌릴 수 없어요.", {
    title: "이 회고를 삭제할까요?",
    confirmLabel: "삭제하기",
    cancelLabel: "취소",
    danger: true,
  });
  if (!confirmed) return;
  emit("delete");
}
</script>

<style scoped>
.detailPage { min-height: 100vh; color: var(--text-primary); padding: 16px var(--space-page-x) calc(80px + env(safe-area-inset-bottom)); }
.detailShell { width: min(560px, 100%); margin: 0 auto; display: grid; gap: 16px; }
h1, h2, h3, p { margin: 0; letter-spacing: 0; }

.coverPanel { display: grid; gap: 6px; padding: 20px; }
.coverCaption { color: var(--text-tertiary); font-size: 13px; font-weight: var(--label-weight); }
.coverPanel h1 {
  font-size: 22px;
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  line-height: 1.35;
  color: var(--text-primary);
  word-break: keep-all;
}
.coverMeta { color: var(--text-tertiary); font-size: 13px; }
.coverProgress { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.coverProgress span { color: var(--accent-sage); font-size: 12px; font-weight: var(--label-weight); }
.progressTrack { flex: 1; height: 4px; border-radius: 2px; background: var(--surface-parchment); overflow: hidden; }
.progressFill { height: 100%; border-radius: 2px; background: var(--accent-espresso); transition: width var(--motion-standard) var(--ease-soft); }

.quotePanel {
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  border-radius: var(--radius-panel);
  background: var(--surface-letter);
  box-shadow: var(--shadow-letter);
}
.quoteCaption { color: var(--text-on-letter-soft); font-size: 13px; font-weight: var(--label-weight); }
.quoteText { font-size: 17px; font-weight: 700; line-height: 1.6; letter-spacing: -0.01em; color: var(--text-on-letter); word-break: keep-all; }
.quoteEmotion { color: var(--text-on-letter-soft); font-size: 13px; line-height: var(--leading-body); }

.actionPanel { display: grid; gap: 8px; }
.mainAction { width: 100%; }
.subActions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.subActions .paperButton { min-height: 48px; font-size: 14px; }
.subActions .paperButton.active { background: var(--surface-letter); color: var(--accent-sage); }
.subActions .paperButton:disabled { opacity: 0.4; }

.sharePanel { padding: 18px; display: grid; gap: 12px; }
.sharePanel > p { color: var(--text-secondary); line-height: var(--leading-body); font-size: 13px; }
.shareList { display: grid; gap: 4px; }
.shareOption {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
  border-radius: 12px;
  background: var(--surface-ink-wash);
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.shareOption input { accent-color: var(--accent-espresso); margin-top: 2px; }
.shareButton { width: 100%; }

.answerList { display: grid; padding: 4px 0; }
.answerRow { padding: 18px 20px; display: grid; gap: 6px; }
.answerRow + .answerRow { border-top: 1px solid var(--surface-ink-wash); }
.qLabel { color: var(--text-tertiary); font-size: 12px; font-weight: var(--label-weight); }
.answerRow h3 { font-size: 15px; line-height: 1.45; font-weight: 700; letter-spacing: -0.01em; color: var(--text-primary); word-break: keep-all; }
.answerRow p { color: var(--text-secondary); line-height: 1.7; font-size: 15px; word-break: keep-all; }
.answerRow p.muted { color: var(--text-tertiary); font-size: 14px; }

.dangerZone { display: flex; justify-content: center; padding: 4px; }
.deleteAction {
  border: 0;
  background: transparent;
  color: var(--color-danger);
  opacity: 0.8;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: var(--label-weight);
  text-decoration: underline;
  text-underline-offset: 4px;
}
.deleteAction:hover, .deleteAction:focus-visible { opacity: 1; }

.emptyState { display: grid; place-items: center; align-content: center; gap: 14px; text-align: center; }
.emptyCaption { color: var(--text-tertiary); font-size: 13px; font-weight: var(--label-weight); }
.emptyState h1 { font-size: 20px; font-weight: var(--display-weight); letter-spacing: var(--tracking-display); }
.emptyState p { max-width: 380px; color: var(--text-secondary); line-height: 1.6; font-size: 14px; }
</style>
