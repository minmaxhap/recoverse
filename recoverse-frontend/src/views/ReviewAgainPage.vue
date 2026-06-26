<template>
  <section class="reviewPage">
    <header class="reviewHeader">
      <div>
        <span class="eyebrow">다시 보기</span>
        <h1>시기와 질문으로 다시 발견하기</h1>
      </div>
    </header>

    <main v-if="reflections.length" class="reviewLayout">
      <aside class="panel groupPanel">
        <div class="panelHead">
          <h2>기억 묶음</h2>
          <span>{{ memoryGroups.length }}개</span>
        </div>
        <button
          v-for="group in memoryGroups"
          :key="group.key"
          class="groupButton"
          :class="{ active: group.key === selectedGroupKey }"
          type="button"
          @click="selectGroup(group.key)"
        >
          <strong>{{ group.label }}</strong>
          <span>{{ group.description }}</span>
        </button>
      </aside>

      <section class="panel memoryPanel">
        <div class="panelHead">
          <h2>{{ selectedGroup?.label ?? "기억 목록" }}</h2>
          <span>{{ groupReflections.length }}개</span>
        </div>

        <div class="memoryRail">
          <button
            v-for="reflection in groupReflections"
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
        </div>

        <div v-if="selectedAnswerItems.length" class="answerList">
          <article v-for="item in selectedAnswerItems" :key="item.question.id" class="answerCard">
            <span>{{ item.groupLabel }}</span>
            <h3>{{ item.question.text }}</h3>
            <p>{{ item.answerText }}</p>
          </article>
        </div>
        <div v-else class="empty">
          이 기억에는 아직 답변이 없어요. 이어 쓰면 이곳에 질문/답변 카드가 쌓입니다.
        </div>
      </section>

      <aside class="panel comparePanel">
        <div class="panelHead">
          <h2>같은 질문 비교</h2>
          <span>{{ groupQuestionOptions.length }}개</span>
        </div>
        <select v-model="selectedQuestionId">
          <option v-for="question in groupQuestionOptions" :key="question.id" :value="question.id">
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

type MemoryGroup = {
  key: string;
  label: string;
  description: string;
  reflections: Reflection[];
};

const selectedGroupKey = ref<string | null>(null);
const selectedReflectionId = ref<string | null>(props.reflections[0]?.id ?? null);
const selectedQuestionId = ref<string | null>(null);

const memoryGroups = computed<MemoryGroup[]>(() => {
  const buckets = new Map<string, Reflection[]>();

  for (const reflection of props.reflections) {
    const key = groupKeyForReflection(reflection);
    const list = buckets.get(key) ?? [];
    list.push(reflection);
    buckets.set(key, list);
  }

  return Array.from(buckets.entries())
    .map(([key, items]) => ({
      key,
      label: groupLabel(key),
      description: groupDescription(items),
      reflections: sortReflections(items),
    }))
    .sort((a, b) => sortGroupKey(a.key, b.key));
});
const selectedGroup = computed(() => {
  return (
    memoryGroups.value.find((group) => group.key === selectedGroupKey.value) ??
    memoryGroups.value[0] ??
    null
  );
});
const groupReflections = computed(() => selectedGroup.value?.reflections ?? []);
const selectedReflection = computed(() =>
  groupReflections.value.find((reflection) => reflection.id === selectedReflectionId.value) ??
  groupReflections.value[0] ??
  null
);
const answerMap = computed(
  () => new Map(selectedReflection.value?.answers.map((answer) => [answer.questionId, answer]) ?? [])
);
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
const groupQuestionOptions = computed<Question[]>(() =>
  getTimelineQuestionOptions(groupReflections.value).filter((question) =>
    groupReflections.value.some((reflection) =>
      reflection.answers.some((answer) => answer.questionId === question.id && answer.value.trim())
    )
  )
);
const selectedQuestion = computed<Question | null>(
  () =>
    groupQuestionOptions.value.find((question) => question.id === selectedQuestionId.value) ??
    groupQuestionOptions.value[0] ??
    null
);
const timeline = computed(() =>
  selectedQuestion.value
    ? findSameQuestionAnswers(
        selectedQuestion.value.text,
        groupReflections.value,
        selectedQuestion.value.id
      )
    : []
);

watch(
  memoryGroups,
  (groups) => {
    if (!groups.length) {
      selectedGroupKey.value = null;
      selectedReflectionId.value = null;
      return;
    }

    const selectedStillExists = groups.some((group) => group.key === selectedGroupKey.value);
    if (!selectedStillExists) selectedGroupKey.value = groups[0].key;
  },
  { immediate: true }
);

watch(
  groupReflections,
  (reflections) => {
    if (!reflections.some((reflection) => reflection.id === selectedReflectionId.value)) {
      selectedReflectionId.value = reflections[0]?.id ?? null;
    }
  },
  { immediate: true }
);

watch(
  groupQuestionOptions,
  (questions) => {
    if (!questions.some((question) => question.id === selectedQuestionId.value)) {
      selectedQuestionId.value = questions[0]?.id ?? null;
    }
  },
  { immediate: true }
);

function selectGroup(key: string) {
  selectedGroupKey.value = key;
  const first = memoryGroups.value.find((group) => group.key === key)?.reflections[0];
  selectedReflectionId.value = first?.id ?? null;
}

function groupKeyForReflection(reflection: Reflection) {
  if (reflection.type === "travel") return "topic:travel";
  const year = reflection.period.year ?? extractYear(reflection.period.label);
  if (year) return `year:${year}`;
  return `topic:${reflection.type}`;
}

function extractYear(label: string) {
  const match = label.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function groupLabel(key: string) {
  if (key.startsWith("year:")) return `${key.replace("year:", "")}년`;
  if (key === "topic:travel") return "여행";
  if (key === "topic:life_chapter") return "인생 시기";
  if (key === "topic:project") return "프로젝트";
  if (key === "topic:relationship") return "관계";
  return "기타";
}

function groupDescription(reflections: Reflection[]) {
  const labels = reflections.map((reflection) => reflection.period.label).slice(0, 3);
  const rest = reflections.length - labels.length;
  return rest > 0 ? `${labels.join(" · ")} 외 ${rest}개` : labels.join(" · ");
}

function sortGroupKey(a: string, b: string) {
  if (a.startsWith("year:") && b.startsWith("year:")) {
    return Number(b.replace("year:", "")) - Number(a.replace("year:", ""));
  }
  if (a.startsWith("year:")) return -1;
  if (b.startsWith("year:")) return 1;
  return a.localeCompare(b);
}

function sortReflections(reflections: Reflection[]) {
  return reflections.slice().sort((a, b) => {
    const weight = periodWeight(a) - periodWeight(b);
    if (weight !== 0) return weight;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

function periodWeight(reflection: Reflection) {
  const label = reflection.period.label;
  if (label.includes("올해") || label.includes("한 해")) return 1;
  if (label.includes("상반기")) return 2;
  if (label.includes("하반기")) return 3;
  if (reflection.type === "travel") return 4;
  return 5;
}

function countAnswers(reflection: Reflection) {
  return reflection.answers.filter((answer) => answer.value.trim()).length;
}
</script>

<style scoped>
.reviewPage {
  height: calc(100dvh - 54px);
  min-height: 560px;
  background: var(--color-page);
  color: var(--color-text);
  padding: 20px 20px calc(112px + env(safe-area-inset-bottom));
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
}

.reviewHeader,
.reviewLayout,
.emptyState {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.reviewHeader {
  min-width: 0;
}

h1,
h2,
h3,
p {
  margin: 0;
  letter-spacing: 0;
}

.reviewHeader h1 {
  font-size: clamp(24px, 4vw, 34px);
}

.eyebrow,
.panelHead span,
.groupButton span,
.memoryButton span,
.answerCard span,
.timelineCard span {
  color: var(--color-gold);
  font-size: 12px;
  font-weight: 900;
}

.reviewLayout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 300px;
  gap: 12px;
  align-items: start;
  min-height: 0;
  overflow: hidden;
}

.panel,
.emptyState {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px;
}

.panel {
  max-height: 100%;
  overflow: auto;
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

.groupPanel,
.answerList,
.timeline,
.comparePanel {
  display: grid;
  gap: 8px;
}

.groupButton,
.memoryButton,
.answerCard,
.timelineCard,
.empty {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.groupButton,
.memoryButton {
  color: var(--color-text);
  padding: 12px;
  text-align: left;
  display: grid;
  gap: 5px;
}

.groupButton.active,
.memoryButton.active {
  border-color: var(--color-gold);
  background: rgba(244, 197, 106, 0.13);
}

.memoryRail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
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
.emptyState p,
.groupButton span {
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

.emptyState {
  display: grid;
  gap: 8px;
}

@media (max-width: 1040px) {
  .reviewLayout {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .groupPanel {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .groupPanel .panelHead {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .reviewPage {
    min-height: 0;
    padding: 16px 14px calc(104px + env(safe-area-inset-bottom));
  }

  .memoryRail {
    grid-template-columns: 1fr;
  }
}
</style>
