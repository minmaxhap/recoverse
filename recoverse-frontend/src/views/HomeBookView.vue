<template>
  <HomeView>
    <section class="homePage bookCapsulePage">
      <main class="homeShell" aria-label="Recoverse 홈">
        <header class="greeting">
          <span class="greetingDate">{{ todayLabel }}</span>
          <h1>오늘도 짧게 남겨볼까요?</h1>
        </header>

        <section class="todayCard paperPanel" aria-labelledby="today-question">
          <div class="todayCardHead">
            <IconBadge icon="pen" tint="accent" />
            <span class="cardCaption">오늘의 질문</span>
          </div>
          <p id="today-question" class="todayQuestion">{{ quickQuestion }}</p>
          <button class="primaryButton todayCta" type="button" @click="$emit('start-quick')">
            30초 회고 시작
          </button>
          <button class="textLink" type="button" @click="$emit('start-writing')">
            템플릿으로 시작 →
          </button>
        </section>

        <DeliveryLoopPanel
          :arrival-preview="todayDeliveryCard?.preview ?? ''"
          :arrival-reflection-id="todayDeliveryCard?.reflection.id"
          :arrival-window-label="todayDeliveryCard?.windowLabel"
          :has-reflections="reflections.length > 0"
          @open-arrival="openCompletedMemory"
          @start-quick="$emit('start-quick')"
        />

        <section v-if="memoryCards.length" class="recentSection" aria-labelledby="recent-title">
          <div class="sectionHeader">
            <h2 id="recent-title">최근 기록</h2>
            <button
              v-if="reflections.length > memoryCards.length"
              class="textLink"
              type="button"
              @click="$emit('view-all')"
            >
              전체보기
            </button>
          </div>

          <div class="recentGroup paperPanel">
            <button
              v-for="(card, idx) in memoryCards"
              :key="card.reflection.id"
              class="listRow recentRow"
              type="button"
              @click="openMemory(card.reflection.id, card.reflection.isCompleted)"
            >
              <IconBadge icon="envelope" :tint="rowTints[idx % rowTints.length]" :size="36" />
              <span class="rowBody">
                <strong>{{ card.reflection.title }}</strong>
                <span class="rowMeta">
                  {{ shortDate(card.reflection.updatedAt) }} · 답변 {{ countAnswers(card.reflection) }}개
                  <em v-if="!card.reflection.isCompleted" class="draftChip">작성 중</em>
                </span>
              </span>
              <svg class="rowChevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m6 3.5 4.5 4.5L6 12.5" />
              </svg>
            </button>
          </div>
        </section>
      </main>
    </section>
  </HomeView>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DeliveryLoopPanel from "../components/DeliveryLoopPanel.vue";
import IconBadge from "../components/IconBadge.vue";
import HomeView from "./HomeView.vue";
import type { Reflection } from "../types/reflection";
import { getPreviewSentence } from "../lib/reflectionPreview";
import { QUICK_QUESTION_TEXT } from "../lib/quickReflection";
import { describeWindow, pickRediscovery } from "../lib/rediscovery";

const props = defineProps<{
  title: string;
  brandLabel: string;
  reflections: Reflection[];
}>();

const emit = defineEmits<{
  "start-writing": [];
  "start-quick": [];
  "open-reflection": [reflectionId: string];
  "continue-reflection": [reflectionId: string];
  "load-sample": [];
  "view-all": [];
}>();

const quickQuestion = QUICK_QUESTION_TEXT;

const rowTints = ["accent", "blue", "sage", "blush"] as const;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const todayLabel = computed(() => {
  const now = new Date();
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;
});

const sortedReflections = computed(() =>
  [...props.reflections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
);

const memoryCards = computed(() =>
  sortedReflections.value.slice(0, 5).map((reflection) => ({
    reflection,
    preview: getPreviewSentence(reflection),
  }))
);

const rediscoveryPick = computed(() => pickRediscovery(props.reflections));

const todayDeliveryCard = computed(() => {
  const pick = rediscoveryPick.value;
  if (!pick) return null;
  return {
    reflection: pick.reflection,
    preview: getPreviewSentence(pick.reflection),
    windowLabel: describeWindow(pick.window),
  };
});

function countAnswers(reflection: Reflection) {
  return reflection.answers.filter((answer) => answer.value.trim()).length;
}

function shortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function openMemory(reflectionId: string, isCompleted: boolean) {
  if (isCompleted) {
    emit("open-reflection", reflectionId);
    return;
  }
  emit("continue-reflection", reflectionId);
}

function openCompletedMemory(reflectionId: string) {
  emit("open-reflection", reflectionId);
}
</script>

<style scoped>
.homePage { padding: 20px var(--space-page-x) calc(80px + env(safe-area-inset-bottom)); }
.homeShell { width: min(560px, 100%); margin: 0 auto; display: grid; gap: 20px; }

.greeting { display: grid; gap: 4px; padding: 4px 2px 0; }
.greetingDate { color: var(--text-tertiary); font-size: 13px; font-weight: var(--label-weight); }
.greeting h1 {
  margin: 0;
  font-size: 22px;
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  word-break: keep-all;
}

.todayCard { display: grid; gap: 14px; padding: 20px; }
.todayCardHead { display: flex; align-items: center; gap: 10px; }
.cardCaption { color: var(--text-tertiary); font-size: 13px; font-weight: var(--label-weight); }
.todayQuestion {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  word-break: keep-all;
}
.todayCta { width: 100%; }

.textLink {
  justify-self: center;
  border: 0;
  background: transparent;
  padding: 4px 8px;
  color: var(--accent-sage);
  font-size: 13px;
  font-weight: var(--label-weight);
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  margin-bottom: 10px;
}
.sectionHeader h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
.sectionHeader .textLink { justify-self: auto; padding: 4px 2px; }

.recentGroup { overflow: hidden; padding: 4px 0; }
.recentRow { border-radius: 0; }
.recentRow + .recentRow { border-top: 1px solid var(--surface-ink-wash); }

.rowBody { display: grid; gap: 3px; min-width: 0; }
.rowBody strong {
  font-size: 15px;
  font-weight: var(--label-weight);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rowMeta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}
.draftChip {
  font-style: normal;
  font-size: 11px;
  font-weight: var(--label-weight);
  color: var(--accent-sage);
  background: var(--color-chip);
  border-radius: 6px;
  padding: 2px 6px;
}

@media (min-width: 900px) {
  .homePage { padding-top: 32px; }
  .homeShell { width: min(640px, 100%); }
}
</style>
