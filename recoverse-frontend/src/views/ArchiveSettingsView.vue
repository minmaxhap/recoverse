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
  gap: 16px;
  padding-bottom: 18px;
  background: var(--color-page);
  color: var(--color-text);
}

.archiveHead {
  padding: 18px 18px 0;
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
  color: var(--color-text);
  font-size: 28px;
  font-weight: 900;
  line-height: 1.12;
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
  border: 1px solid var(--color-border-gold);
  border-radius: 999px;
  background: rgba(240, 192, 96, 0.08);
  color: var(--color-text);
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

<style>
.archiveView input,
.archiveView select,
.archiveView textarea {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.archiveView input:focus,
.archiveView select:focus,
.archiveView textarea:focus {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(240, 192, 96, 0.12);
}

.archiveView button {
  border-color: var(--color-border-gold);
}
</style>
