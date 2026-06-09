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
    grid-template-columns: minmax(0, 860px);
    align-items: start;
    justify-content: center;
  }
}
</style>
