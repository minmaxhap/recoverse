<template>
  <section class="galaxyMap" :aria-label="labels.title">
    <div class="mapHead">
      <h3>{{ labels.title }}</h3>
    </div>

    <div class="mapSurface">
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

      <CreatePlanetButton :label="labels.create" @start-create="$emit('start-create')" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CapsuleHomeItem } from "../lib/capsuleHomeData";
import CapsulePlanetCard from "./CapsulePlanetCard.vue";
import CreatePlanetButton from "./CreatePlanetButton.vue";
import GalaxyStars from "./GalaxyStars.vue";

const slots = [
  { x: "58%", y: "18%", size: "82px" },
  { x: "20%", y: "33%", size: "68px" },
  { x: "70%", y: "48%", size: "74px" },
  { x: "34%", y: "65%", size: "88px" },
  { x: "78%", y: "75%", size: "62px" },
  { x: "18%", y: "78%", size: "58px" },
];

defineProps<{
  items: CapsuleHomeItem[];
  selectedCapsuleId: string | null;
  labels: {
    title: string;
    empty: string;
    create: string;
  };
}>();

defineEmits<{
  select: [capsuleId: string];
  "start-create": [];
}>();

function mapNodeStyle(index: number): Record<string, string> {
  const slot = slots[index % slots.length];
  const rowOffset = Math.floor(index / slots.length) * 56;

  return {
    "--x": slot.x,
    "--y": `calc(${slot.y} + ${rowOffset}px)`,
    "--size": slot.size,
  };
}
</script>

<style scoped>
.galaxyMap {
  padding: 12px;
  border-bottom: 1px solid var(--color-soft-border);
}

.mapHead {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 13px;
  font-weight: 900;
}

.mapSurface {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  border: 1px solid rgba(185, 167, 232, 0.25);
  border-radius: 22px;
  background:
    radial-gradient(circle at 20% 18%, rgba(244, 197, 106, 0.18), transparent 22%),
    radial-gradient(circle at 78% 72%, rgba(232, 168, 184, 0.16), transparent 24%),
    linear-gradient(160deg, #08070f 0%, #15111f 54%, #1d2438 100%);
}

.empty {
  position: absolute;
  z-index: 1;
  inset: auto 20px 24px;
  margin: 0;
  color: rgba(255, 249, 234, 0.78);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 430px) {
  .mapSurface {
    min-height: 340px;
  }
}
</style>
