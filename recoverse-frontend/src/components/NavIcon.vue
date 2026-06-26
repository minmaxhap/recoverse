<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'home'">
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V20h11v-9.5" />
      <path d="M10 20v-5h4v5" />
    </template>

    <template v-else-if="name === 'write'">
      <path d="M5 19h14" />
      <path d="M7 16.5 16.8 6.7a2.1 2.1 0 0 1 3 3L10 19l-4 .7z" />
    </template>

    <template v-else-if="name === 'review'">
      <path d="M12 5v5l3 2" />
      <circle cx="12" cy="12" r="7" />
      <path d="M4.5 8.5 3.2 5.2 6.7 6" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: "home" | "write" | "review";
}>();
</script>

<style scoped>
.icon {
  width: 19px;
  height: 19px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}
</style>
