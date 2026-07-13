<template>
  <div class="magazineSkeleton" role="status" aria-label="불러오는 중">
    <div class="skelBar title" />
    <div class="skelBar sub" />
    <div class="skelBar sub short" />
    <div class="skelBar sub shorter" />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.magazineSkeleton {
  display: grid;
  gap: 12px;
  padding: 40px 0;
}
.skelBar {
  height: 14px;
  background: var(--hairline);
  border-radius: 1px;
  background-image: linear-gradient(
    90deg,
    var(--hairline) 0%,
    var(--paper) 50%,
    var(--hairline) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.skelBar.title {
  height: 28px;
  width: 60%;
}
.skelBar.sub {
  width: 90%;
}
.skelBar.sub.short {
  width: 75%;
}
.skelBar.sub.shorter {
  width: 45%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skelBar {
    animation: none;
  }
}
</style>
