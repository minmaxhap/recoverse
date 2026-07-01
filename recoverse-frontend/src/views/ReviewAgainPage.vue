<template>
  <section class="reviewPage">
    <header class="reviewHeader">
      <div>
        <span class="eyebrow">다시 보기</span>
        <h1>기억을 다시 발견하기</h1>
      </div>
      <figure class="reviewHeaderPhoto editorialPhotoFrame">
        <img src="/design/album-flower-landscape.jpg" alt="말린 꽃과 여행 사진이 놓인 열린 앨범" />
      </figure>
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
        <i aria-hidden="true">R</i>
      </button>
    </main>

    <main v-else class="emptyState">
      <figure class="emptyStatePhoto editorialPhotoFrame">
        <img src="/design/blank-journal.jpg" alt="햇빛 아래 펼쳐진 빈 저널과 안개꽃" />
      </figure>
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
.reviewPage { min-height: calc(100dvh - 54px); background: var(--surface-base); color: var(--text-primary); padding: 22px var(--space-page-x) calc(112px + env(safe-area-inset-bottom)); display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 16px; }
.reviewHeader, .reviewList, .emptyState { width: min(940px, 100%); margin: 0 auto; }
.reviewHeader { display: grid; grid-template-columns: 1fr 180px; gap: 16px; align-items: end; }
.reviewHeaderPhoto { width: 100%; height: 128px; margin: 0; border-radius: 8px; overflow: hidden; }
.reviewHeaderPhoto img { padding: 7px; }
h1, h2, p { margin: 0; letter-spacing: 0; }
.eyebrow, .periodLabel { color: var(--accent-sage); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.reviewHeader h1 { margin-top: 6px; font-family: var(--font-display); font-size: clamp(30px, 5.8vw, 52px); line-height: var(--leading-display); font-weight: var(--display-weight); }
.reviewList { min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; align-content: start; padding-right: 4px; }
.reflectionCard, .emptyState { border: 1px solid var(--border-subtle); border-radius: var(--radius-card); background: rgba(255, 253, 248, 0.86); box-shadow: 0 14px 32px rgba(58, 49, 43, 0.08); }
.reflectionCard { position: relative; width: 100%; min-height: 230px; color: var(--text-primary); padding: 18px; display: grid; gap: 10px; text-align: left; align-content: start; overflow: hidden; transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease; }
.reflectionCard:hover { border-color: var(--border-strong); transform: translateY(-1px); box-shadow: var(--shadow-paper); }
.reflectionCard strong { font-family: var(--font-display); font-size: clamp(21px, 3vw, 28px); line-height: var(--leading-tight); font-weight: var(--display-weight); }
.reflectionCard p { color: var(--text-secondary); line-height: var(--leading-body); overflow-wrap: anywhere; }
.reflectionCard em { width: fit-content; border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); color: var(--text-secondary); padding: 7px 10px; font-size: 12px; font-style: normal; font-weight: var(--label-weight); }
.reflectionCard i { position: absolute; right: 18px; bottom: 18px; width: 42px; height: 42px; border: 1px solid rgba(111, 127, 107, 0.36); border-radius: 50%; display: grid; place-items: center; color: rgba(111, 127, 107, 0.62); font-family: var(--font-display); font-size: 20px; font-style: normal; }
.emptyState { display: grid; place-items: center; align-content: center; gap: 10px; padding: 28px; text-align: center; }
.emptyStatePhoto { width: min(260px, 100%); height: 160px; margin: 0; border-radius: 8px; overflow: hidden; }
.emptyStatePhoto img { padding: 7px; }
.emptyState p { color: var(--text-secondary); line-height: 1.55; }
@media (max-width: 720px) {
  .reviewPage { padding: 16px 14px calc(104px + env(safe-area-inset-bottom)); }
  .reviewHeader { grid-template-columns: 1fr; }
  .reviewHeaderPhoto { height: 154px; }
  .reviewList { grid-template-columns: 1fr; }
  .reflectionCard { padding: 18px; }
}
</style>
