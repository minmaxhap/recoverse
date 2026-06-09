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
    grid-template-columns: minmax(0, 1fr) 420px;
  }
}
</style>
