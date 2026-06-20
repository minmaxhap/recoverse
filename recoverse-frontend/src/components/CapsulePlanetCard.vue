<template>
  <button
    class="planetCard"
    :class="[
      `tone-${item.typeDisplay.tone}`,
      { selected, discovered: item.isDiscoveryTarget, recent: item.stats.recentCardId },
    ]"
    :style="positionStyle"
    type="button"
    :aria-label="item.capsule.title"
    @click="$emit('select', item.capsule.id)"
  >
    <span class="planetWrap">
      <span class="planet"></span>
      <span v-if="item.stats.recentCardId" class="recentStar"></span>
    </span>
    <span class="nodeText">
      <span class="nodeTitle">{{ item.capsule.title }}</span>
      <span class="nodeMeta">{{ item.stats.answered }}/{{ item.stats.cards }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import type { CapsuleHomeItem } from "../lib/capsuleHomeData";

defineProps<{
  item: CapsuleHomeItem;
  selected: boolean;
  positionStyle: Record<string, string>;
}>();

defineEmits<{
  select: [capsuleId: string];
}>();
</script>

<style scoped>
.planetCard {
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
  transition: transform 180ms ease-out;
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

.planetCard:active {
  transform: translate(-50%, -50%) scale(1.06);
}

.planetWrap {
  position: relative;
  display: grid;
  place-items: center;
  animation: planetFloat 8s ease-in-out infinite;
}

.planetCard:nth-of-type(2n) .planetWrap {
  animation-delay: -2.6s;
}

.planetCard:nth-of-type(3n) .planetWrap {
  animation-delay: -4.1s;
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

.selected .planetWrap {
  animation: planetExpand 220ms ease-out;
}

.discovered .planet {
  box-shadow: 0 0 42px rgba(244, 197, 106, 0.48);
}

.recentStar {
  position: absolute;
  right: 1px;
  top: 4px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f4c56a;
  box-shadow: 0 0 12px rgba(244, 197, 106, 0.88);
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

@media (max-width: 430px) {
  .planetCard {
    width: max(var(--size), 84px);
  }
}

@keyframes planetExpand {
  0% {
    transform: scale(1);
  }

  52% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes planetFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-7px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .planetCard {
    transition: none;
  }

  .planetCard:active {
    transform: translate(-50%, -50%);
  }

  .selected .planetWrap {
    animation: none;
  }

  .planetWrap {
    animation: none;
  }
}
</style>
