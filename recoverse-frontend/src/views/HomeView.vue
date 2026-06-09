<template>
  <section class="homeView">
    <slot />
  </section>
</template>

<style scoped>
.homeView {
  display: grid;
  gap: 12px;
}

@media (min-width: 900px) {
  .homeView {
    grid-template-columns: minmax(520px, 1fr) minmax(360px, 440px);
    align-items: start;
  }
}
</style>
