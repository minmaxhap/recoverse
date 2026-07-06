<template>
  <section v-if="shareTitle" class="sharedPage bookCapsulePage">
    <header class="sharedHeader">
      <span class="sharedCaption">읽기 전용 공유</span>
      <h1>{{ shareTitle }}</h1>
    </header>

    <main class="sharedShell">
      <section class="notice">
        <strong>이 화면에서는 수정할 수 없어요.</strong>
        <p>공유자가 고른 질문과 답변만 보입니다. 댓글, 좋아요, 편집 없이 조용히 읽는 공유 화면입니다.</p>
      </section>

      <section class="answerList paperPanel">
        <article v-for="(item, idx) in visibleItems" :key="item.questionId" class="answerRow" :class="{ first: idx === 0 }">
          <span class="qLabel">{{ item.groupLabel }}</span>
          <h2>{{ item.questionText }}</h2>
          <p>{{ item.answerText || "공유자가 이 질문은 비워두었어요." }}</p>
        </article>
      </section>

      <section class="sameQuestionCta">
        <div class="ctaCopy">
          <span>나도 답해보기</span>
          <h2>같은 질문으로 내 회고를 시작할 수 있어요.</h2>
        </div>
        <button class="primaryButton" type="button" @click="answerSame">
          나도 같은 질문에 답하기
        </button>
      </section>
    </main>
  </section>

  <section v-else class="sharedPage emptyState">
    <span class="sharedCaption">읽기 전용 공유</span>
    <h1>공유된 기억을 찾을 수 없어요.</h1>
    <p>링크가 잘렸거나 공유할 답변이 없는 상태예요. 새 회고를 시작하거나 다시 받은 링크로 열어주세요.</p>
    <button class="primaryButton" type="button" @click="$emit('start-new')">
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

const emit = defineEmits<{
  "back-home": [];
  "answer-same": [payload: { questions: string[] }];
  "start-new": [];
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

function answerSame() {
  const questions = visibleItems.value.map((item) => item.questionText).filter(Boolean);
  if (questions.length === 0) return;
  emit("answer-same", { questions });
}
</script>

<style scoped>
.sharedPage { min-height: 100vh; color: var(--text-primary); padding: 20px var(--space-page-x) calc(80px + env(safe-area-inset-bottom)); }
.sharedHeader, .sharedShell { width: min(560px, 100%); margin: 0 auto; }
.sharedHeader { display: grid; gap: 4px; margin-bottom: 16px; padding: 0 2px; }
.sharedCaption { color: var(--text-tertiary); font-size: 13px; font-weight: var(--label-weight); }
.sharedHeader h1 {
  margin: 0;
  font-size: 22px;
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  line-height: 1.35;
  word-break: keep-all;
}

.sharedShell { display: grid; gap: 14px; }

.notice {
  border-radius: var(--radius-card);
  background: var(--surface-ink-wash);
  padding: 14px 16px;
}
.notice strong { display: block; margin-bottom: 4px; font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.notice p { margin: 0; color: var(--text-tertiary); font-size: 13px; line-height: var(--leading-body); word-break: keep-all; }

.answerList { display: grid; padding: 4px 0; }
.answerRow { padding: 18px 20px; display: grid; gap: 6px; }
.answerRow + .answerRow { border-top: 1px solid var(--surface-ink-wash); }
.qLabel { color: var(--text-tertiary); font-size: 12px; font-weight: var(--label-weight); }
.answerRow h2 { margin: 0; font-size: 15px; line-height: 1.45; font-weight: 700; letter-spacing: -0.01em; word-break: keep-all; overflow-wrap: anywhere; }
.answerRow p { margin: 0; color: var(--text-secondary); line-height: 1.7; font-size: 15px; word-break: keep-all; }

.sameQuestionCta {
  display: grid;
  gap: 14px;
  border-radius: var(--radius-panel);
  background: var(--surface-letter);
  box-shadow: var(--shadow-letter);
  padding: 18px 20px;
}
.ctaCopy { display: grid; gap: 4px; }
.ctaCopy span { color: var(--text-on-letter-soft); font-size: 12px; font-weight: var(--label-weight); }
.sameQuestionCta h2 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.45; color: var(--text-on-letter); word-break: keep-all; }
.sameQuestionCta .primaryButton { width: 100%; }

.emptyState { display: grid; place-items: center; align-content: center; gap: 14px; text-align: center; }
.emptyState h1 { margin: 0; font-size: 20px; font-weight: var(--display-weight); letter-spacing: var(--tracking-display); }
.emptyState p { max-width: 390px; margin: 0; color: var(--text-secondary); line-height: 1.6; font-size: 14px; }
</style>
