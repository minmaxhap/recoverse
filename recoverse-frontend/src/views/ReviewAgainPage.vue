<template>
  <section class="reviewPage">
    <header class="reviewHeader">
      <button class="textButton" type="button" @click="$emit('back-home')">홈</button>
      <div>
        <span class="eyebrow">다시 보기</span>
        <h1>같은 질문을 따라가며 과거의 나를 봅니다</h1>
      </div>
    </header>

    <main class="reviewGrid">
      <aside class="panel questionPanel">
        <div class="panelHead">
          <h2>질문별</h2>
          <span>{{ questionOptions.length }}개</span>
        </div>
        <button
          v-for="question in questionOptions"
          :key="question.id"
          class="questionButton"
          :class="{ active: question.id === selectedQuestionId }"
          type="button"
          @click="selectedQuestionId = question.id"
        >
          {{ question.text }}
        </button>
      </aside>

      <section class="panel timelinePanel">
        <div class="panelHead">
          <h2>{{ selectedQuestion?.text ?? "질문을 선택하세요" }}</h2>
          <span>{{ timeline.length }}개 답변</span>
        </div>

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
          같은 질문의 답변이 아직 충분하지 않아요. 비교용 질문 세트로 회고를 하나 더 남기면 이곳이 살아납니다.
        </div>
      </section>

      <aside class="panel sidePanel">
        <div class="panelHead">
          <h2>연도별</h2>
        </div>
        <button
          v-for="period in periodOptions"
          :key="period"
          class="chip"
          type="button"
          @click="openFirstReflectionInPeriod(period)"
        >
          {{ period }}
        </button>

        <div class="panelHead secondaryHead">
          <h2>주제별</h2>
        </div>
        <button
          v-for="topic in topicOptions"
          :key="topic"
          class="chip"
          type="button"
          @click="selectedTopic = topic"
        >
          {{ topic }}
        </button>

        <article class="randomCard">
          <span>랜덤으로 꺼내보기</span>
          <p>{{ randomAnswerText }}</p>
          <button class="smallCta" type="button" @click="pickRandomAnswer">다른 답변</button>
        </article>
      </aside>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { findSameQuestionAnswers, getTimelineQuestionOptions } from "../lib/questionTimeline";
import type { Question, Reflection } from "../types/reflection";

const props = defineProps<{
  reflections: Reflection[];
}>();

const emit = defineEmits<{
  "back-home": [];
  "open-reflection": [reflectionId: string];
}>();

const selectedQuestionId = ref<string | null>(null);
const selectedTopic = ref<string | null>(null);
const randomIndex = ref(0);

const questionOptions = computed<Question[]>(() => getTimelineQuestionOptions(props.reflections));
const selectedQuestion = computed<Question | null>(() => {
  const filtered = selectedTopic.value
    ? questionOptions.value.filter((question) => getQuestionGroupLabel(question) === selectedTopic.value)
    : questionOptions.value;
  return filtered.find((question) => question.id === selectedQuestionId.value) ?? filtered[0] ?? null;
});
const timeline = computed(() =>
  selectedQuestion.value
    ? findSameQuestionAnswers(selectedQuestion.value.text, props.reflections, selectedQuestion.value.id)
    : []
);
const periodOptions = computed(() =>
  Array.from(new Set(props.reflections.map((reflection) => reflection.period.label))).slice(0, 8)
);
const topicOptions = computed(() =>
  Array.from(
    new Set(
      props.reflections.flatMap((reflection) => reflection.questionGroups.map((group) => group.label))
    )
  )
);
const answeredItems = computed(() =>
  props.reflections.flatMap((reflection) =>
    reflection.answers
      .filter((answer) => answer.value.trim())
      .map((answer) => ({
        reflectionId: reflection.id,
        title: reflection.title,
        period: reflection.period.label,
        value: answer.value.trim(),
      }))
  )
);
const randomAnswerText = computed(() => {
  if (answeredItems.value.length === 0) return "아직 꺼내볼 답변이 없어요.";
  const item = answeredItems.value[randomIndex.value % answeredItems.value.length];
  return `${item.period} · ${item.value}`;
});

watch(
  questionOptions,
  (questions) => {
    if (!selectedQuestionId.value && questions[0]) selectedQuestionId.value = questions[0].id;
  },
  { immediate: true }
);

watch(selectedTopic, () => {
  selectedQuestionId.value = selectedQuestion.value?.id ?? null;
});

function getQuestionGroupLabel(question: Question) {
  for (const reflection of props.reflections) {
    const group = reflection.questionGroups.find((item) =>
      item.questions.some((candidate) => candidate.id === question.id)
    );
    if (group) return group.label;
  }
  return "기타";
}

function openFirstReflectionInPeriod(period: string) {
  const reflection = props.reflections.find((item) => item.period.label === period);
  if (reflection) emit("open-reflection", reflection.id);
}

function pickRandomAnswer() {
  if (answeredItems.value.length === 0) return;
  randomIndex.value = (randomIndex.value + 1) % answeredItems.value.length;
}
</script>

<style scoped>
.reviewPage {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-text);
  padding: 26px;
}

.reviewHeader,
.reviewGrid {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.reviewHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.reviewHeader h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 0;
}

.eyebrow {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.reviewGrid {
  display: grid;
  grid-template-columns: 300px 1fr 260px;
  gap: 12px;
}

.panel {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px;
  min-width: 0;
}

.panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.panelHead h2 {
  margin: 0;
  font-size: 16px;
  letter-spacing: 0;
}

.panelHead span {
  color: var(--color-text-dim);
  font-size: 12px;
  font-weight: 900;
}

.questionPanel,
.sidePanel,
.timeline {
  display: grid;
  gap: 8px;
  align-content: start;
}

.questionButton,
.chip,
.timelineCard,
.randomCard {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.questionButton,
.chip {
  padding: 11px 12px;
  text-align: left;
}

.questionButton.active {
  border-color: var(--color-gold);
  background: rgba(244, 197, 106, 0.13);
}

.timelineCard {
  padding: 15px;
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

.timelineCard span,
.randomCard span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.timelineCard p,
.randomCard p,
.empty {
  margin: 0;
  color: var(--color-text-dim);
  line-height: 1.55;
}

.secondaryHead {
  margin-top: 14px;
}

.randomCard {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.textButton,
.smallCta {
  border-radius: 999px;
  font-weight: 900;
  padding: 10px 13px;
}

.textButton {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
}

.smallCta {
  border: 0;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
}

@media (max-width: 900px) {
  .reviewPage {
    padding: 16px;
  }

  .reviewHeader,
  .reviewGrid {
    width: 100%;
  }

  .reviewHeader,
  .reviewGrid {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
