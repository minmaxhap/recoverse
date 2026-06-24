<template>
  <section class="archiveShell" :class="`tone-${tone}`">
    <div class="archiveHead">
      <div class="copy">
        <span class="eyebrow">{{ eyebrow }}</span>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string;
  tone?: "archive" | "settings";
  title: string;
  description: string;
  homeLabel: string;
}>(), {
  eyebrow: "Archive",
  tone: "archive",
});

defineEmits<{
  "back-home": [];
}>();
</script>

<style scoped>
.archiveShell {
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
  color: var(--color-gold);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.tone-settings .eyebrow {
  color: var(--color-muted);
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

@media (max-width: 899px) {
  .archiveHead {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>

<style>
.archiveShell input,
.archiveShell select,
.archiveShell textarea {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.archiveShell input:focus,
.archiveShell select:focus,
.archiveShell textarea:focus {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(240, 192, 96, 0.12);
}

.archiveShell button {
  border-color: var(--color-border-gold);
}
</style>
