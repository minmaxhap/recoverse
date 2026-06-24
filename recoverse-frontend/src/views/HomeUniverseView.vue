<template>
  <HomeView>
    <section class="panel">
      <HomeHeader
        :brand-label="brandLabel"
        :title="title"
      />

      <section class="reflectionDock" aria-label="오늘 다시 만나는 나">
        <div class="dockHead">
          <div>
            <span class="dockEyebrow">오늘 다시 만나는 나</span>
            <h2>{{ todayReflection ? primarySectionTitle : "돌아볼 시간을 하나 고르세요" }}</h2>
          </div>
          <button class="smallCta" type="button" @click="$emit('open-new-reflection')">
            새 회고
          </button>
        </div>

        <article v-if="todayReflection" class="todayCard">
          <button
            class="todayButton"
            type="button"
            @click="openReflectionFromHome(todayReflection)"
          >
            <span>{{ todayReflection.period.label }}</span>
            <strong>{{ todayReflection.title }}</strong>
            <em>{{ getReflectionPreview(todayReflection) }}</em>
          </button>
          <button
            class="continueButton"
            type="button"
            @click="$emit('continue-reflection', todayReflection.id)"
          >
            {{ todayReflection.isCompleted ? "다시 읽기" : "이어쓰기" }}
          </button>
        </article>

        <div v-if="recentReflections.length > 1" class="recentRail">
          <button
            v-for="reflection in recentReflections.slice(1)"
            :key="reflection.id"
            class="recentChip"
            type="button"
            @click="openReflectionFromHome(reflection)"
          >
            <span>{{ reflection.period.label }}</span>
            <strong>{{ reflection.title }}</strong>
          </button>
        </div>

        <div v-if="reflections.length === 0" class="reflectionEmpty">
          <p>연말, 여행, 20대, 상반기처럼 돌아볼 시간을 하나 고르면 질문 카드가 열려요.</p>
          <button class="primaryCta" type="button" @click="$emit('open-new-reflection')">
            첫 회고 시작
          </button>
        </div>
      </section>

      <template v-if="capsules.length === 0 && reflections.length === 0">
        <section class="onboarding" aria-label="Recoverse onboarding">
          <div class="onboardingCopy">
            <span class="onboardingEyebrow">RECOVERSE</span>
            <h2>나의 기억 우주에<br />오신 것을 환영해요</h2>
          </div>

          <div class="heroPlanet" aria-hidden="true">
            <span class="planetGlow"></span>
            <span class="planetBody"></span>
            <span class="planetRing"></span>
          </div>

          <div class="onboardingMessage">
            <h3>아직 회고가 없어요.</h3>
            <p>처음에는 하나의 질문에 답하는 것만으로 충분해요.</p>
          </div>

          <button class="primaryCta" type="button" @click="$emit('open-new-reflection')">
            첫 회고 시작
          </button>
        </section>
      </template>

      <template v-else-if="capsules.length > 0 && reflections.length === 0">
        <DiscoveryCard
          :card="discoveryCard"
          :capsule-title="discoveryCapsuleTitle"
          :answer-preview="discoveryAnswerPreview"
          :labels="discoveryLabels"
          @open="$emit('open-discovery')"
        />

        <GalaxyMap
          :items="homeCapsuleItems"
          :galaxies="galaxies"
          :selected-capsule-id="selectedCapsuleId"
          :selected-galaxy-id="selectedGalaxyId"
          :labels="galaxyMapLabels"
          @select="$emit('select-capsule', $event)"
          @select-galaxy="$emit('select-galaxy', $event)"
          @start-create="$emit('open-new-reflection')"
          @start-create-galaxy="$emit('open-galaxy-create-flow')"
        />
      </template>

      <nav class="bottomNav" :aria-label="bottomNavLabels.home">
        <button class="navItem active" type="button">
          <NavIcon name="home" />
          <span>{{ bottomNavLabels.home }}</span>
        </button>
        <button
          class="navItem"
          type="button"
          @click="$emit('open-new-reflection')"
        >
          <NavIcon name="write" />
          <span>{{ bottomNavLabels.write }}</span>
        </button>
        <button class="navItem" type="button" @click="$emit('open-review')">
          <NavIcon name="review" />
          <span>{{ bottomNavLabels.review }}</span>
        </button>
        <button class="navItem" type="button" @click="$emit('open-shared')">
          <NavIcon name="share" />
          <span>{{ bottomNavLabels.shared }}</span>
        </button>
        <button class="navItem" type="button" @click="$emit('open-archive')">
          <NavIcon name="archive" />
          <span>{{ bottomNavLabels.archive }}</span>
        </button>
      </nav>
    </section>
  </HomeView>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DiscoveryCard from "../components/DiscoveryCard.vue";
import GalaxyMap from "../components/GalaxyMap.vue";
import HomeHeader from "../components/HomeHeader.vue";
import NavIcon from "../components/NavIcon.vue";
import type { Capsule, CapsuleCard } from "../lib/recoverseStore";
import type { CapsuleHomeItem } from "../lib/capsuleHomeData";
import type { Reflection } from "../types/reflection";
import type { Galaxy } from "../types/recoverseFuture";
import HomeView from "./HomeView.vue";

const props = defineProps<{
  title: string;
  brandLabel: string;
  reflections: Reflection[];
  capsules: Capsule[];
  galaxies: Galaxy[];
  homeCapsuleItems: CapsuleHomeItem[];
  selectedCapsuleId: string | null;
  selectedGalaxyId: string | null;
  discoveryCard: CapsuleCard | null;
  discoveryCapsuleTitle: string;
  discoveryAnswerPreview: string;
  discoveryLabels: {
    title: string;
    empty: string;
    open: string;
  };
  galaxyMapLabels: {
    title: string;
    empty: string;
    create: string;
    galaxy: string;
  };
  bottomNavLabels: {
    home: string;
    write: string;
    review: string;
    shared: string;
    archive: string;
  };
}>();

const emit = defineEmits<{
  "open-discovery": [];
  "open-archive": [];
  "open-new-reflection": [];
  "open-reflection": [reflectionId: string];
  "continue-reflection": [reflectionId: string];
  "open-review": [];
  "open-shared": [];
  "open-create-flow": [];
  "open-galaxy-create-flow": [];
  "open-galaxy": [];
  "open-selected-capsule": [];
  "select-capsule": [capsuleId: string];
  "select-galaxy": [galaxyId: string];
}>();

const readableReflections = computed(() =>
  props.reflections.filter((reflection) => hasReadableAnswer(reflection))
);
const draftReflections = computed(() =>
  props.reflections.filter((reflection) => !hasReadableAnswer(reflection))
);
const recentReflections = computed(() =>
  [...readableReflections.value, ...draftReflections.value].slice(0, 4)
);
const todayReflection = computed(() => recentReflections.value[0] ?? null);
const primarySectionTitle = computed(() =>
  todayReflection.value && hasReadableAnswer(todayReflection.value)
    ? "지금의 내가 다시 읽을 회고"
    : "이어서 쓸 회고"
);

function hasReadableAnswer(reflection: Reflection) {
  return reflection.answers.some((answer) => answer.value.trim().length > 0);
}

function getReflectionPreview(reflection: Reflection) {
  return (
    reflection.representativeSentence ??
    reflection.answers.find((answer) => answer.value.trim())?.value.trim() ??
    "아직 첫 답변 전이에요. 이어쓰기에서 한 문장만 남겨도 충분해요."
  );
}

function openReflectionFromHome(reflection: Reflection) {
  if (hasReadableAnswer(reflection)) emit("open-reflection", reflection.id);
  else emit("continue-reflection", reflection.id);
}
</script>

<style scoped>
.panel {
  background:
    radial-gradient(circle at 18% 0%, rgba(240, 192, 96, 0.12), transparent 32%),
    radial-gradient(circle at 88% 28%, rgba(123, 175, 212, 0.1), transparent 28%),
    var(--color-page);
  border: 1px solid var(--color-soft-border);
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 92px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.onboarding {
  min-height: 620px;
  padding: 34px 20px 26px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 24px;
  text-align: center;
}

.reflectionDock {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.dockHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dockEyebrow {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: 900;
}

.dockHead h2 {
  margin: 3px 0 0;
  color: var(--color-text);
  font-size: 20px;
  letter-spacing: 0;
}

.todayCard {
  border: 1px solid var(--color-soft-border);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(244, 197, 106, 0.13), rgba(68, 102, 159, 0.12)),
    var(--color-surface);
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.todayButton,
.recentChip {
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  padding: 0;
  text-align: left;
  display: grid;
  gap: 5px;
}

.todayButton span,
.recentChip span {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: 900;
}

.todayButton strong {
  font-size: 22px;
  line-height: 1.25;
}

.todayButton em {
  max-width: 100%;
  color: var(--color-text-dim);
  font-style: normal;
  line-height: 1.45;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.continueButton,
.smallCta {
  border: 0;
  border-radius: 999px;
  background: var(--color-gold);
  color: var(--color-primary-contrast);
  font-weight: 900;
  padding: 11px 14px;
}

.smallCta {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.recentRail {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.recentChip {
  border: 1px solid var(--color-soft-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
}

.recentChip strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reflectionEmpty {
  border: 1px dashed var(--color-soft-border);
  border-radius: 18px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.reflectionEmpty p {
  margin: 0;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.onboardingCopy,
.onboardingMessage {
  display: grid;
  gap: 8px;
}

.onboardingEyebrow {
  color: var(--color-gold);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.onboarding h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(28px, 7vw, 44px);
  line-height: 1.14;
  letter-spacing: -0.04em;
}

.heroPlanet {
  position: relative;
  width: 180px;
  height: 180px;
}

.planetGlow,
.planetBody,
.planetRing {
  position: absolute;
  inset: 0;
  margin: auto;
}

.planetGlow {
  width: 170px;
  height: 170px;
  border-radius: 999px;
  background: rgba(240, 192, 96, 0.12);
  filter: blur(18px);
}

.planetBody {
  width: 118px;
  height: 118px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.82), transparent 18%),
    linear-gradient(145deg, var(--color-planet-1), var(--color-gold) 54%, var(--color-planet-3));
  box-shadow: 0 0 42px rgba(240, 192, 96, 0.35);
  animation: planetFloat 7s ease-in-out infinite;
}

.planetRing {
  width: 178px;
  height: 62px;
  border: 2px solid rgba(240, 192, 96, 0.34);
  border-radius: 999px;
  transform: rotate(-18deg);
}

.onboardingMessage h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 20px;
  font-weight: 900;
}

.onboardingMessage p {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 13px;
  line-height: 1.6;
}

.primaryCta {
  border-radius: 999px;
  padding: 11px 15px;
  font-weight: 900;
  cursor: pointer;
}

.primaryCta {
  border: 0;
  background: linear-gradient(135deg, var(--color-gold), var(--color-planet-1));
  color: var(--color-primary-contrast);
  box-shadow: 0 0 18px rgba(240, 192, 96, 0.28);
}

@media (max-width: 899px) {
  .panel {
    min-height: auto;
    border-radius: 0;
  }

  .reflectionDock {
    padding: 14px;
  }

  .dockEyebrow {
    font-size: 10px;
  }

  .dockHead h2 {
    font-size: 18px;
    line-height: 1.2;
  }

  .dockHead,
  .todayCard {
    align-items: stretch;
    flex-direction: column;
  }

  .dockHead {
    display: grid;
  }

  .todayCard,
  .recentRail {
    grid-template-columns: 1fr;
  }

  .todayCard {
    gap: 12px;
    padding: 14px;
  }

  .todayButton strong {
    font-size: 19px;
  }

  .todayButton em {
    font-size: 13px;
  }

  .continueButton,
  .smallCta {
    padding: 10px 13px;
  }
}

.bottomNav {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  padding: 10px;
  border-top: 1px solid var(--color-soft-border);
  background: rgba(11, 15, 30, 0.88);
}

.navItem {
  min-width: 0;
  min-height: 48px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  color: rgba(232, 224, 208, 0.72);
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 4px;
  padding: 6px 4px;
  cursor: pointer;
}

.navItem span:last-child {
  max-width: 100%;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navItem.active {
  border-color: var(--color-border-gold);
  background: rgba(240, 192, 96, 0.12);
  color: var(--color-text);
}

.navItem:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@keyframes planetFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .planetBody {
    animation: none;
  }
}

</style>
