<template>
  <header class="headline">
    <span class="eyebrow red">
      QUESTION {{ paddedNo }} <i>by {{ asker }}</i>
    </span>
    <h2>{{ question }}</h2>
    <div class="rule" />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ no: number; question: string; asker: string }>();
const paddedNo = computed(() => String(props.no).padStart(2, '0'));
</script>

<style scoped>
.headline {
  margin-bottom: 18px;
}
.headline h2 {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.5;
  margin: 10px 0 14px;
  font-weight: 700;
}
.eyebrow i {
  font-style: normal;
  letter-spacing: 0.04em;
  font-weight: 600;
  color: var(--dim);
}
</style>
