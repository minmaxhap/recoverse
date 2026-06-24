<template>
  <section v-if="reflection" class="sharedPage">
    <header class="sharedHeader">
      <div>
        <span class="eyebrow">읽기 전용 공유</span>
        <h1>{{ reflection.title }}</h1>
      </div>
    </header>

    <main class="sharedShell">
      <section class="notice">
        <strong>이 화면에서는 수정할 수 없어요.</strong>
        <p>공유자가 고른 질문과 답변만 보입니다. 댓글, 좋아요, 편집 없이 조용히 읽는 공유 화면입니다.</p>
      </section>

      <section class="answerList">
        <article v-for="item in visibleItems" :key="item.question.id" class="answerCard">
          <span>{{ item.groupLabel }}</span>
          <h2>{{ item.question.text }}</h2>
          <p>{{ item.answerText || "공유된 답변이 아직 없어요." }}</p>
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
    <h1>공유된 회고가 없어요.</h1>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Reflection } from "../types/reflection";

const props = defineProps<{
  reflection: Reflection | null;
}>();

defineEmits<{
  "back-home": [];
  "answer-same": [];
}>();

const visibleQuestionIds = computed(() => new Set(props.reflection?.shareSettings?.selectedQuestionIds ?? []));
const visibleItems = computed(() => {
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
          question,
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
  font-size: 26px;
}

.eyebrow,
.answerCard span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
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
  line-height: 1.6;
}

.answerCard {
  display: grid;
  gap: 8px;
}

.answerCard h2 {
  font-size: 20px;
  line-height: 1.35;
}

.sameQuestionCta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.primaryCta {
  border-radius: 999px;
  font-weight: 900;
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
