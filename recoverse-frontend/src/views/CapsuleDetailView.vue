<template>
  <aside class="panel">
    <slot />
  </aside>
</template>

<style scoped>
.panel {
  background:
    radial-gradient(circle at 18% 0%, rgba(240, 192, 96, 0.1), transparent 30%),
    var(--color-page);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 92px);
  color: var(--color-text);
}
</style>
