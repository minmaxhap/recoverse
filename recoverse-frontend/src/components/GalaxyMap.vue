<template>
  <section class="galaxyMap" :aria-label="labels.title">
    <div class="mapHead">
      <h3>{{ labels.title }}</h3>
    </div>

    <div class="mapSurface" :style="mapSurfaceStyle">
      <GalaxyStars />

      <CapsulePlanetCard
        v-for="(item, index) in items"
        :key="item.capsule.id"
        :item="item"
        :selected="item.capsule.id === selectedCapsuleId"
        :position-style="mapNodeStyle(index)"
        @select="$emit('select', $event)"
      />

      <p v-if="items.length === 0" class="empty">
        {{ labels.empty }}
      </p>

      <button
        v-for="(galaxy, index) in galaxies"
        :key="galaxy.id"
        class="galaxyNode"
        :class="{ selected: galaxy.id === selectedGalaxyId }"
        type="button"
        :style="galaxyNodeStyle(index)"
        @click="$emit('select-galaxy', galaxy.id)"
      >
        <span class="galaxyCore"></span>
        <span class="galaxyOrbit orbitA"></span>
        <span class="galaxyOrbit orbitB"></span>
        <span class="galaxySatellite satelliteA"></span>
        <span class="galaxySatellite satelliteB"></span>
        <span class="galaxyLabel">{{ galaxy.title }}</span>
      </button>

      <button
        v-if="galaxies.length === 0"
        class="galaxyNode preview"
        type="button"
        aria-disabled="true"
      >
        <span class="galaxyCore"></span>
        <span class="galaxyOrbit orbitA"></span>
        <span class="galaxyOrbit orbitB"></span>
        <span class="galaxySatellite satelliteA"></span>
        <span class="galaxySatellite satelliteB"></span>
        <span class="galaxyLabel">{{ labels.galaxy }}</span>
      </button>

      <CreatePlanetButton :label="labels.create" @start-create="$emit('start-create')" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CapsuleHomeItem } from "../lib/capsuleHomeData";
import type { Galaxy } from "../types/recoverseFuture";
import CapsulePlanetCard from "./CapsulePlanetCard.vue";
import CreatePlanetButton from "./CreatePlanetButton.vue";
import GalaxyStars from "./GalaxyStars.vue";

const slots = [
  { x: "58%", y: 76, size: "82px" },
  { x: "20%", y: 132, size: "68px" },
  { x: "70%", y: 188, size: "74px" },
  { x: "34%", y: 252, size: "88px" },
  { x: "78%", y: 292, size: "62px" },
  { x: "18%", y: 304, size: "58px" },
];

const galaxySlots = [
  { right: "9%", top: "22px" },
  { right: "58%", top: "28px" },
  { right: "13%", top: "244px" },
  { right: "50%", top: "330px" },
];

const props = defineProps<{
  items: CapsuleHomeItem[];
  galaxies: Galaxy[];
  selectedCapsuleId: string | null;
  selectedGalaxyId: string | null;
  labels: {
    title: string;
    empty: string;
    create: string;
    galaxy: string;
  };
}>();

defineEmits<{
  select: [capsuleId: string];
  "select-galaxy": [galaxyId: string];
  "start-create": [];
}>();

const rowHeight = 330;

const mapSurfaceStyle = computed(() => {
  const rows = Math.max(1, Math.ceil(Math.max(props.items.length, props.galaxies.length) / slots.length));
  return {
    "--map-height": `${360 + (rows - 1) * rowHeight}px`,
  };
});

function mapNodeStyle(index: number): Record<string, string> {
  const slot = slots[index % slots.length];
  const rowOffset = Math.floor(index / slots.length) * rowHeight;

  return {
    "--x": slot.x,
    "--y": `${slot.y + rowOffset}px`,
    "--size": slot.size,
  };
}

function galaxyNodeStyle(index: number): Record<string, string> {
  const slot = galaxySlots[index % galaxySlots.length];
  const rowOffset = Math.floor(index / galaxySlots.length) * rowHeight;

  return {
    "--galaxy-right": slot.right,
    "--galaxy-top": `calc(${slot.top} + ${rowOffset}px)`,
  };
}
</script>

<style scoped>
.galaxyMap {
  padding: 6px 14px 18px;
}

.mapHead {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 15px;
  font-weight: 900;
}

.mapSurface {
  position: relative;
  min-height: max(var(--map-height, 360px), 420px);
  overflow: hidden;
  border: 1px solid var(--color-border-gold);
  border-radius: 24px;
  background:
    radial-gradient(circle at 20% 18%, rgba(240, 192, 96, 0.16), transparent 22%),
    radial-gradient(circle at 78% 72%, rgba(123, 175, 212, 0.12), transparent 24%),
    linear-gradient(160deg, #0B0F1E 0%, #141C2E 54%, #1A2540 100%);
}

.empty {
  position: absolute;
  z-index: 1;
  inset: auto 20px 72px;
  margin: 0;
  color: var(--color-text-dim);
  font-size: 13px;
  line-height: 1.5;
}

.galaxyNode {
  position: absolute;
  z-index: 1;
  right: var(--galaxy-right, 9%);
  top: var(--galaxy-top, 22px);
  width: 112px;
  height: 112px;
  border: 0;
  background: transparent;
  color: rgba(232, 224, 208, 0.82);
  cursor: pointer;
  opacity: 0.92;
}

.galaxyNode.preview {
  opacity: 0.58;
}

.galaxyNode.selected .galaxyCore {
  box-shadow:
    0 0 0 4px rgba(96, 208, 168, 0.22),
    0 0 36px rgba(96, 208, 168, 0.52);
}

.galaxyNode.selected .galaxyLabel {
  color: var(--color-text);
}

.galaxyCore {
  position: absolute;
  left: 39px;
  top: 38px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 249, 234, 0.88), transparent 18%),
    linear-gradient(145deg, #60d0a8, #6d5a8d 66%, #1d2438);
  box-shadow: 0 0 28px rgba(96, 208, 168, 0.38);
}

.galaxyOrbit {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px solid rgba(240, 192, 96, 0.24);
  border-radius: 999px;
  transform: translate(-50%, -50%) rotate(-18deg);
}

.orbitA {
  width: 86px;
  height: 50px;
}

.orbitB {
  width: 104px;
  height: 68px;
  transform: translate(-50%, -50%) rotate(24deg);
}

.galaxySatellite {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--color-planet-3);
  box-shadow: 0 0 16px rgba(185, 167, 232, 0.54);
}

.satelliteA {
  left: 18px;
  top: 51px;
}

.satelliteB {
  right: 15px;
  top: 36px;
  background: var(--color-planet-2);
}

.galaxyLabel {
  position: absolute;
  left: 50%;
  bottom: 1px;
  max-width: 112px;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  word-break: keep-all;
}

@media (max-width: 430px) {
  .galaxyNode {
    right: 4%;
    transform: scale(0.88);
    transform-origin: top right;
  }
}
</style>
