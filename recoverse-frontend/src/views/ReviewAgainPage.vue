<template>
  <section class="reviewPage">
    <header class="reviewHeader">
      <div>
        <span class="eyebrow">다시 보기</span>
        <h1>내가 남긴 답변을 다시 발견하는 곳</h1>
      </div>
    </header>

    <main v-if="reflections.length" class="reviewLayout">
      <aside class="panel memoryListPanel">
        <div class="panelHead">
          <h2>기억 목록</h2>
          <span>{{ reflections.length }}개</span>
        </div>
        <button
          v-for="reflection in reflections"
          :key="reflection.id"
          class="memoryButton"
          :class="{ active: reflection.id === selectedReflectionId }"
          type="button"
          @click="selectedReflectionId = reflection.id"
        >
          <span>{{ reflection.period.label }}</span>
          <strong>{{ reflection.title }}</strong>
          <em>{{ countAnswers(reflection) }}개 답변</em>
        </button>
      </aside>

      <section class="panel answerPanel">
        <div class="panelHead">
          <h2>{{ selectedReflection?.title ?? "기억을 선택하세요" }}</h2>
          <button
            v-if="selectedReflection"
            class="smallCta"
            type="button"
            @click="$emit('open-reflection', selectedReflection.id)"
          >
            상세 열기
          </button>
        </div>

        <div v-if="selectedAnswerItems.length" class="answerList">
          <article v-for="item in selectedAnswerItems" :key="item.question.id" class="answerCard">
            <span>{{ item.groupLabel }}</span>
            <h3>{{ item.question.text }}</h3>
            <p>{{ item.answerText }}</p>
          </article>
        </div>
        <div v-else class="empty">
          아직 답변이 있는 질문이 없어요. 작성 탭에서 첫 질문에 답해보세요.
        </div>
      </section>

      <aside class="panel comparePanel">
        <div class="panelHead">
          <h2>같은 질문 비교</h2>
          <span>{{ questionOptions.length }}개</span>
        </div>
        <select v-model="selectedQuestionId">
          <option v-for="question in questionOptions" :key="question.id" :value="question.id">
            {{ question.text }}
          </option>
        </select>

        <div v-if="timeline.length" class="timeline">
          <article v-for="item in timeline" :key="`${item.reflectionId}-${item.questionId}`" class="timelineCard">
            <button type="button" @click="$emit('open-reflection', item.reflectionId)">
              <span>{{ item.period.label }}</span>
              <strong>{{ item.reflectionTitle }}</strong>
            </button>
            <p>{{ item.answer.value }}</p>
          </article>
        </div>
        <div v-else class="empty">
          같은 질문에 답한 회고가 더 쌓이면 변화가 보입니다.
        </div>
      </aside>
    </main>

    <main v-else class="emptyState">
      <h2>아직 다시 볼 회고가 없어요.</h2>
      <p>기억 작성 탭에서 첫 회고를 남기면 이곳에 답변 카드가 쌓입니다.</p>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { findSameQuestionAnswers, getTimelineQuestionOptions } from "../lib/questionTimeline";
import type { Answer, Question, Reflection } from "../types/reflection";

const props = defineProps<{
  reflections: Reflection[];
}>();

defineEmits<{
  "back-home": [];
  "open-reflection": [reflectionId: string];
}>();

const selectedReflectionId = ref<string | null>(props.reflections[0]?.id ?? null);
const selectedQuestionId = ref<string | null>(null);

const selectedReflection = computed(() =>
  props.reflections.find((reflection) => reflection.id === selectedReflectionId.value) ?? props.reflections[0] ?? null
);
const answerMap = computed(() => new Map(selectedReflection.value?.answers.map((answer) => [answer.questionId, answer]) ?? []));
const selectedAnswerItems = computed(() => {
  if (!selectedReflection.value) return [];

  return selectedReflection.value.questionGroups.flatMap((group) =>
    group.questions.flatMap((question) => {
      const answer = answerMap.value.get(question.id) as Answer | undefined;
      const answerText = answer?.value.trim() ?? "";
      if (!answerText) return [];
      return [{ groupLabel: group.label, question, answerText }];
    })
  );
});
const questionOptions = computed<Question[]>(() =>
  getTimelineQuestionOptions(props.reflections).filter((question) =>
    props.reflections.some((reflection) =>
      reflection.answers.some((answer) => answer.questionId === question.id && answer.value.trim())
    )
  )
);
const selectedQuestion = computed<Question | null>(
  () => questionOptions.value.find((question) => question.id === selectedQuestionId.value) ?? questionOptions.value[0] ?? null
);
const timeline = computed(() =>
  selectedQuestion.value
    ? findSameQuestionAnswers(selectedQuestion.value.text, props.reflections, selectedQuestion.value.id)
    : []
);

watch(
  () => props.reflections,
  (reflections) => {
    if (!selectedReflectionId.value && reflections[0]) selectedReflectionId.value = reflections[0].id;
  },
  { immediate: true }
);

watch(
  questionOptions,
  (questions) => {
    if (!selectedQuestionId.value && questions[0]) selectedQuestionId.value = questions[0].id;
  },
  { immediate: true }
);

function countAnswers(reflection: Reflection) {
  return reflection.answers.filter((answer) => answer.value.trim()).length;
}
</script>

<style scoped>
.reviewPage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px 26px 118px;
}

.reviewHeader,
.reviewLayout,
.emptyState {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.reviewHeader {
  margin-bottom: 22px;
}

h1,
h2,
h3,
p {
  margin: 0;
  letter-spacing: 0;
}

.reviewHeader h1 {
  font-size: 28px;
}

.eyebrow,
.panelHead span,
.memoryButton span,
.answerCard span,
.timelineCard span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.reviewLayout {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 12px;
  align-items: start;
}

.panel,
.emptyState {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px;
}

.panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.panelHead h2 {
  font-size: 16px;
}

.memoryListPanel,
.answerList,
.timeline,
.comparePanel {
  display: grid;
  gap: 8px;
}

.memoryButton,
.answerCard,
.timelineCard,
.empty {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.memoryButton {
  color: var(--color-text);
  padding: 12px;
  text-align: left;
  display: grid;
  gap: 5px;
}

.memoryButton.active {
  border-color: var(--color-gold);
  background: rgba(244, 197, 106, 0.13);
}

.memoryButton em {
  color: var(--color-text-dim);
  font-size: 12px;
  font-style: normal;
}

.answerCard,
.timelineCard,
.empty {
  padding: 14px;
}

.answerCard {
  display: grid;
  gap: 8px;
}

.answerCard h3 {
  font-size: 18px;
  line-height: 1.35;
}

.answerCard p,
.timelineCard p,
.empty,
.emptyState p {
  color: var(--color-text-dim);
  line-height: 1.55;
}

.comparePanel select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text);
  padding: 11px 12px;
}

.timelineCard {
  display: grid;
  gap: 10px;
}

.timelineCard button {
  border: 0;
  background: transparent;
  color: var(--color-text);
  padding: 0;
  text-align: left;
  display: grid;
  gap: 3px;
}

.smallCta {
  border: 0;
  border-radius: 999px;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  padding: 9px 12px;
  font-weight: 900;
}

.emptyState {
  display: grid;
  gap: 8px;
}

@media (max-width: 960px) {
  .reviewPage {
    padding: 16px 16px 112px;
  }

  .reviewLayout {
    grid-template-columns: 1fr;
  }
}
</style>
