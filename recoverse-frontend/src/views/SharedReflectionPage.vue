<template>
  <section v-if="shareTitle" class="sharedPage">
    <header class="sharedHeader">
      <div>
        <span class="eyebrow">읽기 전용 공유</span>
        <h1>{{ shareTitle }}</h1>
      </div>
      <figure class="sharedPhoto editorialPhotoFrame">
        <img src="/design/wax-seal-closeup.jpg" alt="Recoverse 알파벳 R이 새겨진 초록색 왁스 실링" />
      </figure>
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
          <h2>같은 질문으로 내 회고를 시작할 수 있어요.</h2>
        </div>
        <button class="primaryCta" type="button" @click="$emit('answer-same')">
          나도 같은 질문에 답하기
        </button>
      </section>
    </main>
  </section>

  <section v-else class="sharedPage emptyState">
    <span class="eyebrow">읽기 전용 공유</span>
    <h1>공유된 기억을 찾을 수 없어요.</h1>
    <p>링크가 잘렸거나 공유할 답변이 없는 상태예요. 새 회고를 시작하거나 다시 받은 링크로 열어주세요.</p>
    <button class="primaryCta" type="button" @click="$emit('answer-same')">
      새 기억 작성하기
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
.sharedPage { min-height: 100vh; background: var(--surface-base); color: var(--text-primary); padding: 24px var(--space-page-x) calc(108px + env(safe-area-inset-bottom)); }
.sharedHeader, .sharedShell { width: min(920px, 100%); margin: 0 auto; }
.sharedHeader { display: grid; grid-template-columns: 1fr 170px; align-items: end; gap: 16px; margin-bottom: 22px; }
.sharedPhoto { width: 100%; height: 124px; margin: 0; border-radius: 8px; overflow: hidden; }
.sharedPhoto img { padding: 7px; }
.sharedHeader h1, .sameQuestionCta h2, .answerCard h2 { margin: 0; letter-spacing: 0; }
.sharedHeader h1 { font-family: var(--font-display); font-size: clamp(28px, 6vw, 42px); line-height: var(--leading-tight); font-weight: var(--display-weight); }
.eyebrow, .answerCard span { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.sharedShell, .answerList { display: grid; gap: 12px; }
.notice, .answerCard, .sameQuestionCta { border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: rgba(255, 253, 248, 0.86); padding: 18px; box-shadow: 0 12px 28px rgba(58, 49, 43, 0.07); }
.notice { background: linear-gradient(145deg, rgba(255,253,248,0.94), rgba(221,229,216,0.42)); }
.notice strong { display: block; margin-bottom: 6px; }
.notice p, .answerCard p { margin: 0; color: var(--text-secondary); line-height: var(--leading-body); }
.answerCard { display: grid; gap: 8px; }
.answerCard h2 { font-family: var(--font-display); font-size: 21px; line-height: var(--leading-tight); font-weight: var(--display-weight); }
.sameQuestionCta { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.primaryCta { border: 0; border-radius: var(--radius-pill); background: var(--accent-espresso); color: var(--surface-paper); font-weight: var(--heading-weight); letter-spacing: 0; padding: 12px 15px; }
.emptyState { display: grid; place-items: center; align-content: center; gap: 16px; text-align: center; }
.emptyState p { max-width: 390px; color: var(--text-secondary); line-height: 1.6; }
@media (max-width: 720px) { .sharedPage { padding: 16px 14px calc(104px + env(safe-area-inset-bottom)); } .sharedHeader { grid-template-columns: 1fr; } .sharedPhoto { height: 150px; } .sameQuestionCta { align-items: stretch; flex-direction: column; } }
</style>
