<template>
  <section class="homeView">
    <slot />
  </section>
</template>

<style scoped>
.homeView {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 12px;
}
</style>
