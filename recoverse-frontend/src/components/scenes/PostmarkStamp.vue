<template>
  <svg
    class="postmark"
    viewBox="0 0 400 260"
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
      <path :id="`${uid}-arcTop`" d="M 74 132 A 58 58 0 0 1 190 132" fill="none" />
      <path :id="`${uid}-arcBottom`" d="M 78 138 A 54 54 0 0 0 186 138" fill="none" />
    </defs>

    <rect x="0" y="0" width="100%" height="100%" :fill="`url(#${uid}-sky)`" />

    <circle class="star" cx="330" cy="40" r="1.5" style="animation-delay: 0.6s" />
    <circle class="star" cx="286" cy="220" r="1.2" style="animation-delay: 1.8s" />
    <circle class="star" cx="42" cy="226" r="1.1" style="animation-delay: 2.6s" />

    <!-- stamp -->
    <g transform="translate(266 44) rotate(4)">
      <rect x="0" y="0" width="92" height="116" rx="4" class="stampFrame" />
      <rect x="8" y="8" width="76" height="100" rx="2" class="stampInner" />
      <path
        d="M46 34 L52.8 48.6 L68 50.4 L56.7 61.3 L59.7 76.4 L46 68.8 L32.3 76.4 L35.3 61.3 L24 50.4 L39.2 48.6 Z"
        class="stampStar"
      />
      <text x="46" y="98" class="stampText">RECOVERSE</text>
    </g>

    <!-- postmark ring -->
    <g class="ring">
      <circle cx="132" cy="132" r="66" class="ringOuter" />
      <circle cx="132" cy="132" r="50" class="ringInner" />
      <text class="ringText">
        <textPath :href="`#${uid}-arcTop`" startOffset="50%" text-anchor="middle">RECOVERSE POST</textPath>
      </text>
      <text v-if="label" x="132" y="138" class="ringLabel">{{ truncatedLabel }}</text>
    </g>

    <!-- cancellation waves -->
    <g class="waves">
      <path d="M196 108 Q 224 100 252 108 T 308 108" style="animation-delay: 0ms" />
      <path d="M198 132 Q 226 124 254 132 T 310 132" style="animation-delay: 120ms" />
      <path d="M196 156 Q 224 148 252 156 T 308 156" style="animation-delay: 240ms" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label?: string;
  }>(),
  { label: "" }
);

const uid = useId();

const truncatedLabel = computed(() =>
  props.label.length > 9 ? `${props.label.slice(0, 8)}…` : props.label
);
</script>

<style scoped>
.postmark {
  display: block;
  width: 100%;
  height: 100%;
}

.skyTop { stop-color: var(--surface-blue); }
.skyBottom { stop-color: var(--surface-base); }

.star {
  fill: var(--accent-sage);
  animation: rc-twinkle 4s ease-in-out infinite;
}

.stampFrame {
  fill: var(--surface-letter);
  stroke: var(--surface-letter-deep);
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.stampInner {
  fill: none;
  stroke: var(--accent-wax);
  stroke-width: 1.4;
}

.stampStar { fill: var(--accent-wax); }

.stampText {
  fill: var(--text-on-letter-soft);
  font-family: var(--font-body);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-anchor: middle;
}

.ringOuter,
.ringInner {
  fill: none;
  stroke: var(--accent-sage);
  stroke-width: 2;
}

.ringInner {
  stroke-width: 1.2;
  stroke-dasharray: 2 3;
}

.ringText {
  fill: var(--accent-sage);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.22em;
}

.ringLabel {
  fill: var(--text-primary);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  text-anchor: middle;
}

.waves path {
  fill: none;
  stroke: var(--accent-sage);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 120;
  stroke-dashoffset: 120;
  animation: rc-postmark-sweep 900ms var(--ease-soft) forwards;
}
</style>
