<template>
  <section class="bridge">
    <div class="copy">
      <span class="eyebrow">{{ labels.eyebrow }}</span>
      <h3>{{ labels.title }}</h3>
      <p>{{ labels.description }}</p>
    </div>

    <div class="meta">
      <span>{{ labels.count }} {{ count }}</span>
      <button type="button" @click="$emit('open-archive')">
        {{ labels.open }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
  labels: {
    eyebrow: string;
    title: string;
    description: string;
    count: string;
    open: string;
  };
}>();

defineEmits<{
  "open-archive": [];
}>();
</script>

<style scoped>
.bridge {
  padding: 12px 14px;
  border-top: 1px solid var(--color-soft-border);
  display: grid;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
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

h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 900;
}

p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-muted);
  font-size: 12px;
}

button {
  font: inherit;
  border: 1px solid var(--color-border-gold);
  background: rgba(240, 192, 96, 0.08);
  color: var(--color-text);
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>
