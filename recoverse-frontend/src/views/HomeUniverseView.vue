<template>
  <HomeView>
    <section class="homeSpace" :class="{ empty: reflections.length === 0 }">
      <main class="homeScene" aria-label="Recoverse 기억 공간">
        <div class="starField" aria-hidden="true">
          <span
            v-for="star in stars"
            :key="star.id"
            class="star"
            :style="star.style"
          ></span>
        </div>

        <section v-if="reflections.length === 0" class="emptyState">
          <span class="eyebrow">내 기억 공간</span>
          <h1>내 기억이 쌓이는 공간</h1>
          <button class="primaryCta" type="button" @click="$emit('start-writing')">
            첫 기억 작성하기
          </button>
        </section>

        <section v-else class="memoryField" aria-label="연도별 기억 묶음">
          <header class="fieldHeader">
            <div>
              <span class="eyebrow">내 기억 공간</span>
              <h1>{{ title }}</h1>
            </div>
            <button class="primaryCta compact" type="button" @click="$emit('start-writing')">
              새 기억 남기기
            </button>
          </header>

          <div class="clusterField">
            <section
              v-for="cluster in yearClusters"
              :key="cluster.year"
              class="yearCluster"
              :style="cluster.style"
              :aria-label="`${cluster.year} 기억 묶음`"
            >
              <span class="yearLabel">{{ cluster.year }}</span>
              <button
                v-for="node in cluster.nodes"
                :key="node.reflection.id"
                class="memoryObject"
                :class="{
                  selected: node.reflection.id === selectedReflection?.id,
                  draft: !node.reflection.isCompleted,
                }"
                :style="node.style"
                type="button"
                @click="selectReflection(node.reflection.id)"
              >
                <span>{{ node.reflection.period.label }}</span>
              </button>
            </section>
          </div>

          <aside v-if="selectedReflection" class="previewPanel" aria-live="polite">
            <span class="eyebrow">{{ previewLabel }}</span>
            <h2>{{ selectedReflection.title }}</h2>
            <p>{{ previewSentence }}</p>
            <div class="previewMeta">
              <span>{{ selectedReflection.period.label }}</span>
              <span>{{ selectedReflection.completionRate }}%</span>
            </div>
            <button class="openButton" type="button" @click="openSelectedReflection">
              {{ selectedReflection.isCompleted ? "열어보기" : "이어쓰기" }}
            </button>
          </aside>
        </section>
      </main>
    </section>
  </HomeView>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import HomeView from "./HomeView.vue";
import type { Reflection } from "../types/reflection";

const props = defineProps<{
  title: string;
  brandLabel: string;
  reflections: Reflection[];
}>();

const emit = defineEmits<{
  "start-writing": [];
  "open-reflection": [reflectionId: string];
  "continue-reflection": [reflectionId: string];
  "load-sample": [];
}>();

const selectedReflectionId = ref<string | null>(null);

const starPositions = [
  { x: 8, y: 14, size: 2 },
  { x: 15, y: 32, size: 1 },
  { x: 22, y: 18, size: 2 },
  { x: 29, y: 76, size: 1 },
  { x: 36, y: 40, size: 2 },
  { x: 43, y: 12, size: 1 },
  { x: 48, y: 68, size: 2 },
  { x: 55, y: 30, size: 1 },
  { x: 61, y: 84, size: 2 },
  { x: 67, y: 18, size: 1 },
  { x: 73, y: 56, size: 2 },
  { x: 79, y: 24, size: 1 },
  { x: 86, y: 72, size: 2 },
  { x: 92, y: 38, size: 1 },
  { x: 11, y: 88, size: 2 },
  { x: 95, y: 12, size: 1 },
  { x: 5, y: 56, size: 1 },
];

const stars = Array.from({ length: 34 }, (_, index) => ({
  id: `star-${index}`,
  style: {
    "--x": `${starPositions[index % starPositions.length].x}%`,
    "--y": `${starPositions[index % starPositions.length].y}%`,
    "--size": `${starPositions[index % starPositions.length].size}px`,
    "--delay": `${(index % 8) * -0.65}s`,
  },
}));

const sortedReflections = computed(() =>
  [...props.reflections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
);

const selectedReflection = computed(() => {
  if (selectedReflectionId.value) {
    const selected = sortedReflections.value.find(
      (reflection) => reflection.id === selectedReflectionId.value
    );
    if (selected) return selected;
  }

  return sortedReflections.value[0] ?? null;
});

const previewLabel = computed(() =>
  selectedReflection.value?.isCompleted ? "기억 미리보기" : "작성 중인 기억"
);

const previewSentence = computed(() => {
  const reflection = selectedReflection.value;
  if (!reflection) return "";
  return (
    reflection.representativeSentence?.trim() ||
    reflection.answers.find((answer) => answer.value.trim())?.value.trim() ||
    "아직 첫 문장이 비어 있어요."
  );
});

const yearClusters = computed(() => {
  const groups = new Map<string, Reflection[]>();

  sortedReflections.value.forEach((reflection) => {
    const year = getReflectionYear(reflection);
    groups.set(year, [...(groups.get(year) ?? []), reflection]);
  });

  return [...groups.entries()].map(([year, reflections], index) => ({
    year,
    style: {
      "--cluster-y": `${clusterRows[index % clusterRows.length]}%`,
    },
    nodes: reflections.map((reflection, reflectionIndex) => {
      const position = nodePositions[(reflectionIndex + index * 2) % nodePositions.length];
      return {
        reflection,
        style: {
          "--node-x": `${position.x}%`,
          "--node-y": `${position.y}%`,
          "--node-size": `${reflection.isCompleted ? position.size : position.size + 8}px`,
        },
      };
    }),
  }));
});

watch(
  () => props.reflections.map((reflection) => reflection.id).join("|"),
  () => {
    if (!selectedReflectionId.value) return;
    if (props.reflections.some((reflection) => reflection.id === selectedReflectionId.value)) return;
    selectedReflectionId.value = null;
  }
);

function selectReflection(reflectionId: string) {
  selectedReflectionId.value = reflectionId;
}

function openSelectedReflection() {
  const reflection = selectedReflection.value;
  if (!reflection) return;

  if (reflection.isCompleted) {
    emit("open-reflection", reflection.id);
    return;
  }

  emit("continue-reflection", reflection.id);
}

function getReflectionYear(reflection: Reflection) {
  if (reflection.period.year) return String(reflection.period.year);

  const createdYear = new Date(reflection.createdAt).getFullYear();
  return Number.isFinite(createdYear) ? String(createdYear) : "기억";
}

const clusterRows = [18, 42, 66];

const nodePositions = [
  { x: 13, y: 40, size: 44 },
  { x: 31, y: 68, size: 34 },
  { x: 49, y: 32, size: 40 },
  { x: 66, y: 58, size: 30 },
  { x: 83, y: 36, size: 38 },
  { x: 24, y: 23, size: 32 },
  { x: 74, y: 76, size: 34 },
];
</script>

<style scoped>
.homeSpace {
  height: calc(100dvh - 54px);
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--color-page) 0%, var(--color-bg) 100%);
  color: var(--color-text);
}

.homeScene {
  position: relative;
  width: min(1180px, 100%);
  height: 100%;
  margin: 0 auto;
  padding: clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px)
    calc(92px + env(safe-area-inset-bottom));
  isolation: isolate;
}

.starField {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.star {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--size);
  height: var(--size);
  border-radius: 999px;
  background: var(--color-star);
  opacity: 0.68;
  animation: starPulse 5.2s ease-in-out infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 12px rgba(184, 166, 232, 0.32);
}

.emptyState,
.memoryField {
  height: 100%;
}

.emptyState {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 22px;
}

.memoryField {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 18px;
}

.fieldHeader {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.fieldHeader > div,
.emptyState {
  min-width: 0;
}

.eyebrow {
  color: var(--color-star);
  font-size: 12px;
  font-weight: 900;
}

h1,
h2,
p {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  max-width: 680px;
  margin-top: 8px;
  font-size: clamp(40px, 8vw, 76px);
  line-height: 1.02;
  font-weight: 900;
  color: var(--color-text);
}

.clusterField {
  position: relative;
  min-height: 0;
  border: 1px solid var(--color-soft-border);
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(26, 33, 51, 0.5), rgba(17, 19, 34, 0.74));
  overflow: hidden;
}

.clusterField::before {
  content: "";
  position: absolute;
  inset: 13% 8%;
  border: 1px solid rgba(110, 90, 154, 0.24);
  border-radius: 50%;
  transform: rotate(-8deg);
}

.yearCluster {
  position: absolute;
  left: 5%;
  right: 5%;
  top: var(--cluster-y);
  height: 26%;
  min-height: 118px;
}

.yearLabel {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(232, 224, 208, 0.58);
  font-size: clamp(20px, 3vw, 34px);
  font-weight: 900;
}

.memoryObject {
  position: absolute;
  left: var(--node-x);
  top: var(--node-y);
  width: var(--node-size);
  height: var(--node-size);
  transform: translate(-50%, -50%);
  border: 1px solid rgba(184, 166, 232, 0.52);
  border-radius: 999px;
  background:
    linear-gradient(145deg, rgba(184, 166, 232, 0.88), rgba(110, 90, 154, 0.72));
  color: transparent;
  padding: 0;
  box-shadow: 0 0 0 8px rgba(110, 90, 154, 0.1), 0 18px 34px rgba(0, 0, 0, 0.28);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.memoryObject span {
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  width: max-content;
  min-width: 72px;
  max-width: 110px;
  transform: translateX(-50%);
  color: var(--color-text-dim);
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
  word-break: keep-all;
  overflow-wrap: anywhere;
  text-align: center;
}

.memoryObject.draft {
  border-color: rgba(244, 197, 106, 0.76);
  background:
    linear-gradient(145deg, rgba(244, 197, 106, 0.88), rgba(110, 90, 154, 0.62));
}

.memoryObject.selected,
.memoryObject:hover {
  transform: translate(-50%, -50%) scale(1.08);
  border-color: var(--color-gold);
  box-shadow: 0 0 0 11px rgba(244, 197, 106, 0.11), 0 18px 42px rgba(0, 0, 0, 0.34);
}

.previewPanel {
  position: absolute;
  right: clamp(18px, 4vw, 42px);
  bottom: clamp(22px, 5vh, 42px);
  width: min(360px, calc(100% - 36px));
  border: 1px solid rgba(184, 166, 232, 0.22);
  border-radius: 18px;
  background:
    linear-gradient(145deg, rgba(26, 33, 51, 0.94), rgba(17, 19, 34, 0.96));
  padding: 18px;
  display: grid;
  gap: 12px;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.34);
}

.previewPanel h2 {
  font-size: 24px;
  line-height: 1.18;
}

.previewPanel p {
  color: var(--color-text-dim);
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.previewMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.previewMeta span {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-dim);
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 900;
}

.primaryCta,
.openButton {
  border: 0;
  border-radius: 999px;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  padding: 13px 18px;
  font-weight: 900;
}

.primaryCta {
  min-height: 52px;
}

.primaryCta.compact {
  min-width: 148px;
  min-height: 44px;
  padding: 11px 15px;
}

.openButton {
  width: fit-content;
}

@keyframes starPulse {
  0%,
  100% {
    opacity: 0.38;
  }

  50% {
    opacity: 0.86;
  }
}

@media (prefers-reduced-motion: reduce) {
  .star,
  .memoryObject {
    animation: none;
    transition: none;
  }
}

@media (max-width: 760px) {
  .homeScene {
    padding: 14px 14px calc(90px + env(safe-area-inset-bottom));
  }

  .fieldHeader {
    align-items: start;
    display: grid;
  }

  h1 {
    font-size: clamp(34px, 11vw, 48px);
  }

  .clusterField {
    border-radius: 18px;
  }

  .clusterField::before {
    inset: 16% -8%;
  }

  .yearCluster {
    left: 4%;
    right: 4%;
  }

  .yearLabel {
    font-size: 18px;
  }

  .memoryObject span {
    max-width: 82px;
    font-size: 10px;
  }

  .previewPanel {
    left: 14px;
    right: 14px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    width: auto;
  }
}

@media (max-height: 680px) {
  .homeScene {
    padding-top: 12px;
  }

  .memoryField {
    gap: 12px;
  }

  .previewPanel {
    padding: 14px;
    gap: 9px;
  }

  .previewPanel h2 {
    font-size: 20px;
  }
}
</style>
