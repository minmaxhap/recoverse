<template>
  <HomeView>
    <section class="panel">
      <HomeHeader
        :brand-label="brandLabel"
        :title="title"
      />

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
        :labels="galaxyMapLabels"
        @select="$emit('select-capsule', $event)"
        @select-galaxy="$emit('select-galaxy', $event)"
        @start-create="$emit('open-create-flow')"
      />

      <HomeArchiveBridge
        :count="capsules.length"
        :labels="archiveBridgeLabels"
        @open-archive="$emit('open-archive')"
      />

      <nav class="bottomNav" :aria-label="bottomNavLabels.home">
        <button class="navItem active" type="button">
          <span class="navIcon homeIcon"></span>
          <span>{{ bottomNavLabels.home }}</span>
        </button>
        <button
          class="navItem"
          type="button"
          :disabled="!hasSelectedCapsule"
          @click="$emit('open-selected-capsule')"
        >
          <span class="navIcon planetIcon"></span>
          <span>{{ bottomNavLabels.planet }}</span>
        </button>
        <button class="navItem" type="button" :disabled="galaxies.length === 0" @click="$emit('open-galaxy')">
          <span class="navIcon galaxyIcon"></span>
          <span>{{ bottomNavLabels.galaxy }}</span>
        </button>
        <button class="navItem" type="button" @click="$emit('open-archive')">
          <span class="navIcon archiveIcon"></span>
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
import HomeArchiveBridge from "../components/HomeArchiveBridge.vue";
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
  archiveBridgeLabels: {
    eyebrow: string;
    title: string;
    description: string;
    count: string;
    open: string;
  };
  bottomNavLabels: {
    home: string;
    planet: string;
    galaxy: string;
    archive: string;
  };
  hasSelectedCapsule: boolean;
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
  --color-surface: #0d0a18;
  --color-paper: rgba(255, 249, 234, 0.08);
  --color-ink: #fff9ea;
  --color-muted: #bdb4c8;
  --color-soft-border: rgba(185, 167, 232, 0.18);
  --color-border: rgba(185, 167, 232, 0.32);
  --color-primary: #f4c56a;
  --color-primary-contrast: #15111f;

  background: var(--color-surface);
  border: 1px solid var(--color-soft-border);
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 92px);
  box-shadow: 0 24px 80px rgba(8, 7, 15, 0.28);
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
  background: rgba(8, 7, 15, 0.78);
}

.navItem {
  min-width: 0;
  min-height: 48px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  color: rgba(255, 249, 234, 0.72);
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
  border-color: rgba(244, 197, 106, 0.36);
  background: rgba(244, 197, 106, 0.12);
  color: #fff9ea;
}

.navItem:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.navIcon {
  width: 18px;
  height: 18px;
  display: block;
}

.homeIcon {
  border-radius: 5px;
  border: 1px solid currentColor;
  box-shadow: inset 0 -5px 0 rgba(244, 197, 106, 0.28);
}

.planetIcon {
  border-radius: 999px;
  background:
    radial-gradient(circle at 32% 26%, rgba(255, 249, 234, 0.95), transparent 19%),
    linear-gradient(145deg, #f4c56a, #f2a27e 58%, #6d5a8d);
}

.galaxyIcon {
  border-radius: 999px;
  border: 1px solid #60d0a8;
  box-shadow: 0 0 0 5px rgba(96, 208, 168, 0.12);
}

.archiveIcon {
  border: 1px solid currentColor;
  border-radius: 4px;
  position: relative;
}

.archiveIcon::before {
  content: "";
  position: absolute;
  left: 3px;
  right: 3px;
  top: 5px;
  height: 1px;
  background: currentColor;
}
</style>
