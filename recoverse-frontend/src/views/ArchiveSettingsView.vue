<template>
  <section class="archiveView">
    <div class="archiveHead">
      <div class="copy">
        <span class="eyebrow">Archive / Settings</span>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <button class="homeButton" type="button" @click="$emit('back-home')">
        {{ homeLabel }}
      </button>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  homeLabel: string;
}>();

defineEmits<{
  "back-home": [];
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
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.copy {
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

.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: stretch;
}

.homeButton {
  font: inherit;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-paper);
  color: var(--color-ink);
  cursor: pointer;
  padding: 9px 12px;
  white-space: nowrap;
}

@media (max-width: 899px) {
  .archiveHead {
    grid-template-columns: 1fr;
  }

  .homeButton {
    width: fit-content;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>
