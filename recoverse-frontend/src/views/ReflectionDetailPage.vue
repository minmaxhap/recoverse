<template>
  <section v-if="reflection" class="detailPage">
    <header class="detailHeader">
      <button class="textButton" type="button" @click="$emit('back-home')">홈</button>
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
          지금은 고치기보다 그때의 나를 먼저 읽는 화면입니다.
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

      <section class="answerList">
        <article
          v-for="item in answerItems"
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
    <button class="editButton" type="button" @click="$emit('back-home')">홈으로</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Answer, Question, Reflection } from "../types/reflection";

const props = defineProps<{
  reflection: Reflection | null;
}>();

defineEmits<{
  "back-home": [];
  edit: [];
}>();

const questions = computed<Question[]>(() =>
  props.reflection?.questionGroups.flatMap((group) => group.questions) ?? []
);
const answerMap = computed(() => new Map(props.reflection?.answers.map((answer) => [answer.questionId, answer]) ?? []));
const answeredCount = computed(() =>
  props.reflection?.answers.filter((answer) => answer.value.trim().length > 0).length ?? 0
);
const skippedCount = computed(() =>
  props.reflection?.answers.filter((answer) => answer.skipped).length ?? 0
);
const representativeSentence = computed(() => {
  if (!props.reflection) return "";
  return (
    props.reflection.representativeSentence ??
    props.reflection.answers.find((answer) => answer.value.trim())?.value.trim() ??
    "아직 문장이 없어요. 이어쓰기에서 첫 답변을 남겨보세요."
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

.textButton,
.editButton {
  border-radius: 999px;
  font-weight: 900;
  padding: 11px 14px;
}

.textButton {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.editButton {
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
}
</style>
