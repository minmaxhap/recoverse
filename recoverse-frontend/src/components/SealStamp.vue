<template>
  <span
    class="seal"
    :class="{ pressed: animated }"
    :style="{ width: `${size}px`, height: `${size}px`, animationDelay: `${delay}s` }"
    aria-hidden="true"
  >
    <svg :width="size" :height="size" viewBox="0 0 100 100">
      <defs>
        <!-- feTurbulence + feDisplacementMap = 잉크가 번진 도장 가장자리 (전각 질감) -->
        <filter :id="fid" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" :seed="seed" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" />
        </filter>
      </defs>
      <!-- 색은 CSS로 지정 — SVG presentation attribute에서는 var()가 해석되지 않음 -->
      <g :filter="`url(#${fid})`">
        <rect class="sealStroke" x="7" y="7" width="86" height="86" rx="9" fill="none" stroke-width="5.5" />
        <rect class="sealStroke" x="16.5" y="16.5" width="67" height="67" rx="4" fill="none" stroke-width="1.4" opacity="0.65" />
        <text
          class="sealChar"
          x="50"
          y="52"
          text-anchor="middle"
          dominant-baseline="central"
          font-weight="700"
          font-size="44"
        >
          {{ char }}
        </text>
      </g>
    </svg>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    char?: string;
    size?: number;
    /** 도장이 눌리는 애니메이션 (마운트 시 1회) */
    animated?: boolean;
    /** 애니메이션 시작 지연(초) */
    delay?: number;
  }>(),
  { char: '閉', size: 96, animated: true, delay: 0.25 },
);

// 필터 id는 문서 전역이라 인스턴스마다 고유해야 함. seed도 함께 흔들어 도장마다 결이 다르게.
const seed = Math.floor(Math.random() * 100);
const fid = `seal-rough-${Math.random().toString(36).slice(2, 9)}`;
</script>

<style scoped>
.seal {
  display: inline-grid;
  place-items: center;
  transform: rotate(-5deg); /* 손으로 찍은 듯한 기울기 */
}
.seal svg {
  /* 종이에 스며든 잉크 느낌 */
  mix-blend-mode: multiply;
  opacity: 0.92;
}
.sealStroke {
  stroke: var(--vermilion);
}
.sealChar {
  fill: var(--vermilion);
  font-family: var(--font-display);
}
@media (prefers-color-scheme: dark) {
  .seal svg {
    mix-blend-mode: normal;
    opacity: 0.95;
  }
}
.seal.pressed {
  animation: sealPress 0.6s cubic-bezier(0.22, 1.2, 0.36, 1) both;
}
@keyframes sealPress {
  0% {
    opacity: 0;
    transform: rotate(-20deg) scale(2);
  }
  55% {
    opacity: 1;
    transform: rotate(-3deg) scale(0.9);
  }
  78% {
    transform: rotate(-7deg) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: rotate(-5deg) scale(1);
  }
}
</style>
