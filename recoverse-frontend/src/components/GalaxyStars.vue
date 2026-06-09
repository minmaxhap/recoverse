<template>
  <div class="stars" aria-hidden="true">
    <span class="star starA"></span>
    <span class="star starB"></span>
    <span class="star starC"></span>
  </div>
</template>

<style scoped>
.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.72;
}

.stars::before,
.stars::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(255, 249, 234, 0.92) 0 1px, transparent 1.5px),
    radial-gradient(circle, rgba(185, 167, 232, 0.72) 0 1px, transparent 1.4px);
  background-position:
    12px 18px,
    42px 54px;
  background-size:
    58px 74px,
    96px 112px;
}

.stars::after {
  opacity: 0.48;
  transform: translate(18px, 22px);
}

.star {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: #fff9ea;
  box-shadow: 0 0 12px rgba(255, 249, 234, 0.9);
  animation: twinkle 4.8s ease-in-out infinite;
}

.starA {
  left: 18%;
  top: 24%;
}

.starB {
  left: 72%;
  top: 28%;
  animation-delay: 1.4s;
}

.starC {
  left: 62%;
  top: 82%;
  animation-delay: 2.2s;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.32;
    transform: scale(0.82);
  }

  50% {
    opacity: 1;
    transform: scale(1.18);
  }
}

@media (prefers-reduced-motion: reduce) {
  .star {
    animation: none;
  }
}
</style>
