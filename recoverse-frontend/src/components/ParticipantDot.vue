<template>
  <span
    class="dot"
    :class="{ pulse, dim }"
    :style="{
      width: px,
      height: px,
      background: dim ? 'transparent' : color,
      borderColor: color,
    }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    color: string;
    size?: number;
    small?: boolean;
    dim?: boolean;
    pulse?: boolean;
  }>(),
  { size: 14, small: false, dim: false, pulse: false },
);

const px = computed(() => `${props.small ? 10 : props.size}px`);
</script>

<style scoped>
.dot {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid;
  flex-shrink: 0;
}
.dot.dim {
  opacity: 0.35;
}
.dot.pulse {
  animation: pulse 1.6s ease infinite;
}
</style>
