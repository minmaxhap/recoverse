<template>
  <header class="topNav">
    <span>Recoverse</span>
  </header>
</template>

<style scoped>
.topNav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 45;
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 max(18px, env(safe-area-inset-right)) 0 max(18px, env(safe-area-inset-left));
  border-bottom: 1px solid var(--color-soft-border);
  background: rgba(11, 15, 30, 0.96);
  backdrop-filter: blur(16px);
}

.topNav span {
  color: var(--color-gold);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
