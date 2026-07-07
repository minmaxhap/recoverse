<template>
  <div class="backbar">
    <button type="button" @click="$emit('back')" aria-label="뒤로">←</button>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
defineEmits<{ back: [] }>();
</script>

<style scoped>
.backbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.backbar button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--ink);
  padding: 4px 6px 4px 0;
}
.backbar span {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--dim);
}
</style>
