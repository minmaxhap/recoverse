<template>
  <HomeView>
    <section class="panel">
      <HomeHeader
        :brand-label="brandLabel"
        :title="title"
      />

      <template v-if="capsules.length === 0">
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
            <h3>아직 기억 행성이 없어요.</h3>
            <p>첫 회고를 작성하면 여기에 행성이 떠오를 거예요.</p>
          </div>

          <button class="primaryCta" type="button" @click="$emit('open-create-flow')">
            ✦ 첫 기억 행성 만들기
          </button>
        </section>
      </template>

      <template v-else>
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
          @start-create="$emit('open-create-flow')"
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
          @click="$emit('open-selected-capsule')"
        >
          <NavIcon name="planet" />
          <span>{{ bottomNavLabels.planet }}</span>
        </button>
        <button class="navItem" type="button" @click="$emit('open-galaxy')">
          <NavIcon name="galaxy" />
          <span>{{ bottomNavLabels.galaxy }}</span>
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
import DiscoveryCard from "../components/DiscoveryCard.vue";
import GalaxyMap from "../components/GalaxyMap.vue";
import HomeHeader from "../components/HomeHeader.vue";
import NavIcon from "../components/NavIcon.vue";
import type { Capsule, CapsuleCard } from "../lib/recoverseStore";
import type { CapsuleHomeItem } from "../lib/capsuleHomeData";
import type { Galaxy } from "../types/recoverseFuture";
import HomeView from "./HomeView.vue";

defineProps<{
  title: string;
  brandLabel: string;
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
    planet: string;
    galaxy: string;
    archive: string;
  };
}>();

defineEmits<{
  "open-discovery": [];
  "open-archive": [];
  "open-create-flow": [];
  "open-galaxy": [];
  "open-selected-capsule": [];
  "select-capsule": [capsuleId: string];
  "select-galaxy": [galaxyId: string];
}>();
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
}

.bottomNav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
