<template>
  <span class="iconBadge" :class="`tint-${tint}`" :style="sizeStyle" aria-hidden="true">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="icon === 'pen'">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </template>
      <template v-else-if="icon === 'envelope'">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 8 9 6 9-6" />
      </template>
      <template v-else-if="icon === 'plane'">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </template>
      <template v-else-if="icon === 'calendar'">
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </template>
      <template v-else-if="icon === 'book'">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </template>
      <template v-else-if="icon === 'shield'">
        <path d="M12 22s8-3.5 8-9.5V5l-8-3-8 3v7.5C4 18.5 12 22 12 22z" />
        <path d="m9 12 2 2 4-4" />
      </template>
      <template v-else-if="icon === 'eye'">
        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.6" />
      </template>
      <template v-else-if="icon === 'sparkle'">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      </template>
      <template v-else>
        <path d="M12 5v14M5 12h14" />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type BadgeIcon =
  | "pen"
  | "envelope"
  | "plane"
  | "calendar"
  | "book"
  | "shield"
  | "eye"
  | "sparkle"
  | "plus";
export type BadgeTint = "accent" | "sage" | "blue" | "blush" | "neutral" | "white";

const props = withDefaults(
  defineProps<{
    icon: BadgeIcon;
    tint?: BadgeTint;
    size?: number;
  }>(),
  { tint: "neutral", size: 40 }
);

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: `${Math.round(props.size * 0.3)}px`,
}));
</script>
