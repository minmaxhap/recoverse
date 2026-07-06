<template>
  <svg
    class="envelopeScene"
    :viewBox="variant === 'stack' ? '0 0 400 520' : '0 0 400 300'"
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

    <template v-if="variant === 'stack'">
      <circle class="star" cx="60" cy="66" r="1.5" style="animation-delay: 0.3s" />
      <circle class="star" cx="212" cy="44" r="1.2" style="animation-delay: 1.4s" />
      <circle class="star" cx="336" cy="88" r="1.6" style="animation-delay: 2.4s" />
      <circle class="star" cx="132" cy="120" r="1.0" style="animation-delay: 0.9s" />
      <circle class="star" cx="304" cy="176" r="1.1" style="animation-delay: 1.9s" />

      <ellipse cx="200" cy="330" rx="150" ry="110" :fill="`url(#${uid}-lamp)`" />

      <g transform="translate(96 332) rotate(-7 104 62)">
        <rect x="0" y="0" width="208" height="124" rx="7" class="letterFace dim" />
      </g>
      <g transform="translate(102 282) rotate(4 104 62)">
        <rect x="0" y="0" width="208" height="124" rx="7" class="letterFace mid" />
        <path d="M0 6 L104 76 L208 6" class="letterFold" />
      </g>
      <g class="floating">
        <g transform="translate(92 212)">
          <rect x="0" y="0" width="216" height="130" rx="7" class="letterFace" />
          <path d="M0 7 L108 82 L216 7" class="letterFold" />
          <circle cx="108" cy="82" r="12" class="waxDot" />
          <text x="108" y="86.5" class="waxMonogram">R</text>
        </g>
      </g>
    </template>

    <template v-else>
      <ellipse cx="200" cy="150" rx="120" ry="86" :fill="`url(#${uid}-lamp)`" />
      <g class="sealPress">
        <circle cx="200" cy="150" r="58" class="waxBody" />
        <circle cx="200" cy="150" r="58" class="waxRim" />
        <circle cx="182" cy="130" r="16" class="waxHighlight" />
        <circle cx="200" cy="150" r="42" class="waxRing" />
        <text x="200" y="166" class="sealMonogram">R</text>
      </g>
    </template>
  </svg>
</template>

<script setup lang="ts">
import { useId } from "vue";

withDefaults(
  defineProps<{
    variant?: "stack" | "seal";
  }>(),
  { variant: "stack" }
);

const uid = useId();
</script>

<style scoped>
.envelopeScene {
  display: block;
  width: 100%;
  height: 100%;
}

.skyTop { stop-color: var(--surface-blue); }
.skyBottom { stop-color: var(--surface-base); }
.lampCore { stop-color: rgba(232, 166, 76, 0.22); }
.lampFade { stop-color: rgba(232, 166, 76, 0); }

.star {
  fill: var(--accent-sage);
  animation: rc-twinkle 4s ease-in-out infinite;
}

.floating { animation: rc-float 6s ease-in-out infinite; }

.letterFace {
  fill: var(--surface-letter);
  stroke: var(--surface-letter-deep);
  stroke-width: 1.5;
}

.letterFace.mid { opacity: 0.82; }
.letterFace.dim { opacity: 0.55; }

.letterFold {
  fill: none;
  stroke: var(--surface-letter-deep);
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.waxDot { fill: var(--accent-wax); }

.waxMonogram {
  fill: rgba(246, 237, 218, 0.75);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  text-anchor: middle;
}

.sealPress {
  animation: rc-seal-press 480ms var(--ease-soft) both;
  transform-origin: 200px 150px;
}

.waxBody { fill: var(--accent-wax); }

.waxRim {
  fill: none;
  stroke: rgba(2, 5, 11, 0.3);
  stroke-width: 3;
}

.waxHighlight { fill: rgba(246, 237, 218, 0.18); }

.waxRing {
  fill: none;
  stroke: rgba(2, 5, 11, 0.28);
  stroke-width: 1.6;
  stroke-dasharray: 3 4;
}

.sealMonogram {
  fill: rgba(246, 237, 218, 0.85);
  font-family: var(--font-display);
  font-size: 46px;
  font-weight: 700;
  text-anchor: middle;
}
</style>
