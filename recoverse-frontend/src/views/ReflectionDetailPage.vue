<template>
  <section v-if="reflection" class="detailPage">
    <header class="detailHeader">
      <div>
        <span class="eyebrow">다시 읽는 회고</span>
        <h1>{{ reflection.title }}</h1>
      </div>
      <button class="editButton" type="button" @click="$emit('edit')">수정</button>
    </header>

    <main class="detailShell">
      <section class="heroPanel">
        <span class="heroLabel">{{ reflection.period.label }}</span>
        <h2>{{ representativeSentence }}</h2>
        <p>
          {{ answeredCount }}개의 답변을 남겼고, {{ skippedCount }}개는 건너뛰었어요.
          {{ hasReadableAnswers ? "지금은 고치기보다 그때의 나를 먼저 읽는 화면입니다." : "첫 답변을 남기면 이 화면이 읽기 화면으로 바뀝니다." }}
        </p>
      </section>

      <section class="metaGrid" aria-label="회고 상태">
        <div>
          <span>진행률</span>
          <strong>{{ reflection.completionRate }}%</strong>
        </div>
        <div>
          <span>질문 수</span>
          <strong>{{ questions.length }}개</strong>
        </div>
        <div>
          <span>마지막 수정</span>
          <strong>{{ updatedDate }}</strong>
        </div>
      </section>

      <section v-if="!hasReadableAnswers" class="emptyDraftPanel">
        <div>
          <span class="eyebrow">아직 탐험 전</span>
          <h2>이 회고는 읽기보다 이어쓰기가 먼저예요</h2>
          <p>질문 하나에 한 문장만 남겨도 나중에 다시 발견할 단서가 생깁니다.</p>
        </div>
        <button class="editButton" type="button" @click="$emit('edit')">이어쓰기</button>
      </section>

      <section v-if="shareableItems.length > 0" class="sharePanel">
        <details>
          <summary>공유할 질문 선택</summary>
          <p>공개 가능한 질문만 고를 수 있어요. 선택 후 열리는 화면은 읽기 전용입니다.</p>
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
            읽기 전용 공유 화면 열기
          </button>
        </details>
      </section>

      <section v-if="visibleAnswerItems.length > 0" class="answerList">
        <article
          v-for="item in visibleAnswerItems"
          :key="item.question.id"
          class="answerCard"
          :class="{ empty: !item.answerText }"
        >
          <span>{{ item.groupLabel }}</span>
          <h3>{{ item.question.text }}</h3>
          <p v-if="item.answerText">{{ item.answerText }}</p>
          <p v-else-if="item.answer?.skipped">그때는 이 질문을 지나쳤어요.</p>
          <p v-else>아직 답하지 않은 질문이에요.</p>
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
  share: [questionIds: string[]];
}>();

const shareSelection = ref<string[]>([]);

const questions = computed<Question[]>(() =>
  props.reflection?.questionGroups.flatMap((group) => group.questions) ?? []
);
const answerMap = computed(() => new Map(props.reflection?.answers.map((answer) => [answer.questionId, answer]) ?? []));
const answeredCount = computed(() =>
  props.reflection?.answers.filter((answer) => answer.value.trim().length > 0).length ?? 0
);
const hasReadableAnswers = computed(() => answeredCount.value > 0);
const skippedCount = computed(() =>
  props.reflection?.answers.filter((answer) => answer.skipped).length ?? 0
);
const representativeSentence = computed(() => {
  if (!props.reflection) return "";
  return (
    props.reflection.representativeSentence ??
    props.reflection.answers.find((answer) => answer.value.trim())?.value.trim() ??
    "첫 답변을 기다리는 회고예요."
  );
});
const updatedDate = computed(() => {
  if (!props.reflection) return "";
  return new Date(props.reflection.updatedAt).toLocaleDateString();
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
const visibleAnswerItems = computed(() =>
  answerItems.value.filter((item) => item.answerText || item.answer?.skipped)
);

watch(
  () => props.reflection?.id,
  () => {
    shareSelection.value = shareableItems.value.map((item) => item.question.id);
  },
  { immediate: true }
);
</script>

<style scoped>
.detailPage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px;
}

.detailHeader,
.detailShell {
  width: min(920px, 100%);
  margin: 0 auto;
}

.detailHeader {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.detailHeader h1,
.heroPanel h2,
.answerCard h3 {
  margin: 0;
  letter-spacing: 0;
}

.detailHeader h1 {
  font-size: 26px;
}

.eyebrow,
.heroLabel {
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
.sharePanel,
.emptyDraftPanel,
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
.answerCard p {
  margin: 0;
  color: var(--color-text-dim);
  line-height: 1.6;
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

.metaGrid span,
.answerCard span {
  color: var(--color-text-dim);
  font-size: 12px;
  font-weight: 900;
}

.metaGrid strong {
  font-size: 20px;
}

.answerList {
  display: grid;
  gap: 10px;
}

.emptyDraftPanel {
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.emptyDraftPanel h2 {
  margin: 4px 0 6px;
  font-size: 22px;
  letter-spacing: 0;
}

.emptyDraftPanel p {
  margin: 0;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.sharePanel {
  padding: 16px;
}

.sharePanel summary {
  cursor: pointer;
  font-weight: 900;
}

.sharePanel p {
  margin: 8px 0 12px;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.shareList {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
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

.shareOption span {
  line-height: 1.35;
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

.editButton,
.shareButton {
  border-radius: 999px;
  font-weight: 900;
  padding: 11px 14px;
}

.editButton {
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
}

.shareButton {
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
  .detailPage {
    padding: 16px;
  }

  .detailHeader {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .heroPanel h2 {
    font-size: 25px;
  }

  .metaGrid {
    grid-template-columns: 1fr;
  }

  .emptyDraftPanel {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
