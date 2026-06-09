<template>
  <section class="archiveView">
    <div class="archiveHead">
      <span class="eyebrow">Archive / Settings</span>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<style scoped>
.archiveView {
  display: grid;
  gap: 14px;
}

.archiveHead {
  padding: 14px 16px 0;
  display: grid;
  gap: 4px;
}

.eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 18px;
  font-weight: 900;
}

p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>
