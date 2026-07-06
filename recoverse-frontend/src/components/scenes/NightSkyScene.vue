<template>
  <svg
    class="nightSky"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="skyTop" />
        <stop offset="1" class="skyBottom" />
      </linearGradient>
      <radialGradient :id="`${uid}-lamp`" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" class="lampCore" />
        <stop offset="1" class="lampFade" />
      </radialGradient>
    </defs>

    <rect x="0" y="0" width="100%" height="100%" :fill="`url(#${uid}-sky)`" />

    <g v-if="variant !== 'window'">
      <circle
        v-for="(star, i) in stars"
        :key="i"
        class="star"
        :cx="star.x"
        :cy="star.y"
        :r="star.r"
        :style="{ animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` }"
      />
    </g>

    <!-- hero: crescent moon + floating envelope under lamplight -->
    <template v-if="variant === 'hero'">
      <g class="moon">
        <circle cx="316" cy="92" r="34" class="moonBody" />
        <circle cx="330" cy="82" r="30" class="moonShadow" />
      </g>
      <ellipse cx="200" cy="330" rx="130" ry="90" :fill="`url(#${uid}-lamp)`" />
      <g class="floating">
        <g transform="translate(118 268)">
          <rect x="0" y="26" width="164" height="104" rx="7" class="letterFace" />
          <path d="M0 33 L82 92 L164 33" class="letterFold" />
          <path d="M0 30 L82 96 L164 30 L164 130 L0 130 Z" fill="none" />
          <circle cx="82" cy="92" r="11" class="waxDot" />
          <path d="M77 92 L87 92 M82 87 L82 97" class="waxMark" />
        </g>
      </g>
      <g class="horizon">
        <path d="M0 470 Q120 448 220 462 T400 452 L400 520 L0 520 Z" class="hills" />
      </g>
    </template>

    <!-- window: writing at a night window, lamp on the sill -->
    <template v-else-if="variant === 'window'">
      <rect x="34" y="30" width="332" height="430" rx="10" class="windowGlass" />
      <g>
        <circle
          v-for="(star, i) in stars"
          :key="i"
          class="star"
          :cx="star.x"
          :cy="star.y"
          :r="star.r"
          :style="{ animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` }"
        />
      </g>
      <g class="moon">
        <circle cx="270" cy="130" r="30" class="moonBody" />
        <circle cx="282" cy="121" r="26" class="moonShadow" />
      </g>
      <g class="mullions">
        <line x1="200" y1="30" x2="200" y2="460" />
        <line x1="34" y1="248" x2="366" y2="248" />
      </g>
      <rect x="20" y="452" width="360" height="16" rx="6" class="sill" />
      <ellipse cx="96" cy="450" rx="70" ry="34" :fill="`url(#${uid}-lamp)`" />
      <g class="lamp">
        <path d="M78 402 L114 402 L106 428 L86 428 Z" class="lampShade" />
        <rect x="93" y="428" width="6" height="18" class="lampStem" />
        <rect x="82" y="444" width="28" height="7" rx="3" class="lampBase" />
      </g>
      <rect x="34" y="30" width="332" height="430" rx="10" class="windowFrame" />
    </template>

    <!-- constellation: stars joined into a quiet letter-route -->
    <template v-else-if="variant === 'constellation'">
      <g class="routes">
        <polyline points="72,210 138,120 224,168 296,96 338,182" />
        <polyline points="138,120 170,236 258,262" />
      </g>
      <g>
        <circle
          v-for="(node, i) in constellationNodes"
          :key="`n${i}`"
          class="star bright"
          :cx="node.x"
          :cy="node.y"
          r="3.4"
          :style="{ animationDelay: `${i * 0.7}s` }"
        />
      </g>
    </template>

    <!-- empty: a few stars and one small waiting envelope -->
    <template v-else>
      <ellipse cx="200" cy="192" rx="98" ry="64" :fill="`url(#${uid}-lamp)`" />
      <g class="floating">
        <g transform="translate(142 150)">
          <rect x="0" y="14" width="116" height="72" rx="6" class="letterFace" />
          <path d="M0 19 L58 60 L116 19" class="letterFold" />
          <circle cx="58" cy="60" r="8" class="waxDot" />
        </g>
      </g>
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "hero" | "window" | "constellation" | "empty";
  }>(),
  { variant: "hero" }
);

const uid = useId();

const viewBox = computed(() =>
  props.variant === "window" ? "0 0 400 480" : props.variant === "hero" ? "0 0 400 520" : "0 0 400 300"
);

interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
  duration: number;
}

const starLayouts: Record<string, Star[]> = {
  hero: [
    { x: 42, y: 64, r: 1.6, delay: 0, duration: 3.4 },
    { x: 96, y: 128, r: 1.1, delay: 0.9, duration: 4.1 },
    { x: 148, y: 52, r: 1.9, delay: 1.7, duration: 3.1 },
    { x: 206, y: 108, r: 1.2, delay: 0.4, duration: 4.6 },
    { x: 252, y: 44, r: 1.4, delay: 2.2, duration: 3.8 },
    { x: 356, y: 168, r: 1.2, delay: 1.2, duration: 4.2 },
    { x: 30, y: 208, r: 1.3, delay: 2.8, duration: 3.6 },
    { x: 120, y: 232, r: 1.0, delay: 0.6, duration: 4.4 },
    { x: 330, y: 268, r: 1.5, delay: 1.9, duration: 3.3 },
    { x: 68, y: 330, r: 1.1, delay: 2.5, duration: 4.0 },
    { x: 372, y: 350, r: 1.2, delay: 0.2, duration: 3.9 },
    { x: 230, y: 208, r: 1.0, delay: 3.1, duration: 4.3 },
    { x: 288, y: 150, r: 1.3, delay: 1.4, duration: 3.5 },
    { x: 174, y: 172, r: 1.0, delay: 2.0, duration: 4.7 },
  ],
  window: [
    { x: 88, y: 96, r: 1.5, delay: 0, duration: 3.6 },
    { x: 140, y: 150, r: 1.1, delay: 1.1, duration: 4.2 },
    { x: 176, y: 84, r: 1.7, delay: 2.1, duration: 3.2 },
    { x: 236, y: 210, r: 1.2, delay: 0.6, duration: 4.5 },
    { x: 316, y: 74, r: 1.3, delay: 1.6, duration: 3.9 },
    { x: 302, y: 202, r: 1.1, delay: 2.7, duration: 4.1 },
    { x: 120, y: 214, r: 1.0, delay: 0.3, duration: 4.8 },
  ],
  constellation: [
    { x: 40, y: 60, r: 1.2, delay: 0.5, duration: 4.0 },
    { x: 210, y: 40, r: 1.0, delay: 1.5, duration: 4.4 },
    { x: 356, y: 58, r: 1.3, delay: 2.4, duration: 3.7 },
    { x: 96, y: 268, r: 1.1, delay: 0.9, duration: 4.2 },
    { x: 322, y: 256, r: 1.2, delay: 1.9, duration: 3.5 },
  ],
  empty: [
    { x: 66, y: 56, r: 1.5, delay: 0, duration: 3.7 },
    { x: 200, y: 38, r: 1.2, delay: 1.3, duration: 4.3 },
    { x: 330, y: 68, r: 1.6, delay: 2.3, duration: 3.4 },
    { x: 118, y: 250, r: 1.0, delay: 0.8, duration: 4.6 },
    { x: 296, y: 240, r: 1.1, delay: 1.8, duration: 3.9 },
  ],
};

const stars = computed(() => starLayouts[props.variant] ?? starLayouts.empty);

const constellationNodes = [
  { x: 72, y: 210 },
  { x: 138, y: 120 },
  { x: 224, y: 168 },
  { x: 296, y: 96 },
  { x: 338, y: 182 },
  { x: 170, y: 236 },
  { x: 258, y: 262 },
];
</script>

<style scoped>
.nightSky {
  display: block;
  width: 100%;
  height: 100%;
}

.skyTop { stop-color: var(--surface-blue); }
.skyBottom { stop-color: var(--surface-base); }
.lampCore { stop-color: rgba(232, 166, 76, 0.20); }
.lampFade { stop-color: rgba(232, 166, 76, 0); }

.star {
  fill: var(--accent-sage);
  animation: rc-twinkle 4s ease-in-out infinite;
}

.star.bright { fill: var(--accent-espresso); }

.moonBody { fill: var(--surface-letter); opacity: 0.92; }
.moonShadow { fill: var(--surface-blue); }

.floating { animation: rc-float 6s ease-in-out infinite; }

.letterFace {
  fill: var(--surface-letter);
  stroke: var(--surface-letter-deep);
  stroke-width: 1.5;
}

.letterFold {
  fill: none;
  stroke: var(--surface-letter-deep);
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.waxDot { fill: var(--accent-wax); }

.waxMark {
  stroke: rgba(246, 237, 218, 0.55);
  stroke-width: 1.4;
  stroke-linecap: round;
}

.hills { fill: rgba(2, 5, 11, 0.5); }

.windowGlass { fill: rgba(2, 5, 11, 0.32); }

.windowFrame {
  fill: none;
  stroke: var(--border-strong);
  stroke-width: 3;
}

.mullions line {
  stroke: var(--border-strong);
  stroke-width: 2.4;
}

.sill { fill: var(--surface-parchment); stroke: var(--border-strong); stroke-width: 1; }

.lampShade { fill: var(--accent-espresso); }
.lampStem, .lampBase { fill: var(--border-strong); }

.routes polyline {
  fill: none;
  stroke: var(--border-strong);
  stroke-width: 1.2;
  stroke-dasharray: 4 5;
}
</style>
