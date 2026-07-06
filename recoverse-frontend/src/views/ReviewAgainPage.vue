<template>
  <section class="reviewPage">
    <header class="reviewHeader">
      <span class="eyebrow">다시 보기</span>
      <h1>회고 앨범</h1>
    </header>

    <main class="reviewShell">
      <section v-if="upcomingReflection" class="capsuleBanner" aria-label="곧 열릴 편지">
        <span class="capsuleDot" aria-hidden="true"></span>
        <div>
          <span class="capsuleEyebrow">곧 열릴 편지</span>
          <p>{{ upcomingCopy }}</p>
        </div>
      </section>

      <nav v-if="sortedReflections.length" class="filterBar" aria-label="주제 필터">
        <button
          v-for="option in filterOptions"
          :key="option.id"
          class="filterChip"
          :class="{ active: activeFilter === option.id }"
          type="button"
          @click="activeFilter = option.id"
        >
          {{ option.label }}
        </button>
      </nav>

      <div v-if="filteredReflections.length" class="albumGrid">
        <button
          v-for="(reflection, idx) in filteredReflections"
          :key="reflection.id"
          class="albumCard"
          :class="`tone-${cardTones[idx % cardTones.length]}`"
          type="button"
          @click="$emit('open-reflection', reflection.id)"
        >
          <h3>{{ reflection.title }}</h3>
          <span class="cardMeta">{{ shortDate(reflection.updatedAt) }} · 답변 {{ countAnswers(reflection) }}</span>
        </button>
      </div>

      <div v-else-if="sortedReflections.length" class="emptyFilter">
        <p>이 주제에는 아직 회고가 없어요.</p>
      </div>

      <div v-else class="emptyState">
        <figure class="emptyStatePhoto editorialPhotoFrame">
          <img src="/design/blank-journal.jpg" alt="햇빛 아래 펼쳐진 빈 저널과 안개꽃" />
        </figure>
        <span class="eyebrow">빈 앨범</span>
        <h2>아직 다시 발견할 기억이 없어요.</h2>
        <p>기억 작성 탭에서 첫 답변을 남겨보세요.</p>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Reflection } from "../types/reflection";
import { getPreviewSentence } from "../lib/reflectionPreview";
import { describeWindow, pickRediscovery } from "../lib/rediscovery";

const props = defineProps<{
  reflections: Reflection[];
}>();

defineEmits<{
  "back-home": [];
  "open-reflection": [reflectionId: string];
}>();

type FilterId = "all" | "year" | "travel" | "daily" | "other";

const filterOptions: Array<{ id: FilterId; label: string; match: (r: Reflection) => boolean }> = [
  { id: "all", label: "전체", match: () => true },
  { id: "year", label: "연말", match: (r) => matchLabel(r, ["연말", "한 해", "year"]) },
  { id: "travel", label: "여행", match: (r) => matchLabel(r, ["여행", "trip"]) },
  { id: "daily", label: "일상", match: (r) => matchLabel(r, ["일상", "오늘", "이번주"]) },
  { id: "other", label: "기타", match: (r) => !matchesAnyKnown(r) },
];

const activeFilter = ref<FilterId>("all");

const cardTones = ["parch", "blue", "sage", "paper"] as const;

const sortedReflections = computed(() =>
  [...props.reflections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
);

const filteredReflections = computed(() => {
  const filter = filterOptions.find((option) => option.id === activeFilter.value);
  if (!filter) return sortedReflections.value;
  return sortedReflections.value.filter(filter.match);
});

const rediscoveryPick = computed(() => pickRediscovery(props.reflections));
const upcomingReflection = computed(() => rediscoveryPick.value?.reflection ?? null);

const upcomingCopy = computed(() => {
  const pick = rediscoveryPick.value;
  if (!pick) return "";
  const preview = getPreviewSentence(pick.reflection, 32);
  return `${describeWindow(pick.window)} 남긴 "${preview}"를 다시 열어보세요.`;
});

function matchLabel(r: Reflection, keywords: string[]) {
  const label = `${r.period.label} ${r.title}`.toLowerCase();
  return keywords.some((kw) => label.includes(kw.toLowerCase()));
}

function matchesAnyKnown(r: Reflection) {
  return filterOptions
    .filter((option) => option.id !== "all" && option.id !== "other")
    .some((option) => option.match(r));
}

function countAnswers(reflection: Reflection) {
  return reflection.answers.filter((answer) => answer.value.trim()).length;
}

function shortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

</script>

<style scoped>
.reviewPage { min-height: calc(100dvh - 54px); background: transparent; color: var(--text-primary); padding: 22px var(--space-page-x) calc(112px + env(safe-area-inset-bottom)); }
.reviewHeader, .reviewShell { width: min(940px, 100%); margin: 0 auto; }
.reviewHeader { display: grid; gap: 6px; margin-bottom: 22px; }
.eyebrow { color: var(--accent-wax); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
h1, h2, h3, p { margin: 0; letter-spacing: 0; }
.reviewHeader h1 { font-family: var(--font-display); font-size: clamp(30px, 5.8vw, 44px); line-height: var(--leading-tight); font-weight: var(--display-weight); word-break: keep-all; }

.reviewShell { display: grid; gap: 20px; }

.capsuleBanner {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: center;
  padding: 18px 20px;
  border-radius: 14px;
  background: var(--surface-blush);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}
.capsuleDot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, #a75f47, var(--accent-wax) 62%, #6f3a29);
  box-shadow: 0 4px 10px rgba(142, 78, 56, 0.3);
  flex-shrink: 0;
}
.capsuleEyebrow { color: var(--accent-wax); font-size: 11px; font-weight: var(--eyebrow-weight); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; }
.capsuleBanner p { margin: 6px 0 0; font-family: var(--font-display); font-size: 17px; line-height: 1.42; font-weight: var(--display-weight); color: var(--accent-espresso); word-break: keep-all; }

.filterBar { display: flex; flex-wrap: wrap; gap: 8px; }
.filterChip { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border-strong); background: rgba(255, 253, 248, 0.72); color: var(--text-secondary); font-size: 13px; font-weight: var(--label-weight); }
.filterChip:hover { color: var(--text-primary); border-color: var(--accent-sage); }
.filterChip.active { background: var(--accent-espresso); color: var(--surface-paper); border-color: var(--accent-espresso); }

.albumGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
.albumCard {
  position: relative;
  aspect-ratio: 0.86;
  padding: 16px 14px 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  color: var(--text-primary);
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  box-shadow: 0 8px 18px rgba(58, 49, 43, 0.05);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  overflow: hidden;
}
.albumCard:hover { transform: translateY(-2px); border-color: var(--border-strong); box-shadow: 0 14px 28px rgba(58, 49, 43, 0.09); }
.albumCard.tone-parch { background: var(--surface-parchment); }
.albumCard.tone-blue { background: var(--surface-blue); }
.albumCard.tone-sage { background: var(--surface-sage); }
.albumCard.tone-paper { background: var(--surface-paper); }
.albumCard h3 { font-family: var(--font-display); font-size: 18px; line-height: 1.32; font-weight: var(--display-weight); color: var(--text-primary); word-break: keep-all; }
.albumCard .cardMeta { color: var(--text-tertiary); font-size: 11px; }

.emptyFilter { padding: 32px; text-align: center; color: var(--text-secondary); border: 1px dashed var(--border-strong); border-radius: 12px; }

.emptyState { display: grid; place-items: center; align-content: center; gap: 12px; padding: 28px; text-align: center; border: 1px solid var(--border-subtle); border-radius: 12px; background: rgba(255, 253, 248, 0.86); }
.emptyStatePhoto { width: min(260px, 100%); height: 160px; margin: 0; border-radius: 8px; overflow: hidden; }
.emptyState p { color: var(--text-secondary); line-height: 1.55; }

@media (max-width: 720px) {
  .reviewPage { padding: 16px 14px calc(104px + env(safe-area-inset-bottom)); }
  .albumGrid { grid-template-columns: 1fr 1fr; gap: 12px; }
  .capsuleBanner { padding: 14px 16px; }
  .capsuleBanner p { font-size: 15px; }
  .albumCard { padding: 14px 12px 16px; }
  .albumCard h3 { font-size: 16px; }
}
</style>
