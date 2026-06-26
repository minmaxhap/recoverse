<template>
  <section v-if="reflection" class="detailPage">
    <header class="detailHeader">
      <div>
        <span class="eyebrow">검토와 다시 보기</span>
        <h1>{{ reflection.title }}</h1>
      </div>
    </header>

    <main class="detailShell">
      <section class="heroPanel">
        <span class="heroLabel">{{ reflection.period.label }}</span>
        <h2>{{ representativeScene }}</h2>
        <p>{{ representativeEmotion }}</p>
      </section>

      <section class="actionPanel" aria-label="회고 주요 행동">
        <button class="primaryAction" type="button" @click="$emit('edit')">
          {{ reflection.isCompleted ? "답변 수정하기" : "이어쓰기" }}
        </button>
        <button class="secondaryAction" type="button" @click="$emit('review-again')">
          같은 질문 다시보기
        </button>
        <button
          class="secondaryAction"
          type="button"
          :disabled="shareableItems.length === 0"
          @click="openShareOptions"
        >
          공유하기
        </button>
      </section>

      <section class="metaGrid" aria-label="회고 상태">
        <div>
          <span>진행률</span>
          <strong>{{ reflection.completionRate }}%</strong>
        </div>
        <div>
          <span>답변</span>
          <strong>{{ answeredCount }}개</strong>
        </div>
        <div>
          <span>마지막 수정</span>
          <strong>{{ updatedDate }}</strong>
        </div>
      </section>

      <section v-if="shareableItems.length > 0" class="sharePanel">
        <details ref="shareDetailsRef">
          <summary>공유할 답변 고르기</summary>
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
        </details>
      </section>

      <section class="answerList" aria-label="질문과 답변">
        <article
          v-for="item in answerItems"
          :key="item.question.id"
          class="answerCard"
          :class="{ empty: !item.answerText }"
        >
          <span>{{ item.groupLabel }}</span>
          <h3>{{ item.question.text }}</h3>
          <p v-if="item.answerText">{{ item.answerText }}</p>
          <p v-else-if="item.answer?.skipped">이 질문은 지금은 넘겼어요.</p>
          <p v-else>아직 답하지 않은 질문입니다.</p>
        </article>
      </section>
    </main>
  </section>

  <section v-else class="detailPage emptyState">
    <h1>읽을 회고가 없어요.</h1>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Answer, Question, Reflection } from "../types/reflection";

const props = defineProps<{
  reflection: Reflection | null;
}>();

defineEmits<{
  "back-home": [];
  edit: [];
  "review-again": [];
  share: [questionIds: string[]];
}>();

const shareSelection = ref<string[]>([]);
const shareDetailsRef = ref<HTMLDetailsElement | null>(null);

const questions = computed<Question[]>(() =>
  props.reflection?.questionGroups.flatMap((group) => group.questions) ?? []
);
const answerMap = computed(() => new Map(props.reflection?.answers.map((answer) => [answer.questionId, answer]) ?? []));
const answeredCount = computed(() =>
  props.reflection?.answers.filter((answer) => answer.value.trim().length > 0).length ?? 0
);
const firstAnsweredText = computed(() =>
  props.reflection?.answers.find((answer) => answer.value.trim())?.value.trim() ?? ""
);
const representativeScene = computed(() => {
  if (!props.reflection) return "";
  return props.reflection.representativeSentence ?? (firstAnsweredText.value || "아직 대표 장면이 없어요.");
});
const representativeEmotion = computed(() => {
  const emotionQuestion = questions.value.find((question) => question.text.includes("감정"));
  const emotionAnswer = emotionQuestion
    ? answerMap.value.get(emotionQuestion.id)?.value.trim()
    : "";
  if (emotionAnswer) return `가장 가까운 감정: ${emotionAnswer}`;
  return answeredCount.value > 0
    ? "지금은 답변 전체를 천천히 읽어보는 화면입니다."
    : "첫 답변을 남기면 이곳에 기억의 요약이 생깁니다.";
});
const updatedDate = computed(() => {
  if (!props.reflection) return "";
  return new Date(props.reflection.updatedAt).toLocaleDateString("ko-KR");
});
const answerItems = computed(() => {
  if (!props.reflection) return [];

  return props.reflection.questionGroups.flatMap((group) =>
    group.questions.map((question) => {
      const answer = answerMap.value.get(question.id) as Answer | undefined;
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
  },
  { immediate: true }
);

function openShareOptions() {
  if (!shareDetailsRef.value) return;
  shareDetailsRef.value.open = true;
  shareDetailsRef.value.scrollIntoView({ block: "center", behavior: "smooth" });
}
</script>

<style scoped>
.detailPage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px 26px 118px;
}

.detailHeader,
.detailShell {
  width: min(920px, 100%);
  margin: 0 auto;
}

.detailHeader {
  margin-bottom: 22px;
}

h1,
h2,
h3,
p {
  margin: 0;
  letter-spacing: 0;
}

.detailHeader h1 {
  font-size: 26px;
}

.eyebrow,
.heroLabel,
.answerCard span,
.metaGrid span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.detailShell {
  display: grid;
  gap: 14px;
}

.heroPanel,
.answerCard,
.actionPanel,
.sharePanel,
.metaGrid > div {
  border: 1px solid var(--color-soft-border);
  background: var(--color-surface);
  border-radius: 18px;
}

.heroPanel {
  padding: 24px;
  display: grid;
  gap: 10px;
}

.heroPanel h2 {
  font-size: 32px;
  line-height: 1.28;
}

.heroPanel p,
.answerCard p,
.sharePanel p {
  color: var(--color-text-dim);
  line-height: 1.6;
}

.actionPanel {
  padding: 14px;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 10px;
}

.primaryAction,
.secondaryAction,
.shareButton {
  border-radius: 999px;
  font-weight: 900;
  padding: 11px 14px;
}

.secondaryAction,
.shareButton {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.primaryAction {
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
}

.secondaryAction:disabled {
  opacity: 0.45;
}

.metaGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metaGrid > div {
  padding: 15px;
  display: grid;
  gap: 5px;
}

.metaGrid strong {
  font-size: 20px;
}

.sharePanel {
  padding: 16px;
}

.sharePanel summary {
  cursor: pointer;
  font-weight: 900;
}

.shareList,
.answerList {
  display: grid;
  gap: 10px;
}

.shareList {
  margin: 12px 0;
}

.shareOption {
  border: 1px solid var(--color-soft-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  padding: 10px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: start;
}

.answerCard {
  padding: 18px;
  display: grid;
  gap: 8px;
}

.answerCard h3 {
  font-size: 18px;
  line-height: 1.35;
}

.answerCard.empty {
  border-style: dashed;
}

.emptyState {
  display: grid;
  place-items: center;
  align-content: center;
}

@media (max-width: 720px) {
  .detailPage {
    padding: 16px 16px 112px;
  }

  .actionPanel {
    grid-template-columns: 1fr;
  }

  .heroPanel h2 {
    font-size: 25px;
  }

  .metaGrid {
    grid-template-columns: 1fr;
  }
}
</style>
