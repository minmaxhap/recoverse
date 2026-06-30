<template>
  <section v-if="shareTitle" class="sharedPage">
    <header class="sharedHeader">
      <div>
        <span class="eyebrow">읽기 전용 공유</span>
        <h1>{{ shareTitle }}</h1>
      </div>
    </header>

    <main class="sharedShell">
      <section class="notice">
        <strong>이 화면에서는 수정할 수 없어요.</strong>
        <p>
          공유자가 고른 질문과 답변만 보입니다.
          댓글, 좋아요, 편집 없이 조용히 읽는 공유 화면입니다.
        </p>
      </section>

      <section class="answerList">
        <article v-for="item in visibleItems" :key="item.questionId" class="answerCard">
          <span>{{ item.groupLabel }}</span>
          <h2>{{ item.questionText }}</h2>
          <p>{{ item.answerText || "공유자가 이 질문은 비워두었어요." }}</p>
        </article>
      </section>

      <section class="sameQuestionCta">
        <div>
          <span class="eyebrow">나도 답해보기</span>
          <h2>같은 질문으로 내 회고를 시작할 수 있어요</h2>
        </div>
        <button class="primaryCta" type="button" @click="$emit('answer-same')">
          나도 같은 질문에 답해보기
        </button>
      </section>
    </main>
  </section>

  <section v-else class="sharedPage emptyState">
    <span class="eyebrow">읽기 전용 공유</span>
    <h1>공유된 기억을 열 수 없어요.</h1>
    <p>링크가 잘렸거나 공유할 답변이 없는 상태예요. 내 회고를 새로 시작하거나 다시 받은 링크로 열어주세요.</p>
    <button class="primaryCta" type="button" @click="$emit('answer-same')">
      내 기억 작성하기
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SharedReflectionSnapshot } from "../lib/reflectionShare";
import type { Reflection } from "../types/reflection";

const props = defineProps<{
  reflection: Reflection | null;
  snapshot?: SharedReflectionSnapshot | null;
}>();

defineEmits<{
  "back-home": [];
  "answer-same": [];
}>();

const shareTitle = computed(() => props.snapshot?.title ?? props.reflection?.title ?? "");
const visibleQuestionIds = computed(() => new Set(props.reflection?.shareSettings?.selectedQuestionIds ?? []));
const visibleItems = computed(() => {
  if (props.snapshot) return props.snapshot.items;
  if (!props.reflection) return [];
  const hasSelection = visibleQuestionIds.value.size > 0;

  return props.reflection.questionGroups.flatMap((group) =>
    group.questions.flatMap((question) => {
      if (question.visibility !== "public") return [];
      if (hasSelection && !visibleQuestionIds.value.has(question.id)) return [];
      const answer = props.reflection?.answers.find((item) => item.questionId === question.id);
      return [
        {
          groupLabel: group.label,
          questionId: question.id,
          questionText: question.text,
          answerText: answer?.value.trim() ?? "",
        },
      ];
    })
  );
});
</script>

<style scoped>
.sharedPage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px;
}

.sharedHeader,
.sharedShell {
  width: min(900px, 100%);
  margin: 0 auto;
}

.sharedHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.sharedHeader h1,
.sameQuestionCta h2,
.answerCard h2 {
  margin: 0;
  letter-spacing: 0;
}

.sharedHeader h1 {
  font-family: var(--font-display);
  font-size: clamp(26px, 6vw, 32px);
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
}

.eyebrow,
.answerCard span {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: var(--eyebrow-weight);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

.sharedShell,
.answerList {
  display: grid;
  gap: 12px;
}

.notice,
.answerCard,
.sameQuestionCta {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 18px;
}

.notice strong {
  display: block;
  margin-bottom: 6px;
}

.notice p,
.answerCard p {
  margin: 0;
  color: var(--color-text-dim);
  line-height: var(--leading-body);
}

.answerCard {
  display: grid;
  gap: 8px;
}

.answerCard h2 {
  font-family: var(--font-display);
  font-size: 19px;
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
}

.sameQuestionCta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.primaryCta {
  border-radius: 999px;
  font-weight: var(--heading-weight);
  letter-spacing: 0.01em;
  padding: 11px 14px;
}

.primaryCta {
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
}

.emptyState {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  text-align: center;
}

.emptyState p {
  max-width: 390px;
  color: var(--color-text-dim);
  line-height: 1.6;
}

@media (max-width: 720px) {
  .sharedPage {
    padding: 16px;
  }

  .sharedHeader,
  .sameQuestionCta {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
