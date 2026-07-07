<template>
  <figure class="quote" :class="{ still }" :style="delayStyle">
    <blockquote>{{ text }}</blockquote>
    <figcaption>
      <ParticipantDot :color="color" small /> {{ name }}
      <span v-if="note" class="note">· {{ note }}</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ParticipantDot from './ParticipantDot.vue';

const props = withDefaults(
  defineProps<{
    text: string;
    name: string;
    color: string;
    still?: boolean;
    index?: number;
    note?: string;
  }>(),
  { still: false, index: 0, note: '' },
);

const delayStyle = computed(() =>
  props.still ? {} : { animationDelay: `${0.15 + props.index * 0.22}s` },
);
</script>

<style scoped>
.quote {
  margin: 0;
  padding: 16px 2px;
  border-bottom: 1px solid var(--hairline);
  animation: rise 0.55s ease both;
}
.quote.still {
  animation: none;
}
.quote blockquote {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.75;
}
.quote figcaption {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--dim);
}
.note {
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
