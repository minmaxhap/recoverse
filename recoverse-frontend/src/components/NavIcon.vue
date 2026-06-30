<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'book'">
      <path d="M5.5 4.5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3h-6z" />
      <path d="M18.5 4.5h-4a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h4z" />
      <path d="M8 8h2" />
      <path d="M8 11h2" />
    </template>

    <template v-else-if="name === 'pen'">
      <path d="M5 19h14" />
      <path d="M7 16.5 16.8 6.7a2.1 2.1 0 0 1 3 3L10 19l-4 .7z" />
    </template>

    <template v-else-if="name === 'album'">
      <path d="M5.5 5.5h13v13h-13z" />
      <path d="m8 15 2.8-3 2 2.1 1.5-1.6L17 15" />
      <circle cx="9" cy="9" r="1" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: "book" | "pen" | "album";
}>();
</script>

<style scoped>
.icon {
  width: 20px;
  height: 20px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.75;
}
</style>
