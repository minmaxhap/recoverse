<template>
  <section v-if="capsule" class="hero">
    <div class="heroPlanet" :class="`tone-${tone}`"></div>
    <div class="heroText">
      <span class="typeLabel">{{ typeLabel }}</span>
      <h3>{{ capsule.title }}</h3>
      <p v-if="capsule.description">{{ capsule.description }}</p>
      <div class="progress">
        <span>{{ answered }} / {{ total }}</span>
        <div class="track">
          <div class="fill" :style="{ width: `${percent}%` }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Capsule } from "../lib/recoverseStore";
import { capsuleTypeDisplays, type CapsuleHomeStats } from "../lib/capsuleHomeData";

const props = defineProps<{
  capsule: Capsule | null;
  stats: CapsuleHomeStats | undefined;
  typeLabel: string;
}>();

const tone = computed(() =>
  props.capsule ? capsuleTypeDisplays[props.capsule.type].tone : "moon"
);
const total = computed(() => props.stats?.cards ?? 0);
const answered = computed(() => props.stats?.answered ?? 0);
const percent = computed(() =>
  total.value === 0 ? 0 : Math.round((answered.value / total.value) * 100)
);
</script>

<style scoped>
.hero {
  margin: 12px;
  border: 1px solid rgba(185, 167, 232, 0.24);
  border-radius: 20px;
  background:
    radial-gradient(circle at 16% 18%, rgba(244, 197, 106, 0.2), transparent 26%),
    linear-gradient(145deg, #08070f, #15111f 58%, #1d2438);
  color: #fff9ea;
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 14px;
  align-items: center;
  padding: 14px;
}

.heroPlanet {
  width: 78px;
  aspect-ratio: 1;
  border-radius: 999px;
  box-shadow: 0 0 34px rgba(244, 197, 106, 0.28);
}

.tone-gold {
  background:
    radial-gradient(circle at 32% 26%, rgba(255, 249, 234, 0.9), transparent 18%),
    linear-gradient(145deg, #f4c56a, #f2a27e 58%, #6d5a8d);
}

.tone-teal {
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 249, 234, 0.78), transparent 16%),
    linear-gradient(145deg, #9bd7cf, #6d5a8d 62%, #1d2438);
}

.tone-navy {
  background:
    radial-gradient(circle at 30% 22%, rgba(246, 238, 220, 0.7), transparent 15%),
    linear-gradient(145deg, #4e658f, #1d2438 58%, #08070f);
}

.tone-rose {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 249, 234, 0.78), transparent 17%),
    linear-gradient(145deg, #e8a8b8, #b96f8e 55%, #6d5a8d);
}

.tone-moon,
.tone-lavender {
  background:
    radial-gradient(circle at 31% 24%, rgba(255, 249, 234, 0.92), transparent 17%),
    linear-gradient(145deg, #f6eedc, #b9a7e8 58%, #6d5a8d);
}

.heroText {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.typeLabel {
  color: rgba(255, 249, 234, 0.7);
  font-size: 11px;
  font-weight: 800;
}

h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  word-break: keep-all;
}

p {
  margin: 0;
  color: rgba(255, 249, 234, 0.76);
  font-size: 12px;
  line-height: 1.45;
}

.progress {
  display: grid;
  gap: 6px;
}

.progress span {
  color: rgba(255, 249, 234, 0.72);
  font-size: 11px;
  font-weight: 800;
}

.track {
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 249, 234, 0.18);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: inherit;
  background: #f4c56a;
}

@media (max-width: 430px) {
  .hero {
    grid-template-columns: 74px 1fr;
    gap: 12px;
  }

  .heroPlanet {
    width: 64px;
  }
}
</style>
