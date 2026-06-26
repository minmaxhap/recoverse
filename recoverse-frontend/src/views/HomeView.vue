<template>
  <section class="homeView">
    <slot />
  </section>
</template>

<style scoped>
.homeView {
  display: grid;
  gap: 12px;
  width: 100%;
  height: 100%;
}

@media (min-width: 900px) {
  .homeView {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    justify-content: center;
  }
}
</style>
