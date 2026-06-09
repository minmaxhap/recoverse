<template>
  <HomeView>
    <section class="panel">
      <HomeHeader
        :brand-label="brandLabel"
        :title="title"
        :toolbar-labels="toolbarLabels"
        :export-disabled="capsules.length === 0"
        @export="$emit('export')"
        @import-file="$emit('import-file', $event)"
        @refresh="$emit('refresh')"
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
        :selected-capsule-id="selectedCapsuleId"
        :labels="galaxyMapLabels"
        @select="$emit('select-capsule', $event)"
        @start-create="$emit('open-create-flow')"
      />

      <HomeArchiveBridge
        :count="capsules.length"
        :labels="archiveBridgeLabels"
        @open-archive="$emit('open-archive')"
      />
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
import HomeView from "./HomeView.vue";

defineProps<{
  title: string;
  brandLabel: string;
  capsules: Capsule[];
  homeCapsuleItems: CapsuleHomeItem[];
  selectedCapsuleId: string | null;
  discoveryCard: CapsuleCard | null;
  discoveryCapsuleTitle: string;
  discoveryAnswerPreview: string;
  toolbarLabels: {
    exportCapsules: string;
    importCapsules: string;
    capsuleBackupVersion: string;
    refresh: string;
  };
  discoveryLabels: {
    title: string;
    empty: string;
    open: string;
  };
  galaxyMapLabels: {
    title: string;
    empty: string;
    create: string;
  };
  archiveBridgeLabels: {
    eyebrow: string;
    title: string;
    description: string;
    count: string;
    open: string;
  };
}>();

defineEmits<{
  export: [];
  "import-file": [event: Event];
  refresh: [];
  "open-discovery": [];
  "open-archive": [];
  "open-create-flow": [];
  "select-capsule": [capsuleId: string];
}>();
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 92px);
}

.panelHead {
  padding: 12px 12px;
  border-bottom: 1px solid var(--color-soft-border);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.panelHead h2,
.panelHead span,
.panelHead label {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.panelHead h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  min-width: 0;
}

.noWrap {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.divider {
  height: 1px;
  background: var(--color-soft-border);
  margin: 14px 0;
}

@media (max-width: 899px) {
  .panel {
    min-height: auto;
  }
}
</style>
