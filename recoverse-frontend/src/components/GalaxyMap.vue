<template>
  <section class="galaxyMap" :aria-label="labels.title">
    <div class="mapHead">
      <h3>{{ labels.title }}</h3>
    </div>

    <div class="mapSurface">
      <GalaxyStars />

      <button
        v-for="(item, index) in items"
        :key="item.capsule.id"
        class="mapNode"
        :class="[
          `tone-${item.typeDisplay.tone}`,
          { selected: item.capsule.id === selectedCapsuleId, discovered: item.isDiscoveryTarget },
        ]"
        :style="mapNodeStyle(index)"
        type="button"
        @click="$emit('select', item.capsule.id)"
      >
        <span class="planet"></span>
        <span class="nodeText">
          <span class="nodeTitle">{{ item.capsule.title }}</span>
          <span class="nodeMeta">{{ item.stats.answered }}/{{ item.stats.cards }}</span>
        </span>
      </button>

      <p v-if="items.length === 0" class="empty">
        {{ labels.empty }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CapsuleHomeItem } from "../lib/capsuleHomeData";
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
  };
}>();

defineEmits<{
  select: [capsuleId: string];
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

.mapNode {
  --x: 50%;
  --y: 50%;
  --size: 72px;

  position: absolute;
  z-index: 1;
  left: var(--x);
  top: var(--y);
  width: max(var(--size), 92px);
  min-height: calc(var(--size) + 42px);
  transform: translate(-50%, -50%);
  border: 0;
  background: transparent;
  color: #fff9ea;
  cursor: pointer;
  display: grid;
  justify-items: center;
  gap: 7px;
  padding: 0;
  text-align: center;
}

.planet {
  width: var(--size);
  aspect-ratio: 1;
  border-radius: 999px;
  box-shadow: 0 0 32px rgba(244, 197, 106, 0.24);
}

.tone-gold .planet {
  background:
    radial-gradient(circle at 32% 26%, rgba(255, 249, 234, 0.9), transparent 18%),
    linear-gradient(145deg, #f4c56a, #f2a27e 58%, #6d5a8d);
}

.tone-teal .planet {
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 249, 234, 0.78), transparent 16%),
    linear-gradient(145deg, #9bd7cf, #6d5a8d 62%, #1d2438);
}

.tone-navy .planet {
  background:
    radial-gradient(circle at 30% 22%, rgba(246, 238, 220, 0.7), transparent 15%),
    linear-gradient(145deg, #4e658f, #1d2438 58%, #08070f);
}

.tone-rose .planet {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 249, 234, 0.78), transparent 17%),
    linear-gradient(145deg, #e8a8b8, #b96f8e 55%, #6d5a8d);
}

.tone-moon .planet,
.tone-lavender .planet {
  background:
    radial-gradient(circle at 31% 24%, rgba(255, 249, 234, 0.92), transparent 17%),
    linear-gradient(145deg, #f6eedc, #b9a7e8 58%, #6d5a8d);
}

.selected .planet {
  outline: 2px solid rgba(255, 249, 234, 0.82);
  outline-offset: 4px;
}

.discovered .planet {
  box-shadow: 0 0 42px rgba(244, 197, 106, 0.48);
}

.nodeText {
  display: grid;
  gap: 2px;
  max-width: 112px;
}

.nodeTitle {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  word-break: keep-all;
}

.nodeMeta {
  color: rgba(255, 249, 234, 0.72);
  font-size: 11px;
  font-weight: 700;
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

  .mapNode {
    width: max(var(--size), 84px);
  }
}
</style>
