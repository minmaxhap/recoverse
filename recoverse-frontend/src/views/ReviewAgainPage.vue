<template>
  <section class="reviewPage">
    <header class="reviewHeader">
      <div>
        <span class="eyebrow">다시 보기</span>
        <h1>기억을 다시 발견하기</h1>
      </div>
    </header>

    <main v-if="sortedReflections.length" class="reviewList" aria-label="다시 볼 기억 목록">
      <button
        v-for="reflection in sortedReflections"
        :key="reflection.id"
        class="reflectionCard"
        type="button"
        @click="$emit('open-reflection', reflection.id)"
      >
        <span class="periodLabel">{{ reflection.period.label }}</span>
        <strong>{{ reflection.title }}</strong>
        <p>{{ previewText(reflection) }}</p>
        <em>{{ countAnswers(reflection) }}개 답변</em>
      </button>
    </main>

    <main v-else class="emptyState">
      <span class="eyebrow">다시 보기</span>
      <h2>아직 다시 발견할 기억이 없어요.</h2>
      <p>기억 작성 탭에서 첫 답변을 남겨보세요.</p>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Reflection } from "../types/reflection";

const props = defineProps<{
  reflections: Reflection[];
}>();

defineEmits<{
  "back-home": [];
  "open-reflection": [reflectionId: string];
}>();

const sortedReflections = computed(() =>
  [...props.reflections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
);

function countAnswers(reflection: Reflection) {
  return reflection.answers.filter((answer) => answer.value.trim()).length;
}

function previewText(reflection: Reflection) {
  return (
    reflection.representativeSentence?.trim() ||
    reflection.answers.find((answer) => answer.value.trim())?.value.trim() ||
    "아직 첫 문장이 비어 있어요."
  );
}
</script>

<style scoped>
.reviewPage {
  height: calc(100dvh - 54px);
  min-height: 560px;
  background:
    radial-gradient(circle at 72% 18%, rgba(110, 90, 154, 0.18), transparent 30%),
    var(--color-page);
  color: var(--color-text);
  padding: 22px 20px calc(112px + env(safe-area-inset-bottom));
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
}

.reviewHeader,
.reviewList,
.emptyState {
  width: min(920px, 100%);
  margin: 0 auto;
}

h1,
h2,
p {
  margin: 0;
  letter-spacing: 0;
}

.eyebrow,
.periodLabel {
  color: var(--color-star);
  font-size: 11px;
  font-weight: var(--eyebrow-weight);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

.reviewHeader h1 {
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: clamp(28px, 5.8vw, 48px);
  line-height: var(--leading-display);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
}

.reviewList {
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 10px;
  align-content: start;
  padding-right: 4px;
}

.reflectionCard,
.emptyState {
  border: 1px solid rgba(184, 166, 232, 0.16);
  border-radius: 18px;
  background:
    linear-gradient(145deg, rgba(26, 33, 51, 0.9), rgba(17, 19, 34, 0.96)),
    var(--color-surface);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.18);
}

.reflectionCard {
  width: 100%;
  color: var(--color-text);
  padding: 18px;
  display: grid;
  gap: 8px;
  text-align: left;
  transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
}

.reflectionCard:hover {
  border-color: rgba(244, 197, 106, 0.58);
  background:
    linear-gradient(145deg, rgba(26, 33, 51, 0.98), rgba(17, 19, 34, 0.98)),
    var(--color-surface);
  transform: translateY(-1px);
}

.reflectionCard strong {
  font-family: var(--font-display);
  font-size: clamp(20px, 3vw, 26px);
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
}

.reflectionCard p {
  color: var(--color-text-dim);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;
}

.reflectionCard em {
  width: fit-content;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-dim);
  padding: 7px 10px;
  font-size: 12px;
  font-style: normal;
  font-weight: var(--label-weight);
  letter-spacing: 0.02em;
}

.emptyState {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 28px;
  text-align: center;
}

.emptyState p {
  color: var(--color-text-dim);
  line-height: 1.55;
}

@media (prefers-reduced-motion: reduce) {
  .reflectionCard {
    transition: none;
  }
}

@media (max-width: 720px) {
  .reviewPage {
    min-height: 0;
    padding: 16px 14px calc(104px + env(safe-area-inset-bottom));
  }

  .reflectionCard {
    padding: 16px;
  }
}
</style>
