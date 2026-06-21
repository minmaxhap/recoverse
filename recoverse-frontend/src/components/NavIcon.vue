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

    <template v-else-if="name === 'planet'">
      <circle cx="12" cy="12" r="5.2" />
      <path d="M3.5 14.5c3.7 2.1 11 2.8 16.9-4" />
      <path d="M20.5 9.5c.8 1.3-.4 3-3.1 4.3" />
    </template>

    <template v-else-if="name === 'galaxy'">
      <circle cx="12" cy="12" r="2.7" />
      <path d="M4.5 12c1.4-4.6 8.4-6.2 13.5-2.5" />
      <path d="M19.5 12c-1.4 4.6-8.4 6.2-13.5 2.5" />
      <path d="M12 4.5c4.3 1.3 6.2 8.1 2.7 13.1" />
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

    <template v-else-if="name === 'share'">
      <circle cx="6.5" cy="12" r="2.2" />
      <circle cx="17.5" cy="6.5" r="2.2" />
      <circle cx="17.5" cy="17.5" r="2.2" />
      <path d="M8.6 11 15.4 7.5" />
      <path d="M8.6 13 15.4 16.5" />
    </template>

    <template v-else>
      <path d="M5.5 7.5h13" />
      <path d="M7 7.5v11h10v-11" />
      <path d="M8.5 5.5h7" />
      <path d="M9 11h6" />
      <path d="M9 14h4" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: "home" | "planet" | "galaxy" | "write" | "review" | "share" | "archive";
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
