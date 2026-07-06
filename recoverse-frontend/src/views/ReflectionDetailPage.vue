<template>
  <section v-if="reflection" class="detailPage">
    <main class="detailShell">
      <section class="coverPanel paperPanel">
        <span class="ribbonBookmark" aria-hidden="true"></span>
        <h1>{{ reflection.title }}</h1>
        <p class="coverMeta">
          {{ updatedDate }} · 답변 {{ answeredCount }}개
          <template v-if="!reflection.isCompleted"> · 진행률 {{ reflection.completionRate }}%</template>
        </p>
        <figure v-if="detailPhoto" class="coverPhoto editorialPhotoFrame">
          <img :src="detailPhoto.src" :alt="detailPhoto.alt" />
        </figure>
      </section>

      <section v-if="representativeScene" class="quotePanel" aria-label="이 회고의 한 문장">
        <span class="quoteEyebrow">이 회고의 한 문장</span>
        <p class="quoteText">"{{ representativeScene }}"</p>
        <p v-if="representativeEmotion" class="quoteEmotion">{{ representativeEmotion }}</p>
      </section>

      <section class="actionPanel" aria-label="회고 주요 행동">
        <button
          v-if="reflection.isCompleted"
          class="primaryAction"
          type="button"
          @click="$emit('review-again')"
        >
          같은 질문 다시 보기
        </button>
        <button v-else class="primaryAction" type="button" @click="$emit('edit')">
          이어쓰기
        </button>
        <button
          class="secondaryAction"
          type="button"
          :class="{ active: shareOpen }"
          :disabled="shareableItems.length === 0"
          @click="toggleShareOptions"
        >
          공유하기
        </button>
        <button v-if="reflection.isCompleted" class="tertiaryAction" type="button" @click="$emit('edit')">
          답변 수정
        </button>
      </section>

      <section class="dangerZone">
        <button class="deleteAction" type="button" @click="confirmDelete">
          이 회고 삭제하기
        </button>
      </section>

      <section v-if="shareOpen && shareableItems.length > 0" ref="sharePanelRef" class="sharePanel">
        <p>친구에게 보여줘도 괜찮은 질문만 고르면 수정할 수 없는 읽기 전용 화면이 만들어집니다.</p>
        <div class="shareList">
          <label v-for="item in shareableItems" :key="item.question.id" class="shareOption">
            <input v-model="shareSelection" type="checkbox" :value="item.question.id" />
            <span>{{ item.question.text }}</span>
          </label>
        </div>
        <button
          class="shareButton"
          type="button"
          :disabled="shareSelection.length === 0"
          @click="$emit('share', shareSelection)"
        >
          읽기 전용 링크 만들기
        </button>
      </section>

      <section class="answerList" aria-label="질문과 답변">
        <article
          v-for="(item, idx) in answerItems"
          :key="item.question.id"
          class="answerRow"
          :class="{ empty: !item.answerText, first: idx === 0 }"
        >
          <span class="qLabel">Q{{ idx + 1 }} · {{ item.groupLabel }}</span>
          <h3>{{ item.question.text }}</h3>
          <p v-if="item.answerText">{{ item.answerText }}</p>
          <p v-else-if="item.answer?.skipped" class="muted">이 질문은 지금은 건너뛰었어요.</p>
          <p v-else class="muted">아직 비어 있는 질문이에요. 이어쓰기에서 천천히 채울 수 있어요.</p>
        </article>
      </section>
    </main>
  </section>

  <section v-else class="detailPage emptyState">
    <span class="eyebrow">회고 열람</span>
    <h1>열어볼 기억을 찾지 못했어요.</h1>
    <p>홈으로 돌아가면 오늘 다시 떠오른 기억을 보거나 새 기억을 시작할 수 있어요.</p>
    <button class="primaryAction" type="button" @click="$emit('back-home')">홈으로 돌아가기</button>
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
const detailPhoto = computed(() =>
  props.reflection?.isCompleted
    ? {
        src: "/design/album-flower-landscape.jpg",
        alt: "말린 꽃과 여행 사진이 놓인 열린 앨범",
      }
    : {
        src: "/design/blank-journal.jpg",
        alt: "햇빛 아래 펼쳐진 빈 저널과 안개꽃",
      }
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
.detailPage { min-height: 100vh; background: transparent; color: var(--text-primary); padding: 22px var(--space-page-x) calc(112px + env(safe-area-inset-bottom)); }
.detailShell { width: min(720px, 100%); margin: 0 auto; display: grid; gap: 18px; }
h1, h2, h3, p { margin: 0; letter-spacing: 0; }

.coverPanel { position: relative; padding: 26px 24px 24px; border-radius: 16px; display: grid; gap: 10px; overflow: visible; }
.coverPanel::after {
  content: "";
  position: absolute;
  top: 18px;
  right: 60px;
  width: 42px;
  height: 10px;
  background:
    radial-gradient(circle at 5px 5px, var(--accent-wax) 0 4px, transparent 4px),
    radial-gradient(circle at 21px 5px, var(--accent-wax) 0 4px, transparent 4px),
    radial-gradient(circle at 37px 5px, var(--accent-wax) 0 4px, transparent 4px);
  opacity: 0.75;
  pointer-events: none;
}
.coverPanel h1 { font-family: var(--font-display); font-size: clamp(28px, 6vw, 40px); line-height: 1.24; font-weight: var(--display-weight); color: var(--accent-espresso); word-break: keep-all; }
.coverMeta { color: var(--text-tertiary); font-size: 13px; }
.coverPhoto { margin: 12px 0 0; width: 100%; height: 220px; border-radius: 10px; overflow: hidden; }

.quotePanel { padding: 22px 20px; border-radius: 14px; background: var(--surface-sage); border: 1px solid var(--border-subtle); display: grid; gap: 10px; }
.quoteEyebrow { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.quoteText { font-family: var(--font-display); font-size: clamp(18px, 3.6vw, 22px); line-height: 1.5; color: var(--text-primary); word-break: keep-all; }
.quoteEmotion { color: var(--text-secondary); font-size: 13px; line-height: var(--leading-body); }

.actionPanel { padding: 10px; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; border: 1px solid var(--border-subtle); border-radius: 14px; background: rgba(255, 253, 248, 0.86); }
.primaryAction, .secondaryAction, .tertiaryAction, .shareButton { border-radius: var(--radius-pill); font-weight: var(--heading-weight); letter-spacing: 0; padding: 11px 14px; }
.primaryAction { border: 0; background: var(--accent-espresso); color: var(--surface-paper); box-shadow: 0 12px 26px rgba(58, 49, 43, 0.22); }
.secondaryAction, .shareButton { border: 1px solid var(--border-strong); background: transparent; color: var(--text-primary); }
.secondaryAction:hover:not(:disabled), .secondaryAction:focus-visible, .shareButton:hover:not(:disabled), .shareButton:focus-visible { border-color: var(--accent-sage); background: rgba(111, 127, 107, 0.08); }
.secondaryAction.active { border-color: var(--accent-sage); background: var(--surface-sage); }
.tertiaryAction { border: 0; background: transparent; color: var(--text-secondary); padding: 9px 12px; font-size: 12px; text-decoration: underline; text-underline-offset: 4px; }
.tertiaryAction:hover:not(:disabled), .tertiaryAction:focus-visible { color: var(--text-primary); }
.secondaryAction:disabled, .tertiaryAction:disabled { opacity: 0.45; }

.dangerZone { display: flex; justify-content: center; padding: 4px; }
.deleteAction { border: 0; background: transparent; color: var(--color-danger); opacity: 0.72; padding: 8px 12px; font-size: 13px; font-weight: var(--label-weight); text-decoration: underline; text-underline-offset: 4px; }
.deleteAction:hover, .deleteAction:focus-visible { opacity: 1; }

.sharePanel { padding: 16px; border: 1px solid var(--border-subtle); border-radius: 14px; background: rgba(255, 253, 248, 0.86); }
.sharePanel p { margin: 0; color: var(--text-secondary); line-height: var(--leading-body); font-size: 13px; }
.shareList { display: grid; gap: 8px; margin: 12px 0; }
.shareOption { border: 1px solid var(--border-subtle); border-radius: 10px; background: rgba(251, 244, 236, 0.56); padding: 10px; display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: start; }

.answerList { display: grid; gap: 0; padding: 8px 4px; }
.answerRow { padding: 20px 4px; border-top: 1px solid var(--border-subtle); display: grid; gap: 7px; }
.answerRow.first { border-top: 0; padding-top: 8px; }
.qLabel { color: var(--text-tertiary); font-size: 11px; font-weight: var(--label-weight); letter-spacing: 0.06em; }
.answerRow h3 { font-family: var(--font-display); font-size: 17px; line-height: 1.4; font-weight: var(--display-weight); color: var(--accent-espresso); word-break: keep-all; }
.answerRow p { color: var(--text-primary); line-height: 1.7; font-size: 15px; word-break: keep-all; }
.answerRow p.muted { color: var(--text-tertiary); font-size: 14px; font-style: italic; }

.emptyState { display: grid; place-items: center; align-content: center; gap: 14px; text-align: center; }
.emptyState p { max-width: 380px; color: var(--text-secondary); line-height: 1.6; }

@media (max-width: 720px) {
  .detailPage { padding: 16px 16px calc(108px + env(safe-area-inset-bottom)); }
  .actionPanel { grid-template-columns: 1fr; }
  .coverPanel { padding: 22px 20px; }
  .coverPanel::after { right: 44px; }
  .coverPhoto { height: 180px; }
  .coverPanel h1 { font-size: 26px; }
}
</style>
