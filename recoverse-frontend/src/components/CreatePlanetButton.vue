<template>
  <button class="createPlanet" type="button" @click="$emit('start-create')">
    <span class="miniPlanet"></span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
}>();

defineEmits<{
  "start-create": [];
}>();
</script>

<style scoped>
.createPlanet {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  border: 1px solid rgba(244, 197, 106, 0.36);
  border-radius: 999px;
  background: rgba(8, 7, 15, 0.66);
  color: #fff9ea;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  min-height: 44px;
}

.miniPlanet {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 26%, rgba(255, 249, 234, 0.9), transparent 18%),
    linear-gradient(145deg, #f4c56a, #f2a27e 62%, #6d5a8d);
  box-shadow: 0 0 18px rgba(244, 197, 106, 0.36);
}

span:last-child {
  font-size: 12px;
  font-weight: 900;
}

@media (max-width: 640px) {
  .createPlanet {
    bottom: 14px;
    max-width: calc(100% - 36px);
    padding: 10px 12px;
  }
}
</style>
