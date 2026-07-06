<template>
  <section class="reviewPage bookCapsulePage">
    <main class="reviewShell">
      <header class="reviewHeader">
        <h1>다시 보기</h1>
        <p>{{ sortedReflections.length }}개의 기록</p>
      </header>

      <section v-if="upcomingReflection" class="capsuleBanner" aria-label="곧 열릴 편지">
        <IconBadge icon="envelope" tint="white" />
        <div>
          <span class="capsuleCaption">곧 열릴 편지</span>
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

      <div v-if="filteredReflections.length" class="recordGroup paperPanel">
        <button
          v-for="(reflection, idx) in filteredReflections"
          :key="reflection.id"
          class="listRow recordRow"
          type="button"
          @click="$emit('open-reflection', reflection.id)"
        >
          <IconBadge icon="envelope" :tint="rowTints[idx % rowTints.length]" :size="36" />
          <span class="rowBody">
            <strong>{{ reflection.title }}</strong>
            <span class="rowMeta">{{ shortDate(reflection.updatedAt) }} · 답변 {{ countAnswers(reflection) }}개</span>
          </span>
          <svg class="rowChevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 3.5 4.5 4.5L6 12.5" />
          </svg>
        </button>
      </div>

      <div v-else-if="sortedReflections.length" class="emptyFilter">
        <p>이 주제에는 아직 회고가 없어요.</p>
      </div>

      <div v-else class="emptyState paperPanel">
        <IconBadge icon="envelope" tint="accent" :size="48" />
        <h2>아직 다시 발견할 기억이 없어요.</h2>
        <p>기억 작성 탭에서 첫 답변을 남겨보세요.</p>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import IconBadge from "../components/IconBadge.vue";
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

const rowTints = ["accent", "blue", "sage", "blush"] as const;

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
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
</script>

<style scoped>
.reviewPage { min-height: calc(100dvh - 54px); color: var(--text-primary); padding: 20px var(--space-page-x) calc(80px + env(safe-area-inset-bottom)); }
.reviewShell { width: min(560px, 100%); margin: 0 auto; display: grid; gap: 16px; }

.reviewHeader { display: grid; gap: 4px; padding: 0 2px; }
.reviewHeader h1 {
  margin: 0;
  font-size: 22px;
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}
.reviewHeader p { margin: 0; color: var(--text-tertiary); font-size: 13px; }

.capsuleBanner {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px 18px;
  border-radius: var(--radius-panel);
  background: var(--surface-letter);
  box-shadow: var(--shadow-letter);
}
.capsuleCaption { color: var(--text-on-letter-soft); font-size: 12px; font-weight: var(--label-weight); }
.capsuleBanner p {
  margin: 4px 0 0;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-on-letter);
  word-break: keep-all;
}

.filterBar { display: flex; gap: 8px; overflow-x: auto; padding: 2px; scrollbar-width: none; }
.filterBar::-webkit-scrollbar { display: none; }
.filterChip {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  border: 0;
  background: var(--surface-paper);
  box-shadow: var(--shadow-photo);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: var(--label-weight);
  transition: background-color var(--motion-quick) var(--ease-soft), color var(--motion-quick) var(--ease-soft);
}
.filterChip.active { background: var(--accent-espresso); color: #fff; }

.recordGroup { overflow: hidden; padding: 4px 0; }
.recordRow { border-radius: 0; }
.recordRow + .recordRow { border-top: 1px solid var(--surface-ink-wash); }
.rowBody { display: grid; gap: 3px; min-width: 0; }
.rowBody strong {
  font-size: 15px;
  font-weight: var(--label-weight);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rowMeta { color: var(--text-tertiary); font-size: 12px; }

.emptyFilter {
  padding: 32px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  border-radius: var(--radius-card);
  background: var(--surface-ink-wash);
}
.emptyFilter p { margin: 0; }

.emptyState { display: grid; place-items: center; gap: 10px; padding: 32px 20px; text-align: center; }
.emptyState h2 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; color: var(--text-primary); word-break: keep-all; }
.emptyState p { margin: 0; color: var(--text-tertiary); line-height: 1.55; font-size: 13px; }
</style>
