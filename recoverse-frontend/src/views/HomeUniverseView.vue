<template>
  <HomeView>
    <section class="homeSpace" :class="{ empty: reflections.length === 0 }">
      <main class="homeScene" aria-label="Recoverse 기억 공간">
        <div class="starField" aria-hidden="true">
          <span
            v-for="star in stars"
            :key="star.id"
            class="star"
            :class="[`tier-${star.tier}`, star.tint ? `tint-${star.tint}` : null]"
            :style="star.style"
          ></span>
        </div>

        <section v-if="reflections.length === 0" class="emptyState">
          <span class="eyebrow">내 기억 공간</span>
          <h1>내 기억이 쌓이는 공간</h1>
          <p class="emptyHint">한 문장만 남겨도 시간이 지난 뒤 다시 만날 수 있어요.</p>
          <div class="emptyActions">
            <button class="primaryCta" type="button" @click="$emit('start-quick')">
              30초로 한 줄 남기기
            </button>
            <button class="ghostCta" type="button" @click="$emit('start-writing')">
              질문 카드로 작성하기
            </button>
          </div>
          <p class="privacyBadge">
            <span class="privacyDot" aria-hidden="true"></span>
            모든 기억은 이 기기에만 저장돼요. 계정도 서버도 필요 없어요.
          </p>
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

          <button
            v-if="rediscoveryPick"
            class="rediscoveryCard"
            type="button"
            @click="openRediscovery"
          >
            <span class="rediscoveryEyebrow">
              오늘 다시 떠오른 기억 · {{ rediscoveryWindowLabel }}
            </span>
            <strong>{{ rediscoveryPreview }}</strong>
            <span class="rediscoveryMeta">{{ rediscoveryPick.reflection.title }} · 다시 열기</span>
          </button>

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
}>();

const selectedReflectionId = ref<string | null>(null);

type StarTier = "dust" | "soft" | "bright";

interface StarSpec {
  x: number; // % from left
  y: number; // % from top
  tier: StarTier;
  tint?: "warm" | "cool"; // optional color tint
}

// Hand-placed so empty regions feel intentional rather than tiled.
// "bright" stars anchor the eye; "soft" and "dust" fill ambient depth.
const starSpecs: StarSpec[] = [
  // bright anchors — sparse, 4 across the canvas
  { x: 18, y: 22, tier: "bright", tint: "cool" },
  { x: 72, y: 18, tier: "bright" },
  { x: 36, y: 78, tier: "bright", tint: "warm" },
  { x: 88, y: 64, tier: "bright" },

  // soft middle layer
  { x: 8, y: 38, tier: "soft" },
  { x: 28, y: 52, tier: "soft", tint: "cool" },
  { x: 44, y: 14, tier: "soft" },
  { x: 56, y: 44, tier: "soft" },
  { x: 64, y: 68, tier: "soft", tint: "warm" },
  { x: 80, y: 32, tier: "soft" },
  { x: 14, y: 70, tier: "soft" },
  { x: 50, y: 86, tier: "soft", tint: "cool" },
  { x: 92, y: 12, tier: "soft" },

  // dust — many, tiny, low contrast
  { x: 5, y: 14, tier: "dust" },
  { x: 12, y: 28, tier: "dust" },
  { x: 21, y: 8, tier: "dust" },
  { x: 24, y: 64, tier: "dust" },
  { x: 33, y: 32, tier: "dust" },
  { x: 41, y: 60, tier: "dust" },
  { x: 47, y: 28, tier: "dust" },
  { x: 53, y: 12, tier: "dust" },
  { x: 60, y: 26, tier: "dust" },
  { x: 67, y: 50, tier: "dust" },
  { x: 71, y: 8, tier: "dust" },
  { x: 76, y: 78, tier: "dust" },
  { x: 84, y: 22, tier: "dust" },
  { x: 90, y: 48, tier: "dust" },
  { x: 94, y: 84, tier: "dust" },
  { x: 16, y: 88, tier: "dust" },
  { x: 30, y: 18, tier: "dust" },
  { x: 58, y: 76, tier: "dust" },
  { x: 78, y: 56, tier: "dust" },
  { x: 4, y: 78, tier: "dust" },
];

// Stable, varied per-star delay so the field doesn't pulse in sync.
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 99713.61) * 41863.17;
  return x - Math.floor(x);
}

const stars = starSpecs.map((spec, index) => ({
  id: `star-${index}`,
  tier: spec.tier,
  tint: spec.tint ?? null,
  style: {
    "--x": `${spec.x}%`,
    "--y": `${spec.y}%`,
    "--delay": `${(pseudoRandom(index + 1) * -6).toFixed(2)}s`,
    "--duration": `${(4.6 + pseudoRandom(index + 11) * 4).toFixed(2)}s`,
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

const rediscoveryPick = computed(() => pickRediscovery(sortedReflections.value));

const rediscoveryWindowLabel = computed(() =>
  rediscoveryPick.value ? describeWindow(rediscoveryPick.value.window) : ""
);

const rediscoveryPreview = computed(() => {
  const pick = rediscoveryPick.value;
  if (!pick) return "";
  return (
    pick.reflection.representativeSentence?.trim() ||
    pick.reflection.answers.find((answer) => answer.value.trim())?.value.trim() ||
    pick.reflection.title
  );
});

function openRediscovery() {
  const pick = rediscoveryPick.value;
  if (!pick) return;
  if (pick.reflection.isCompleted) {
    emit("open-reflection", pick.reflection.id);
  } else {
    emit("continue-reflection", pick.reflection.id);
  }
}

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
  border-radius: 999px;
  background: var(--color-star);
  transform: translate(-50%, -50%);
  animation: starPulse var(--duration, 6s) ease-in-out infinite;
  animation-delay: var(--delay);
  will-change: opacity, transform;
}

.star.tier-dust {
  --pulse-min: 0.18;
  --pulse-max: 0.45;
  width: 1.5px;
  height: 1.5px;
  box-shadow: 0 0 3px rgba(232, 224, 208, 0.35);
  background: rgba(232, 224, 208, 0.85);
}

.star.tier-soft {
  --pulse-min: 0.42;
  --pulse-max: 0.78;
  width: 2.4px;
  height: 2.4px;
  box-shadow:
    0 0 4px rgba(184, 166, 232, 0.45),
    0 0 10px rgba(184, 166, 232, 0.22);
}

.star.tier-bright {
  --pulse-min: 0.72;
  --pulse-max: 1;
  width: 3.2px;
  height: 3.2px;
  background: #ffffff;
  box-shadow:
    0 0 4px rgba(255, 255, 255, 0.95),
    0 0 14px rgba(184, 166, 232, 0.55),
    0 0 22px rgba(244, 197, 106, 0.18);
}

/* 4-point cross ray on bright anchors */
.star.tier-bright::before,
.star.tier-bright::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  background: rgba(255, 255, 255, 0.55);
  transform: translate(-50%, -50%);
  filter: blur(0.5px);
}

.star.tier-bright::before {
  width: 22px;
  height: 1px;
}

.star.tier-bright::after {
  width: 1px;
  height: 22px;
}

.star.tint-warm {
  background: #f7d9a0;
  box-shadow:
    0 0 4px rgba(247, 217, 160, 0.6),
    0 0 14px rgba(244, 197, 106, 0.35);
}

.star.tint-cool {
  background: #cbd5ff;
  box-shadow:
    0 0 4px rgba(203, 213, 255, 0.55),
    0 0 14px rgba(123, 175, 212, 0.35);
}

.star.tier-bright.tint-warm {
  box-shadow:
    0 0 5px rgba(247, 217, 160, 0.95),
    0 0 18px rgba(244, 197, 106, 0.55),
    0 0 26px rgba(244, 197, 106, 0.22);
}

.star.tier-bright.tint-cool {
  box-shadow:
    0 0 5px rgba(203, 213, 255, 0.95),
    0 0 18px rgba(123, 175, 212, 0.55),
    0 0 26px rgba(123, 175, 212, 0.22);
}

.emptyState,
.memoryField {
  height: 100%;
}

.emptyState {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 18px;
}

.emptyHint {
  max-width: 460px;
  color: var(--color-text-dim);
  font-size: 15px;
  line-height: var(--leading-body);
}

.emptyActions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ghostCta {
  min-height: 52px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  padding: 13px 18px;
  font-weight: var(--heading-weight);
  letter-spacing: 0.01em;
}

.ghostCta:hover,
.ghostCta:focus-visible {
  border-color: var(--color-gold);
}

.privacyBadge {
  margin: 6px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(184, 166, 232, 0.32);
  border-radius: 999px;
  background: rgba(184, 166, 232, 0.08);
  color: var(--color-text-dim);
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.privacyDot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-star);
  box-shadow: 0 0 8px rgba(184, 166, 232, 0.6);
}

.memoryField {
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 18px;
}

.fieldHeader {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.rediscoveryCard {
  width: 100%;
  display: grid;
  gap: 6px;
  border: 1px solid rgba(244, 197, 106, 0.32);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(244, 197, 106, 0.14), rgba(110, 90, 154, 0.18));
  color: var(--color-text);
  padding: 16px 18px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.24);
  transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

.rediscoveryCard:hover,
.rediscoveryCard:focus-visible {
  border-color: var(--color-gold);
  transform: translateY(-2px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.32);
}

.rediscoveryEyebrow {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: var(--eyebrow-weight);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

.rediscoveryCard strong {
  font-family: var(--font-display);
  font-size: clamp(19px, 3vw, 22px);
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
  overflow-wrap: anywhere;
  word-break: keep-all;
}

.rediscoveryMeta {
  color: var(--color-text-dim);
  font-size: 12px;
  font-weight: var(--label-weight);
  letter-spacing: 0.02em;
}

.fieldHeader > div,
.emptyState {
  min-width: 0;
}

.eyebrow {
  color: var(--color-star);
  font-size: 11px;
  font-weight: var(--eyebrow-weight);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
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
  font-family: var(--font-display);
  font-size: clamp(36px, 7vw, 64px);
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-display);
  font-weight: var(--display-weight);
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
  font-family: var(--font-display);
  font-size: clamp(20px, 3vw, 34px);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
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
  font-family: var(--font-display);
  font-size: 24px;
  line-height: var(--leading-tight);
  font-weight: var(--display-weight);
  letter-spacing: var(--tracking-display);
}

.previewPanel p {
  color: var(--color-text-dim);
  line-height: var(--leading-body);
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
  font-weight: var(--label-weight);
  letter-spacing: 0.02em;
}

.primaryCta,
.openButton {
  border: 0;
  border-radius: 999px;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  padding: 13px 18px;
  font-weight: var(--heading-weight);
  letter-spacing: 0.01em;
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
    opacity: var(--pulse-min, 0.38);
    transform: translate(-50%, -50%) scale(0.96);
  }

  50% {
    opacity: var(--pulse-max, 0.86);
    transform: translate(-50%, -50%) scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .star,
  .memoryObject {
    animation: none;
    transition: none;
  }
}

@media (min-width: 920px) {
  .memoryField {
    grid-template-rows: auto minmax(0, 1fr);
  }

  .clusterField {
    margin-right: clamp(320px, 28vw, 400px);
  }

  .previewPanel {
    position: absolute;
    top: clamp(76px, 12vh, 120px);
    right: clamp(20px, 3vw, 36px);
    bottom: auto;
    width: clamp(300px, 26vw, 380px);
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
    font-size: clamp(30px, 9vw, 44px);
  }

  .star.tier-bright::before {
    width: 16px;
  }

  .star.tier-bright::after {
    height: 16px;
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
