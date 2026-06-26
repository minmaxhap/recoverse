<template>
  <HomeView>
    <section class="homeSpace" :class="{ empty: reflections.length === 0 }">
      <main class="homeScene" aria-label="Recoverse 기억 공간">
        <div class="cosmicWash" aria-hidden="true"></div>
        <div class="driftLayer" aria-hidden="true">
          <span v-for="mark in driftMarks" :key="mark" :class="`driftMark mark${mark}`"></span>
        </div>

        <section class="journalSheet">
          <div class="journalCopy">
            <span class="eyebrow">내 기억 공간</span>
            <h1>지나간 나를 다시 만나는 곳</h1>
            <p>
              짧은 질문에 답해두면, 시간이 지난 뒤 그때의 감정과 장면을 다시 발견할 수 있어요.
            </p>
          </div>

          <button
            v-if="featuredReflection"
            class="featuredMemory"
            type="button"
            @click="$emit('open-reflection', featuredReflection.id)"
          >
            <span>오늘 다시 떠오른 기억</span>
            <strong>{{ featuredAnswer }}</strong>
            <em>{{ featuredReflection.period.label }}</em>
          </button>

          <div v-else class="emptyMemory">
            <span>아직 남겨진 기억이 없어요.</span>
            <strong>첫 문장 하나만 남겨도 나중에 다시 만날 수 있어요.</strong>
          </div>

          <div class="homeActions">
            <button class="primaryCta" type="button" @click="$emit('start-writing')">
              {{ reflections.length ? "새 기억 남기기" : "첫 기억 작성하기" }}
            </button>
            <button
              v-if="reflections.length === 0"
              class="draftButton"
              type="button"
              @click="$emit('load-sample')"
            >
              샘플 기억 먼저 보기
            </button>
            <button
              v-if="draftReflection"
              class="draftButton"
              type="button"
              @click="$emit('continue-reflection', draftReflection.id)"
            >
              작성 중인 기억 이어쓰기
            </button>
          </div>
        </section>

        <aside v-if="memoryFragments.length" class="memoryDrift" aria-label="떠다니는 기억 조각">
          <span
            v-for="fragment in memoryFragments"
            :key="fragment.id"
            class="memoryFragment"
            :style="fragment.style"
          >
            {{ fragment.label }}
          </span>
        </aside>
      </main>
    </section>
  </HomeView>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HomeView from "./HomeView.vue";
import type { Reflection } from "../types/reflection";

const props = defineProps<{
  title: string;
  brandLabel: string;
  reflections: Reflection[];
}>();

defineEmits<{
  "start-writing": [];
  "open-reflection": [reflectionId: string];
  "continue-reflection": [reflectionId: string];
  "load-sample": [];
}>();

const driftMarks = [1, 2, 3, 4, 5, 6];

const sortedReflections = computed(() =>
  [...props.reflections].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
);

const featuredReflection = computed(() => {
  return (
    sortedReflections.value.find((reflection) => getFirstAnswer(reflection)) ??
    sortedReflections.value[0] ??
    null
  );
});

const draftReflection = computed(() =>
  sortedReflections.value.find((reflection) => !reflection.isCompleted) ?? null
);

const featuredAnswer = computed(() => {
  if (!featuredReflection.value) return "";
  return featuredReflection.value.representativeSentence?.trim() || getFirstAnswer(featuredReflection.value);
});

const memoryFragments = computed(() =>
  sortedReflections.value
    .filter((reflection) => reflection.id !== featuredReflection.value?.id)
    .slice(0, 4)
    .map((reflection, index) => ({
      id: reflection.id,
      label: reflection.period.label,
      style: {
        "--x": `${fragmentPositions[index].x}%`,
        "--y": `${fragmentPositions[index].y}%`,
        "--r": `${fragmentPositions[index].rotate}deg`,
      },
    }))
);

const fragmentPositions = [
  { x: 74, y: 17, rotate: -7 },
  { x: 82, y: 58, rotate: 8 },
  { x: 17, y: 70, rotate: -10 },
  { x: 24, y: 19, rotate: 6 },
];

function getFirstAnswer(reflection: Reflection) {
  return reflection.answers.find((answer) => answer.value.trim())?.value.trim() ?? "";
}
</script>

<style scoped>
.homeSpace {
  height: calc(100dvh - 54px);
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 18%, rgba(134, 92, 171, 0.18), transparent 26%),
    radial-gradient(circle at 18% 88%, rgba(244, 197, 106, 0.16), transparent 28%),
    linear-gradient(135deg, #1b1721 0%, #211b21 34%, #0c1020 100%);
  color: var(--color-text);
}

.homeScene {
  position: relative;
  width: min(1120px, 100%);
  height: 100%;
  margin: 0 auto;
  padding: clamp(14px, 3vw, 28px) clamp(14px, 3vw, 32px)
    calc(88px + env(safe-area-inset-bottom));
  display: grid;
  place-items: center;
  isolation: isolate;
}

.cosmicWash {
  position: absolute;
  inset: 0;
  z-index: -3;
  background:
    radial-gradient(circle at 67% 35%, rgba(184, 134, 219, 0.22), transparent 14%),
    radial-gradient(circle at 77% 31%, rgba(255, 245, 191, 0.18), transparent 4%),
    radial-gradient(circle at 63% 47%, rgba(68, 92, 148, 0.2), transparent 21%),
    repeating-radial-gradient(circle at 68% 38%, rgba(255, 255, 255, 0.22) 0 1px, transparent 1px 18px);
  mask-image: radial-gradient(circle at 70% 40%, black 0 40%, transparent 68%);
  opacity: 0.95;
}

.homeScene::before {
  content: "";
  position: absolute;
  inset: 10px;
  z-index: -2;
  border-radius: 30px;
  background:
    linear-gradient(90deg, rgba(72, 45, 105, 0.2), transparent 34%),
    radial-gradient(circle at 88% 24%, rgba(30, 18, 54, 0.72), transparent 30%),
    linear-gradient(112deg, #d7bd8c 0%, #b98758 42%, rgba(30, 24, 42, 0.74) 76%, #0b1020 100%);
  box-shadow: inset 0 0 0 1px rgba(82, 48, 26, 0.24), 0 28px 80px rgba(0, 0, 0, 0.34);
}

.homeScene::after {
  content: "";
  position: absolute;
  inset: 14px;
  z-index: -1;
  border-radius: 26px;
  pointer-events: none;
  background:
    linear-gradient(105deg, rgba(90, 45, 18, 0.12), transparent 38%),
    repeating-linear-gradient(93deg, rgba(74, 41, 20, 0.06) 0 1px, transparent 1px 7px),
    radial-gradient(circle at 66% 42%, rgba(117, 77, 152, 0.28), transparent 18%);
  mix-blend-mode: multiply;
}

.journalSheet {
  position: relative;
  z-index: 0;
  width: min(680px, 100%);
  min-height: min(520px, calc(100dvh - 170px));
  padding: clamp(24px, 5vw, 54px);
  display: grid;
  align-content: center;
  gap: clamp(18px, 3vh, 26px);
  color: #251911;
}

.journalSheet > * {
  position: relative;
  z-index: 1;
}

.journalSheet::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 34px 22px 42px 24px;
  background:
    radial-gradient(circle at 84% 22%, rgba(104, 63, 145, 0.15), transparent 23%),
    linear-gradient(100deg, rgba(255, 244, 210, 0.94), rgba(217, 181, 124, 0.82));
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.28), inset 0 0 0 1px rgba(96, 58, 25, 0.16);
  transform: rotate(-1.2deg);
}

.journalCopy {
  display: grid;
  gap: 11px;
}

.eyebrow {
  width: fit-content;
  color: #6b3f20;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

h1,
p,
strong,
em {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  max-width: 520px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(38px, 8vw, 72px);
  line-height: 0.98;
  font-weight: 700;
  color: #26160f;
}

.journalCopy p {
  max-width: 520px;
  color: rgba(37, 25, 17, 0.72);
  font-size: clamp(14px, 2.3vw, 18px);
  line-height: 1.65;
}

.featuredMemory,
.emptyMemory {
  appearance: none;
  width: min(520px, 100%);
  justify-self: start;
  border: 1px solid rgba(99, 58, 26, 0.18);
  border-radius: 6px;
  background:
    linear-gradient(96deg, rgba(255, 251, 232, 0.64), rgba(162, 124, 174, 0.16)),
    rgba(255, 255, 255, 0.22);
  color: #28170f;
  padding: 16px 17px;
  text-align: left;
  line-height: 1.35;
  transform: rotate(0.7deg);
  box-shadow: 0 14px 28px rgba(68, 35, 14, 0.13);
}

.featuredMemory {
  display: grid;
  gap: 8px;
}

.featuredMemory span,
.emptyMemory span {
  color: #7a4f2c;
  font-size: 12px;
  font-weight: 900;
}

.featuredMemory strong,
.emptyMemory strong {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(20px, 3.8vw, 30px);
  line-height: 1.24;
  font-weight: 700;
  white-space: normal;
  overflow-wrap: anywhere;
}

.featuredMemory strong::before,
.featuredMemory strong::after {
  content: "\"";
}

.featuredMemory em {
  display: block;
  color: rgba(37, 25, 17, 0.62);
  font-size: 13px;
  font-style: normal;
  font-weight: 800;
}

.homeActions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.primaryCta,
.draftButton {
  border-radius: 999px;
  font-weight: 900;
  letter-spacing: 0;
}

.primaryCta {
  border: 0;
  background: #2b1810;
  color: #fff0cf;
  padding: 13px 18px;
}

.draftButton {
  border: 1px solid rgba(43, 24, 16, 0.22);
  background: rgba(255, 248, 224, 0.48);
  color: #2b1810;
  padding: 12px 15px;
}

.memoryDrift {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.memoryFragment {
  position: absolute;
  left: var(--x);
  top: var(--y);
  transform: translate(-50%, -50%) rotate(var(--r));
  border: 1px solid rgba(92, 52, 24, 0.18);
  border-radius: 4px;
  background: rgba(245, 220, 164, 0.64);
  color: #3a2113;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
}

.driftLayer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.driftMark {
  position: absolute;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 999px 999px 999px 0;
  background: rgba(244, 197, 106, 0.8);
  filter: blur(0.1px);
  animation: floatMark 9s ease-in-out infinite;
}

.mark1 {
  left: 19%;
  top: 22%;
  background: rgba(235, 175, 133, 0.78);
}

.mark2 {
  left: 78%;
  top: 24%;
  animation-delay: -2s;
  background: rgba(177, 129, 207, 0.72);
}

.mark3 {
  left: 73%;
  top: 72%;
  animation-delay: -4s;
}

.mark4 {
  left: 29%;
  top: 82%;
  animation-delay: -1s;
  background: rgba(255, 234, 176, 0.76);
}

.mark5 {
  left: 85%;
  top: 50%;
  animation-delay: -5s;
  background: rgba(230, 201, 239, 0.78);
}

.mark6 {
  left: 12%;
  top: 54%;
  animation-delay: -3s;
  background: rgba(255, 228, 184, 0.7);
}

@keyframes floatMark {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(18deg);
  }

  50% {
    transform: translate3d(10px, -18px, 0) rotate(58deg);
  }
}

@media (max-width: 720px) {
  .homeScene {
    padding: 12px 12px calc(86px + env(safe-area-inset-bottom));
  }

  .homeScene::before {
    inset: 6px;
    border-radius: 24px;
  }

  .homeScene::after {
    inset: 9px;
    border-radius: 20px;
  }

  .journalSheet {
    min-height: min(510px, calc(100dvh - 158px));
    padding: 26px 24px;
    gap: 16px;
  }

  h1 {
    font-size: clamp(32px, 11vw, 44px);
  }

  .journalCopy p {
    font-size: 14px;
    line-height: 1.55;
  }

  .featuredMemory,
  .emptyMemory {
    padding: 14px;
  }

  .homeActions {
    display: grid;
  }

  .primaryCta,
  .draftButton {
    width: 100%;
    padding: 12px 14px;
  }

  .memoryFragment {
    display: none;
  }
}

@media (max-height: 680px) {
  .journalSheet {
    min-height: 0;
    gap: 12px;
    padding: 22px;
  }

  h1 {
    font-size: clamp(32px, 9vw, 46px);
  }

  .journalCopy p {
    font-size: 13px;
    line-height: 1.45;
  }

  .featuredMemory strong,
  .emptyMemory strong {
    font-size: 19px;
  }
}
</style>
